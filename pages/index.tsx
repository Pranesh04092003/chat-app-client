//index---login and register
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Register.module.scss'; 

const IndexPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (error) {
      setErrorMessage('Invalid credentials');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Login</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
            />
          </div>
          {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
          <div>
            <button
              type="submit"
              className={styles.button}
            >
              Login
            </button>
          </div>
        </form>
        <div className={styles.linkContainer}>
          <p>
            Don't have an account?{' '}
            <Link href="/register" passHref>
              <span className={styles.link}>Register here</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
