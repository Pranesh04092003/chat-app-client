import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io, { Socket } from 'socket.io-client';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/chat.module.scss';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  timestamp: string;
}


interface Expert {
  _id: string;
  username: string;
}

let socket: Socket | null = null;

const Chat = () => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [role, setRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  const router = useRouter();
  const { student } = router.query;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    const parsedToken = JSON.parse(atob(token.split('.')[1]));
    setRole(parsedToken.role);
    setUsername(parsedToken.username);

    if (parsedToken.role === 'student') {
      const storedExpert = localStorage.getItem('selectedExpert');
      if (storedExpert) {
        const expert: Expert = JSON.parse(storedExpert);
        setSelectedExpert(expert);
        fetchPastMessages(username, expert.username, token);
      }
    }

    if (!socket) {
      socket = io('https://chat-app-server-production-d054.up.railway.app', {
        query: { token },
      });

      socket.on('message', (newMessage: Message) => {
        console.log('Received new message:', newMessage);
        if (isMessageRelevant(newMessage)) {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('message');
        socket = null;
      }
    };
  }, [router, username]);

  useEffect(() => {
    const fetchStudentMessages = async () => {
      if (!student) {
        return;
      }

      const token = localStorage.getItem('token');

      try {
        const response = await fetch(
          `https://chat-app-server-production-d054.up.railway.app/api/auth/messages/student?selectedStudent=${encodeURIComponent(
            student as string
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching messages:', error.message);
        } else {
          console.error('Unexpected error fetching messages');
        }
      }
    };

    fetchStudentMessages();
  }, [router, student]);

  const fetchPastMessages = async (
    username: string,
    selectedExpert: string,
    token: string | null
  ) => {
    try {
      const res = await fetch(
        `https://chat-app-server-production-d054.up.railway.app/api/auth/messages?username=${username}&selectedExpert=${selectedExpert}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error('Failed to fetch past messages');
      }
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching past messages:', error.message);
      } else {
        console.error('Unexpected error fetching past messages');
      }
    }
  };

  const sendMessage = () => {
    if (selectedExpert && message.trim() !== '') {
      const newMessage: Message = {
        _id: '',
        sender: username,
        receiver: selectedExpert.username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      if (socket) {
        socket.emit('message', newMessage);
      }
      setMessage('');
    } else if (role === 'expert' && message.trim() !== '') {
      const newMessage: Message = {
        _id: '',
        sender: username,
        receiver: student as string,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      if (socket) {
        socket.emit('message', newMessage);
      }
      setMessage('');
    } else {
      console.error('No expert selected or message typed.');
    }
  };

  const handleExpertReply = (originalMessage: Message) => {
    if (message.trim() !== '') {
      const replyMessage: Message = {
        _id: '',
        sender: username,
        receiver: originalMessage.sender,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };
      if (socket) {
        socket.emit('message', replyMessage);
      }
      setMessage('');
    } else {
      console.error('No message typed to reply.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedExpert');
    router.push('/');
  };

  const isMessageRelevant = (msg: Message): boolean => {
    if (role === 'student' && selectedExpert) {
      return (
        (msg.sender === username && msg.receiver === selectedExpert.username) ||
        (msg.sender === selectedExpert.username && msg.receiver === username)
      );
    } else if (role === 'expert' && student) {
      return (
        (msg.sender === username && msg.receiver === student) ||
        (msg.sender === student && msg.receiver === username)
      );
    }
    return false;
  };

  return (
    <div className={styles.chatContainer}>
      <h1 className={styles.chatHeader}>Chat</h1>
      <LogoutButton onLogout={handleLogout} />
      {role === 'student' && selectedExpert && (
        <h2 className={styles.chatSubheader}>
          USER PAGE Chatting with {selectedExpert.username}
        </h2>
      )}
      {role === 'expert' && student && (
        <h2 className={styles.chatSubheader}>
          EXPERT PAGE Chatting with {student}
        </h2>
      )}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            isMessageRelevant(msg) && (
              <div key={msg._id || index} className={styles.message}>
                {msg.sender === username ? `${msg.sender}: ` : `${msg.sender}: `}
                {msg.message}
                <span className={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )
          ))
        )}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={styles.inputField}
        />
        <button onClick={sendMessage} className={styles.sendButton}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
