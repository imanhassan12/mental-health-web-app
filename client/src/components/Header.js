// client/src/components/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Left side brand/logo */}
      <div className="header__brand">Practitioner Aide</div>

      {/* Right side for user/logout */}
      <div className="header__right">
        <button onClick={handleLogout} className="header__logout">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
