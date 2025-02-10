import React from 'react';
import '../styles/OverviewPanel.css';

const OverviewPanel = () => {
  return (
    <div className="overview-panel">
      <h2>Overview</h2>
      <div className="overview-metrics">
        <div className="metric-card">
          <h3>Active Clients</h3>
          <p>25</p>
        </div>
        <div className="metric-card">
          <h3>Avg. Mood</h3>
          <p>7.2/10</p>
        </div>
        <div className="metric-card">
          <h3>Upcoming Appointments</h3>
          <p>3</p>
        </div>
      </div>
      <div className="alerts">
        <h3>Alerts</h3>
        <p>No urgent alerts</p>
      </div>
    </div>
  );
};

export default OverviewPanel;
