import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io, { Socket } from 'socket.io-client';
import LogoutButton from '../components/LogoutButton';

interface Message {
    _id: string;
    sender: string;
    receiver: string;
    message: string;
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
            socket = io('http://localhost:5000', {
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
                const response = await fetch(`http://localhost:5000/api/auth/messages/student?selectedStudent=${encodeURIComponent(student as string)}`, {
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
                console.error('Error fetching messages:', error.message);
            }
        };
    
        fetchStudentMessages();
    }, [router, student]);
    
    const fetchPastMessages = async (username: string, selectedExpert: string, token: string | null) => {
        try {
            const res = await fetch(`http://localhost:5000/api/auth/messages?username=${username}&selectedExpert=${selectedExpert}`, {
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
            console.error('Error fetching past messages:', error.message);
        }
    };

    const sendMessage = () => {
        if (selectedExpert && message.trim() !== '') {
            const newMessage: Message = {
                sender: username,
                receiver: selectedExpert.username,
                message: message.trim(),
            };
            if (socket) {
                socket.emit('message', newMessage);
                // Note: Avoid updating messages state here; rely on socket event to update messages
            }
            setMessage('');
        } else if (role === 'expert' && message.trim() !== '') {
            const newMessage: Message = {
                sender: username,
                receiver: student as string, // Set the receiver to the student
                message: message.trim(),
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
                sender: username,
                receiver: originalMessage.sender,
                message: message.trim(),
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
    

    return (
        <div>
            <h1>Chat</h1>
            <LogoutButton onLogout={handleLogout} />
            {role === 'student' && selectedExpert && <h2>USER PAGE Chatting with {selectedExpert.username}</h2>}
            {role === 'expert' && student && <h2>EXPERT PAGE Chatting with {student}</h2>}
            <div>
                {messages.length === 0 ? (
                    <p>No messages yet</p>
                ) : (
                    messages.map((msg, index) => (
                        // Check if the message is relevant to the current chat context
                        (isMessageRelevant(msg) && (
                            <div key={msg._id || index}>
                                {msg.sender === username ? `${msg.sender}: ` : `${msg.sender}: `}
                                {msg.message}
                            </div>
                        ))
                    ))
                )}
            </div>

            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
