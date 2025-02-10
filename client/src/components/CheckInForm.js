import React, { useState } from 'react';

const CheckInForm = () => {
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Check-In submitted:', { mood, note });
    setMessage('Check-in submitted successfully!');
    setMood('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="checkin-form">
      <div className="form-group">
        <label htmlFor="mood">Mood (1-10):</label>
        <input
          type="number"
          id="mood"
          min="1"
          max="10"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="Enter your mood rating"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="note">Note:</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter a note about your day"
        />
      </div>
      {message && <div className="message">{message}</div>}
      <button type="submit" className="btn primary">Submit Check-In</button>
    </form>
  );
};

export default CheckInForm;
