//role change only  by (ADMIN)
import { useState } from 'react';
import styles from '../styles/RoleChange.module.scss'; 
import { useRouter } from 'next/router';

const RoleChangePage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState(''); 

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requestData = {
      username,
      role
    };

    const token = localStorage.getItem('token'); 

    if (!token) {
      console.error('Token not found in localStorage');
      return;
    }

    try {
      const response = await fetch('https://chat-app-server-production-d054.up.railway.app/api/auth/user/rolechange', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('Role update failed');
      }

      setMessage('Role updated successfully');
      setMessageColor('#28a745'); 
      setUsername(''); 
      setRole(''); 

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageColor('');
      }, 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('Invalid UserName');
      setMessageColor('#dc3545'); 
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageColor('');
      }, 3000);
    }
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>User Role Change</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Select Role:</label>
            <select
              className="form-control"
              id="role"
              name="role"
              value={role}
              onChange={handleRoleChange}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={!role}>
            Change Role
          </button>
        </form>
        {message && <div className="mt-3" style={{ color: messageColor }}>{message}</div>}
      </div>
    </div>
  );
};

export default RoleChangePage;
