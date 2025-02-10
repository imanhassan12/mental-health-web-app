// client/src/pages/SessionNotesPage.js
import React, { useState } from 'react';
import '../styles/SessionNotes.css';

const SessionNotesPage = () => {
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd POST to an endpoint like /api/sessionNotes
    console.log('Creating new session note:', { mood, note });
    // Clear fields or navigate somewhere
    setMood('');
    setNote('');
  };

  return (
    <div className="session-notes-page">
      <h2>New Session Note</h2>
      <form onSubmit={handleSubmit} className="session-note-form">
        <div className="form-group">
          <label htmlFor="mood">Mood (1-10):</label>
          <input
            type="number"
            min="1"
            max="10"
            id="mood"
            placeholder="Enter mood rating"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">Note:</label>
          <textarea
            id="note"
            placeholder="Enter session observations or key points"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="submit" className="btn primary">
          Save Session Note
        </button>
      </form>
    </div>
  );
};

export default SessionNotesPage;
