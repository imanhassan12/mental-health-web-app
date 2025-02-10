import React, { useState } from 'react';
import { FaUser, FaLock, FaRegSmile } from 'react-icons/fa';
import '../styles/LoginPage.css';

const LoginPage = () => {
  // Toggle between Login and Create Account views
  const [isLogin, setIsLogin] = useState(true);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Create account state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createAccountMessage, setCreateAccountMessage] = useState('');

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoginMessage('Logged in successfully!');
        // Redirect or update app state
        window.location.href = '/';
      } else {
        setLoginMessage(data.message || 'Incorrect username or password.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setLoginMessage('An error occurred. Please try again.');
    }
  };

  // Handle Create Account submission
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !newUsername || !newPassword) {
      setCreateAccountMessage('Please fill in all fields.');
      return;
    }
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username: newUsername,
          password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreateAccountMessage('Account created successfully. You can now log in.');
        setIsLogin(true);
      } else {
        setCreateAccountMessage(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setCreateAccountMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>

        {isLogin ? (
          <form onSubmit={handleLogin}>
            {/* Username Field */}
            <div className="form-group">
              <label>
                <FaUser className="icon" /> Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label>
                <FaLock className="icon" /> Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            {/* Error/Success Message */}
            {loginMessage && <div className="message">{loginMessage}</div>}

            <button type="submit" className="btn primary">Login</button>

            <p className="toggle">
              Don’t have an account?{' '}
              <span
                onClick={() => {
                  setIsLogin(false);
                  setLoginMessage('');
                }}
              >
                Create Account
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount}>
            {/* First Name */}
            <div className="form-group">
              <label>
                <FaRegSmile className="icon" /> First Name
              </label>
              <input
                type="text"
                placeholder="Your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label>
                <FaRegSmile className="icon" /> Last Name
              </label>
              <input
                type="text"
                placeholder="Your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            {/* Username */}
            <div className="form-group">
              <label>
                <FaUser className="icon" /> Username
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label>
                <FaLock className="icon" /> Password
              </label>
              <input
                type="password"
                placeholder="Choose a password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {/* Error/Success Message */}
            {createAccountMessage && (
              <div className="message">{createAccountMessage}</div>
            )}

            <button type="submit" className="btn primary">Sign Up</button>

            <p className="toggle">
              Already have an account?{' '}
              <span
                onClick={() => {
                  setIsLogin(true);
                  setCreateAccountMessage('');
                }}
              >
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
