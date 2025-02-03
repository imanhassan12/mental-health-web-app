import React from 'react';
import CheckInForm from '../CheckInForm';

const Dashboard = () => {
  return (
    <div className="container my-4">
      <h2>Dashboard</h2>
      <p>Welcome to your personal space. Reflect and grow.</p>
      <CheckInForm />
    </div>
  );
};

export default Dashboard;
