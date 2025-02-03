import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to Mental Health Aide</h1>
        <p>Your daily companion for mindfulness and well-being</p>
      </div>
      <div className="dashboard-cards">
        <div className="card">
          <h2>Daily Check-In</h2>
          <p>Reflect on your day and track your mood.</p>
          <Link to="/checkin" className="btn">Check In</Link>
        </div>
        <div className="card">
          <h2>Skills</h2>
          <p>Explore mindfulness and coping techniques.</p>
          <Link to="/skills" className="btn">Learn More</Link>
        </div>
        <div className="card">
          <h2>Audio Journal</h2>
          <p>Record your thoughts and feelings.</p>
          <Link to="/audio" className="btn">Start Recording</Link>
        </div>
        <div className="card">
          <h2>Progress</h2>
          <p>Visualize your mood trends over time.</p>
          <Link to="/progress" className="btn">View Progress</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
