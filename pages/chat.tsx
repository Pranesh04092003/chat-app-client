import { useEffect, useState, KeyboardEvent } from 'react';
import { useRouter } from 'next/router';
import io, { Socket } from 'socket.io-client';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/Chat.module.scss'; // Import the CSS module

interface Message {
    _id: string;
    sender: string;
    receiver: string;
    message: string;
    timestamp: string; // Add timestamp field
}

interface Expert {
    _id: string;
    username: string;
}

let socket: Socket | null = null; // Initialize socket as null

const Chat = () => {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
    const [role, setRole] = useState<string>('');
    const [username, setUsername] = useState<string>('');

    const router = useRouter();
    const { student } = router.query; // Get the student username from query parameters

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
                fetchPastMessages(username, expert.username, token); // Fetch past messages for selected expert
            }
        }

        // Initialize socket connection only once
        if (!socket) {
            socket = io('https://chat-app-server-production-d054.up.railway.app', {
                query: { token },
            });

            socket.on('message', (newMessage: Message) => {
                console.log('Received new message:', newMessage);
                // Check if the message is relevant to the current chat
                if (isMessageRelevant(newMessage)) {
                    setMessages(prevMessages => [...prevMessages, newMessage]);
                }
            });
        }

        return () => {
            // Clean up socket listener when component unmounts
            if (socket) {
                socket.off('message');
                socket = null;
            }
        };
    }, [router, username]);

    useEffect(() => {
        const fetchStudentMessages = async () => {
            if (!student) {
                return; // Exit early if student is not defined
            }
    
            const token = localStorage.getItem('token');
    
            try {
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
                timestamp: new Date().toISOString(), // Set timestamp
            };
            if (socket) {
                socket.emit('message', newMessage);
                // Note: Avoid updating messages state here; rely on socket event to update messages
            }
            setMessage('');
        } else if (role === 'expert' && message.trim() !== '') {
            const newMessage: Message = {
                _id: '',
                sender: username,
                receiver: student as string, // Set the receiver to the student
                message: message.trim(),
                timestamp: new Date().toISOString(), // Set timestamp
            };
            if (socket) {
                socket.emit('message', newMessage);
                // Note: Avoid updating messages state here; rely on socket event to update messages
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
                timestamp: new Date().toISOString(), // Set timestamp
            };
            if (socket) {
                socket.emit('message', replyMessage);
                // Note: Avoid updating messages state here; rely on socket event to update messages
            }
            setMessage('');
        } else {
            console.error('No message typed to reply.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('selectedExpert'); // Clear selectedExpert on logout
        router.push('/');
    };

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

    const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className={styles.chatContainer}>
            <h1 className={styles.chatHeader}>Chat</h1>
            <LogoutButton onLogout={handleLogout} />
            {role === 'student' && selectedExpert && <h2 className={styles.chatSubHeader}>USER PAGE Chatting with {selectedExpert.username}</h2>}
            {role === 'expert' && student && <h2 className={styles.chatSubHeader}>EXPERT PAGE Chatting with {student}</h2>}
            <div className={styles.messagesContainer}>
                {messages.length === 0 ? (
                    <p className={styles.noMessages}>No messages yet</p>
                ) : (
                    messages.map((msg, index) => (
                        // Check if the message is relevant to the current chat context
                        (isMessageRelevant(msg) && (
                            <div key={msg._id || index} className={styles.message}>
                                {msg.sender === username ? `${msg.sender}: ` : `${msg.sender}: `}
                                {msg.message}
                                {/* Format message timestamp */}
                                <span className={styles.messageTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> {/* Display message time */}
                            </div>
                        ))
                    ))
                )}
            </div>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress} // Add key press event
                className={styles.inputField}
            />
            <button onClick={sendMessage} className={styles.sendButton}>Send</button>
        </div>
    );
};

export default Chat;
