// client/src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {/* Dashboard remains the same */}
        <Link to="/" className="sidebar__link">Dashboard</Link>
        
        {/* Clients remains the same */}
        <Link to="/clients" className="sidebar__link">Clients</Link>
        
        {/* Rename “Daily Check-Ins” => “Session Notes,” path => /notes */}
        <Link to="/notes" className="sidebar__link">Session Notes</Link>
        
        {/* Rename “Skills” => “Resources,” path => /resources */}
        <Link to="/resources" className="sidebar__link">Resources</Link>
        
        
        
        {/* Appointments stays the same */}
        <Link to="/appointments" className="sidebar__link">Appointments</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
