// client/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [activeClients, setActiveClients] = useState(0);
  const [avgMood, setAvgMood] = useState(null); 
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [alerts, setAlerts] = useState([]); // e.g. array of “risk” items
  const [recentClients, setRecentClients] = useState([]);
  const [topGoals, setTopGoals] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todaysAppointments, setTodaysAppointments] = useState([]);

  useEffect(() => {
    // Example: fetch from your actual endpoints
    Promise.all([
      fetch('/api/dashboard-stats').then(r => r.json()),
      fetch('/api/dashboard-clients').then(r => r.json()),
      fetch('/api/dashboard-notes').then(r => r.json()),
      // ... etc.
    ])
    .then(([statsData, clientsData, notesData]) => {
      setActiveClients(statsData.activeClients);
      setAvgMood(statsData.avgMood);
      setUpcomingCount(statsData.upcomingAppointments);
      setAlerts(statsData.alerts);
      setRecentClients(clientsData.recent || []);
      setTopGoals(statsData.topGoals || []);
      setRecentNotes(notesData.recent || []);
      setTodaysAppointments(statsData.todaysAppointments || []);
    })
    .catch(err => console.error('Error fetching dashboard data:', err));
  }, []);

  return (
    <div className="dashboard-page">
      <h2 className="dashboard-title">Overview</h2>

      {/* Top Stats Row */}
      <div className="dashboard-stats-row">
        <div className="stat-card">
          <h3>Active Clients</h3>
          <p className="stat-value">{activeClients}</p>
        </div>

        

        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p className="stat-value">{upcomingCount}</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="alerts-section">
        <h3>Alerts</h3>
        {alerts.length === 0 ? (
          <p>No urgent alerts</p>
        ) : (
          <ul>
            {alerts.map(alert => (
              <li key={alert.id}>
                {alert.message} <Link to={alert.link}>View</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Next Row: Clients, Mood Trends, Goals */}
      <div className="dashboard-lower-row">
        <div className="dashboard-card">
          <h3>Clients</h3>
          {recentClients.length === 0 ? (
            <p>No recent updates.</p>
          ) : (
            <ul>
              {recentClients.map(c => (
                <li key={c.id}>
                  {c.name}: Last Check-In {c.lastCheckIn} | Mood: {c.mood}/10
                </li>
              ))}
            </ul>
          )}
          <Link to="/clients">View All Clients</Link>
        </div>

        {/* Mood Trends (optional) */}
        <div className="dashboard-card">
          <h3>Mood Trends</h3>
          <p>Chart Placeholder</p>
          <Link to="/progress">See Full Analytics</Link>
        </div>

        <div className="dashboard-card">
          <h3>Goals</h3>
          {topGoals.length === 0 ? (
            <p>No goals set.</p>
          ) : (
            topGoals.map(goal => (
              <div key={goal.id} className="goal-item">
                <p>{goal.title}</p>
                <div className="goal-bar">
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span>{goal.progress}%</span>
              </div>
            ))
          )}
          <Link to="/goals">Manage Goals</Link>
        </div>
      </div>

      {/* Another Row: Session Notes & Today’s Appointments */}
      <div className="dashboard-lower-row">
      
<div className="dashboard-card">
  <h3>Session Notes</h3>
  {recentNotes.length === 0 ? (
    <p>No recent notes.</p>
  ) : (
    <ul>
      {recentNotes.map(note => (
        <li key={note.id}>
          <strong>{note.sessionDate}</strong> - {note.moodRating || '--'}/10 mood
          <Link to={`/sessionNotes/${note.id}`}> View</Link>
        </li>
      ))}
    </ul>
  )}
  {/* Quick link to add a new note */}
  <Link to="/sessionNotes/new" className="btn primary small-btn">
    + Add Session Note
  </Link>
</div>


        <div className="dashboard-card">
          <h3>Today’s Appointments</h3>
          {todaysAppointments.length === 0 ? (
            <p>No appointments scheduled today.</p>
          ) : (
            <ul>
              {todaysAppointments.map(a => (
                <li key={a.id}>
                  {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}– {a.clientName}
                  <Link to={`/appointments/${a.id}`}> Details</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
