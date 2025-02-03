import React, { useState } from 'react';
import { FaSmile, FaCommentAlt } from 'react-icons/fa';
import './CheckInForm.css';

const CheckInForm = () => {
  const [mood, setMood] = useState('');
  const [message, setMessage] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:4000/api/checkin', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, message }),
      });
      const data = await res.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error('Error:', error);
      setResponseMessage('Check-in failed. Please try again.');
    }
  };

  return (
    <div className="checkin-card card shadow p-4">
      <h2 className="card-title mb-4">Daily Check-In</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3 input-group">
          <span className="input-group-text"><FaSmile /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Your mood (e.g. happy, calm)"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>
        <div className="mb-3 input-group">
          <span className="input-group-text"><FaCommentAlt /></span>
          <input
            type="text"
            className="form-control"
            placeholder="Optional note..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Submit Check-In
        </button>
      </form>
      {responseMessage && (
        <div className="alert alert-info mt-3" role="alert">
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
