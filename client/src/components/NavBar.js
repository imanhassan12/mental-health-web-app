// client/src/components/NavBar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = () => {
  const navigate = useNavigate();

  // Check for authentication by looking for a token in localStorage
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem('token');
    // Optionally, clear any additional authentication state here
    // Redirect to the login page
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Mental Health Aide</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/checkin">Check-In</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/skills">Skills</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/audio">Audio Journal</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/progress">Progress</Link>
                </li>
                <li className="nav-item">
                  <button className="nav-link btn btn-link" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
