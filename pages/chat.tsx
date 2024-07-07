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

let socket: Socket | null = null; // Initialize socket as null

const Chat = () => {
  const [message, setMessage] = useState<string>(''); // State to hold the current message being typed
  const [messages, setMessages] = useState<Message[]>([]); // State to hold all chat messages
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null); // State to hold the selected expert (for students)
  const [role, setRole] = useState<string>(''); // State to hold the role of the user (student or expert)
  const [username, setUsername] = useState<string>(''); // State to hold the username of the current user
  const [error, setError] = useState<string>(''); // State to hold error messages
  const [loading, setLoading] = useState<boolean>(true); // State to manage loading

  const router = useRouter();
  const { student } = router.query; // Get the student username from query parameters

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/'); // Redirect to login page if token is not found
      return;
    }

    const parsedToken = JSON.parse(atob(token.split('.')[1])); // Decode token payload
    setRole(parsedToken.role); // Set user role
    setUsername(parsedToken.username); // Set username

    if (parsedToken.role === 'student') {
      const storedExpert = localStorage.getItem('selectedExpert');
      if (storedExpert) {
        const expert: Expert = JSON.parse(storedExpert);
        setSelectedExpert(expert); // Set selected expert for student
        fetchPastMessages(parsedToken.username, expert.username, token); // Fetch past messages for selected expert
      }
    }

    // Initialize socket connection only once
    if (!socket) {
      socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}`, {
        query: { token },
      });

      // Listen for incoming messages
      socket.on('message', (newMessage: Message) => {
        handleIncomingMessage(newMessage);
      });
    }

    // Fetch student messages when component mounts
    const fetchStudentMessages = async () => {
      try {
        if (!student) {
          return; // Exit early if student is not defined
        }

        const token = localStorage.getItem('token'); // Get JWT token

        const response = await fetch(`https://chat-app-server-production-d054.up.railway.app/api/auth/messages/student?selectedStudent=${encodeURIComponent(student as string)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json(); 
        setMessages(data); 
        setLoading(false); // Set loading to false after messages are fetched
      } catch (error) {
        setError('Error fetching messages: ' + error.message);
        setLoading(false); // Set loading to false if there's an error
      }
    };

    fetchStudentMessages(); // Call fetchStudentMessages

    return () => {
      // Clean up socket listener when component unmounts
      if (socket) {
        socket.off('message'); // Turn off message listener
        socket = null; // Reset socket instance
      }
    };
  }, [router, student]);

  // Function to handle incoming messages
  const handleIncomingMessage = (newMessage: Message) => {
    if (isMessageRelevant(newMessage)) {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  };

  // Function to fetch past messages between user and selected expert
  const fetchPastMessages = async (username: string, selectedExpert: string, token: string | null) => {
    try {
      const res = await fetch(`https://chat-app-server-production-d054.up.railway.app/api/auth/messages?username=${username}&selectedExpert=${selectedExpert}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch past messages');
      }
      const data = await res.json(); // Parse response to JSON
      setMessages(data); // Set fetched messages to state
      setLoading(false); // Set loading to false after messages are fetched
    } catch (error) {
      setError('Error fetching past messages: ' + error.message);
      setLoading(false); // Set loading to false if there's an error
    }
  };

  // Function to send a new message
  const sendMessage = () => {
    try {
      if (selectedExpert && message.trim() !== '') {
        const newMessage: Message = {
          sender: username,
          receiver: selectedExpert.username,
          message: message.trim(),
          timestamp: new Date().toISOString(), 
        };
        if (socket) {
          socket.emit('message', newMessage); // Emit message event to server
        }
        setMessage(''); // Clear message input
      } else if (role === 'expert' && student && message.trim() !== '') {
        const newMessage: Message = {
          sender: username,
          receiver: student as string, // Set the receiver to the student
          message: message.trim(),
          timestamp: new Date().toISOString(), 
        };
        if (socket) {
          socket.emit('message', newMessage); // Emit message event to server
        }
        setMessage(''); // Clear message input
      } else {
        throw new Error('No expert selected or message typed.');
      }
    } catch (error) {
      setError('Error sending message: ' + error.message);
    }
  };

  // Function to handle expert reply to a specific message
  const handleExpertReply = (originalMessage: Message) => {
    try {
      if (message.trim() !== '') {
        const replyMessage: Message = {
          sender: username,
          receiver: originalMessage.sender, // Reply to the original sender
          message: message.trim(),
          timestamp: new Date().toISOString(), 
        };
        if (socket) {
          socket.emit('message', replyMessage); // Emit reply message event to server
        }
        setMessage(''); // Clear message input
      } else {
        throw new Error('No message typed to reply.');
      }
    } catch (error) {
      setError('Error replying to message: ' + error.message);
    }
  };

  // Function to handle user logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove JWT token from local storage
    localStorage.removeItem('selectedExpert'); // Clear selectedExpert on logout
    router.push('/'); // Redirect to login page
  };

  // Function to determine if a message is relevant to the current chat
  const isMessageRelevant = (msg: Message): boolean => {
    if (role === 'student' && selectedExpert) {
      // Show messages sent to and received from the selected expert
      return (msg.sender === username && msg.receiver === selectedExpert.username) ||
             (msg.sender === selectedExpert.username && msg.receiver === username);
    } else if (role === 'expert' && student) {
      // Show messages sent to and received from the student
      return (msg.sender === username && msg.receiver === student) ||
             (msg.sender === student && msg.receiver === username);
    }
    return false;
  };

  // Render chat interface
  return (
    <div className={styles['chat-container']}>
      <div className={styles['chat-header']}>
        <h1>Chat</h1>
        <div className={styles['header-content']}>
          {/* Display chat header based on user role */}
          {role === 'student' && selectedExpert && (
            <h2>Chatting with <span className={styles['highlighted-name']}>{selectedExpert.username}</span></h2>
          )}
          {role === 'expert' && student && (
            <h2>Chatting with <span className={styles['highlighted-name']}>{student}</span></h2>
          )}
          <LogoutButton onLogout={handleLogout} /> {/* Logout button component */}
        </div>
      </div>
      <div className={styles['chat-messages']}>
        {/* Display messages or error message */}
        {loading && <p>Loading messages...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.sender === username; // Determine if the message is sent by the current user
            const displayedName = isOwnMessage ? 'YOU' : msg.sender; // Display name as 'YOU' for own messages, sender's username for others

            // Format message timestamp
            const messageTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return isMessageRelevant(msg) && ( // Render message if it's relevant to the current chat
              <div
                key={msg._id || index} // Use _id as key if available, else use index
                className={`${styles.message} ${
                  isOwnMessage ? styles['own-message'] : styles['other-message']
                }`}
              >
                <div className={styles['message-content']}>
                  <span className={styles['message-sender']}>{displayedName}:</span>
                  <span className={styles['message-text']}>{msg.message}</span>
                  <span className={styles['message-time']}>{messageTime}</span> {/* Display message time */}
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className={styles['message-input']}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)} // Handle input change
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage(); 
            }
          }}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button> {/* Send message button */}
      </div>
    </div>
  );
};

export default Chat;


