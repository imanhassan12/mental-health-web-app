// client/src/pages/SessionNotesPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SessionNoteService from '../services/sessionNote.service';
import ClientService from '../services/client.service';
import '../styles/SessionNotes.css';

const SessionNotesPage = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  
  const [client, setClient] = useState(null);
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch client data if clientId is available
  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        const clientData = await ClientService.getClientById(clientId);
        setClient(clientData);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Failed to load client data.');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!mood || !note) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      setSaving(true);
      
      const sessionNoteData = {
        clientId: clientId,
        date: new Date().toISOString(),
        mood: parseInt(mood),
        content: note
      };
      
      await SessionNoteService.createSessionNote(sessionNoteData);
      
      // Redirect to client page after successful save
      navigate(`/clients/${clientId}`);
    } catch (err) {
      console.error('Error saving session note:', err);
      setError('Failed to save session note. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading client data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          className="btn secondary" 
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="session-notes-page">
      <h2>New Session Note {client && `for ${client.name}`}</h2>
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
            required
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">Note:</label>
          <textarea
            id="note"
            placeholder="Enter session observations or key points"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            disabled={saving}
            rows={8}
          />
        </div>

        <div className="button-group">
          <button 
            type="button" 
            className="btn secondary"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Session Note'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionNotesPage;
