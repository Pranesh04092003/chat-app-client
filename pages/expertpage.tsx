import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/AvailableExperts.module.scss'; 
import LogoutButton from '../components/LogoutButton'; 

export default function ExpertPage() {
    const [students, setStudents] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchStudents = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/students/messaged', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch students');
                }

                const studentsData = await response.json();
                setStudents(studentsData);
            } catch (error) {
                setErrorMessage(error.message);
            }
        };

        fetchStudents();
    }, []); 

    const handleLogout = () => {
        localStorage.removeItem('token');
        // Redirect to login page
        router.replace('/');
    };

    const navigateToChatPage = (studentUsername: string) => {
        // Redirect to chat page with selected student username
        router.push(`/chat?student=${encodeURIComponent(studentUsername)}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.title}>
                    <h4>Expert Dashboard</h4>
                    <p>Students who messaged</p>
                </div>
                <div className={styles.expertsList}>
                    {students.length > 0 ? (
                        students.map((student, index) => (
                            <div key={index} className={styles.expertItem} onClick={() => navigateToChatPage(student)}>
                                <p className={styles.expertUsername}>{student}</p>
                            </div>
                        ))
                    ) : (
                        <p>No students have messaged you yet.</p>
                    )}
                </div>
                <div className={styles.logoutContainer}>
                    {/* Render LogoutButton component */}
                    <LogoutButton onLogout={handleLogout} />
                </div>
            </div>
        </div>
    );
}
