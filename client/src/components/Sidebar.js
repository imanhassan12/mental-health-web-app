// client/src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaClipboardList, FaBook, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import '../styles/Sidebar.css';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  // Function to determine if a link is active
  const getActiveLinkClass = ({ isActive }) => 
    isActive ? "sidebar__link sidebar__link--active" : "sidebar__link";

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {/* Dashboard with icon */}
        <NavLink to="/" className={getActiveLinkClass} end>
          <FaHome className="sidebar__icon" />
          <span>Dashboard</span>
        </NavLink>
        
        {/* Clients with icon */}
        <NavLink to="/clients" className={getActiveLinkClass}>
          <FaUsers className="sidebar__icon" />
          <span>Clients</span>
        </NavLink>
        
        {/* Session Notes with icon */}
        <NavLink to="/notes" className={getActiveLinkClass}>
          <FaClipboardList className="sidebar__icon" />
          <span>Session Notes</span>
        </NavLink>
        
        {/* Resources with icon */}
        <NavLink to="/resources" className={getActiveLinkClass}>
          <FaBook className="sidebar__icon" />
          <span>Resources</span>
        </NavLink>
        
        {/* Appointments with icon */}
        <NavLink to="/appointments" className={getActiveLinkClass}>
          <FaCalendarAlt className="sidebar__icon" />
          <span>Appointments</span>
        </NavLink>
        
        {/* Mood Analytics with icon */}
        <NavLink to="/mood-analytics" className={getActiveLinkClass}>
          <FaChartLine className="sidebar__icon" />
          <span>Mood Analytics</span>
        </NavLink>

        {/* Tasks with icon */}
        <NavLink to="/tasks" className={getActiveLinkClass}>
          <span role="img" aria-label="Tasks">🗂️</span> Tasks
        </NavLink>

        {/* Reminders with icon */}
        <NavLink to="/reminders" className={getActiveLinkClass}>
          <span role="img" aria-label="Reminders">🔔</span> Reminders
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
