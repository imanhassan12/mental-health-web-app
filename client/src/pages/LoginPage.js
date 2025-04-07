import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaRegSmile } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import '../styles/LoginPage.css';

const LoginPage = () => {
  // For navigation after login
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from || '/';
  
  // Toggle between Login and Create Account views
  const [isLogin, setIsLogin] = useState(true);

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create account state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createAccountMessage, setCreateAccountMessage] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    if (AuthService.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await AuthService.login(loginUsername, loginPassword);
      setLoginMessage('Logged in successfully!');
      
      // Use React Router's navigate for better SPA navigation
      // Redirect to the page they were trying to access or the dashboard
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error during login:', error);
      setLoginMessage(
        error.response?.data?.message || 'Incorrect username or password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Create Account submission
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !newUsername || !newPassword) {
      setCreateAccountMessage('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      const userData = {
        firstName,
        lastName,
        username: newUsername,
        password: newPassword,
        email: `${newUsername}@example.com`, // This should be changed in a real app
      };
      
      await AuthService.register(userData);
      setCreateAccountMessage('Account created successfully. You can now log in.');
      setIsLogin(true);
    } catch (error) {
      console.error('Error during registration:', error);
      setCreateAccountMessage(
        error.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {/* Error/Success Message */}
            {loginMessage && <div className="message">{loginMessage}</div>}

            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <p className="toggle">
              Don't have an account?{' '}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            {/* Error/Success Message */}
            {createAccountMessage && (
              <div className="message">{createAccountMessage}</div>
            )}

            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

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
