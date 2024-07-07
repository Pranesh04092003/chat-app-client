import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LogoutButton from '../components/LogoutButton';
import styles from '../styles/AvailableExperts.module.scss'; 

interface Expert {
    _id: string;
    username: string;
}

const AvailableExperts = () => {
    const [availableExperts, setAvailableExperts] = useState<Expert[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchExperts = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const res = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/experts', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setAvailableExperts(data);
                    } else {
                        console.error('Failed to fetch experts:', res.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching experts:', error);
                }
            } else {
                console.error('Token not found in localStorage');
                // Handle the case where token is null, maybe redirect to login or handle the error
            }
        };

        fetchExperts();
    }, []);

    const selectExpert = (expert: Expert) => {
        localStorage.setItem('selectedExpert', JSON.stringify(expert));
        const token = localStorage.getItem('token');

        if (token) {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                try {
                    const parsedToken = JSON.parse(atob(tokenParts[1]));
                    const studentUsername = parsedToken.username;
                    router.push(`/chat?student=${encodeURIComponent(studentUsername)}`);
                } catch (error) {
                    console.error('Error parsing token:', error);
                    // Handle parsing error
                }
            } else {
                console.error('Invalid token format');
                // Handle invalid token format error
            }
        } else {
            console.error('Token not found in localStorage');
            // Handle the case where token is null, maybe redirect to login or handle the error
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        // Clear history to prevent navigation back to this page
        router.replace('/');
    };

    return (
        <div className={styles.pageContainer}>
            <h1>Available Experts</h1>
            <LogoutButton onLogout={handleLogout} /> {/* Logout button added here */}
            <div className={styles.expertList}>
                {availableExperts.map((expert) => (
                    <div
                        key={expert._id}
                        className={styles.expertItem}
                        onClick={() => selectExpert(expert)}
                    >
                        {expert.username}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AvailableExperts;
