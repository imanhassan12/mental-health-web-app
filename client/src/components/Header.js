// client/src/components/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import AuthService from '../services/auth.service';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Left side brand/logo */}
      <div className="header__brand">Mental Health Practitioner Aide</div>

      {/* Right side for user/logout */}
      <div className="header__right">
        {currentUser && (
          <>
            <div className="header__user">
              <FaUser className="header__user-icon" />
              <span className="header__username">{currentUser.name}</span>
            </div>
            <button onClick={handleLogout} className="header__logout">
              <FaSignOutAlt className="header__logout-icon" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
