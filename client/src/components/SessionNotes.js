// client/src/pages/SessionNotesPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SessionNotes.css';

const SessionNotesPage = () => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Fetch notes from your server's sessionNotes endpoint
    fetch('/api/sessionNotes')
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch((err) => console.error('Error fetching session notes:', err));
  }, []);

  return (
    <div className="session-notes-page">
      <h2>Session Notes</h2>
      <div className="notes-header">
        {/* Link to a separate route for creating a new note, e.g. /notes/new */}
        <Link to="/notes/new" className="btn primary">+ Add Session Note</Link>
      </div>

      <ul className="notes-list">
        {notes.length === 0 ? (
          <p>No session notes available.</p>
        ) : (
          notes.map((note) => (
            <li key={note.id} className="note-item">
              <strong>{note.sessionDate}:</strong> {note.content || '[No summary provided]'}
              {/* Optional: If you want to allow editing */}
              <Link to={`/notes/${note.id}/edit`} className="edit-link">
                Edit
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default SessionNotesPage;
