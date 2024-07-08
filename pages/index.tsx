// Index.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Register.module.scss';

const IndexPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const router = useRouter();

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const response = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);

            const parsedToken = JSON.parse(atob(data.token.split('.')[1]));
            const role = parsedToken.role;

            if (role === 'admin') {
                router.push('/rolechange');
            } else if (role === 'expert') {
                router.push('/expertpage');
            } else {
                router.push('/AvailableExperts');
            }

            clearFormAndMessages(); // Clear form and messages
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage('Invalid credentials');
            clearFormInputs(); // Clear username and password fields
            setTimeout(() => {
                setErrorMessage('');
            }, 3000); // Clear error message after 3 seconds
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const response = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                setRegisterSuccess(true);
                setErrorMessage('');
                alert('Registration successful');
                setTimeout(() => {
                    setRegisterSuccess(false);
                    router.push('/'); // Redirect to login page after registration success
                }, 3000); // Clear register success message after 3 seconds
                clearFormAndMessages(); // Clear form and messages
            } else {
                const data = await response.json();
                setRegisterSuccess(false);
                setErrorMessage('Registration failed: ' + data.message);
                clearFormInputs(); // Clear username and password fields
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000); // Clear error message after 3 seconds
            }
        } catch (error) {
            console.error('Error:', error);
            setRegisterSuccess(false);
            setErrorMessage('Registration failed: Username already exists');
            clearFormInputs(); // Clear username and password fields
            setTimeout(() => {
                setErrorMessage('');
            }, 3000); // Clear error message after 3 seconds
        }
    };

    const toggleForms = () => {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm && registerForm) {
            loginForm.classList.toggle(styles.hidden);
            registerForm.classList.toggle(styles.hidden);
        }
    };

    const clearFormAndMessages = () => {
        setUsername('');
        setPassword('');
        setTimeout(() => {
            setErrorMessage('');
            setRegisterSuccess(false);
        }, 3000); // Clear messages after 3 seconds
    };

    const clearFormInputs = () => {
        setUsername('');
        setPassword('');
    };

    return (
        <div className={styles.container}>
            <div id="login-form" className={styles.form}>
                <h2>Login</h2>
                <form onSubmit={handleLoginSubmit}>
                    <div className={styles['form-group']}>
                        <label htmlFor="login-username">Username:</label>
                        <input
                            type="text"
                            id="login-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="login-password">Password:</label>
                        <input
                            type="password"
                            id="login-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                    {registerSuccess && <p className={styles.successMessage}>Registration successful!</p>}
                    <div className={styles['form-group']}>
                        <button type="submit" className={styles.button}>Login</button>
                    </div>
                </form>
                <button className={styles['toggle-btn']} onClick={toggleForms}>Don't have an account? Register here</button>
            </div>

            <div id="register-form" className={`${styles.form} ${styles.hidden}`}>
                <h2>Register</h2>
                <form onSubmit={handleRegisterSubmit}>
                    <div className={styles['form-group']}>
                        <label htmlFor="register-username">Username:</label>
                        <input
                            type="text"
                            id="register-username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="register-password">Password:</label>
                        <input
                            type="password"
                            id="register-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                            required
                        />
                    </div>
                    {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
                    {registerSuccess && <p className={styles.successMessage}>Registration successful!</p>}
                    <div className={styles['form-group']}>
                        <button type="submit" className={styles.button}>Register</button>
                    </div>
                </form>
                <button className={styles['toggle-btn']} onClick={toggleForms}>Already have an account? Login here</button>
            </div>
        </div>
    );
};

export default IndexPage;
