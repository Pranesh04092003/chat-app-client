import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Register.module.scss'; 

export default function Register() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const router = useRouter();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (res.status === 201) {
            alert('Registration successful! Please login.');
            // router.push('/');
        } else {
            alert('Registration failed');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>Register</h2>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className={styles.label}>Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            className={styles.input}
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className={styles.label}>Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button type="submit" className={styles.button}>Register</button>
                </form>
                <div className={styles.linkContainer}>
                    <p>
                        Already have an account?{' '}
                        <a href="/" className={styles.link}>Login here</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
