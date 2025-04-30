// client/src/pages/SessionNotesPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SessionNoteService from '../services/sessionNote.service';
import ClientService from '../services/client.service';
import '../styles/SessionNotes.css';

const SessionNotesPage = () => {
  const navigate = useNavigate();
  const { clientId: urlClientId } = useParams();
  
  // Filter states
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(urlClientId || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Notes states
  const [allNotes, setAllNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  
  // Form states for adding a new note
  const [sessionDate, setSessionDate] = useState(formatDateForInput(new Date()));
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to format dates for input elements
  function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }

  // Fetch all clients and notes data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all clients
        const clientsData = await ClientService.getAllClients();
        setClients(clientsData);
        
        // Fetch all session notes or notes for a specific client
        let notesData;
        if (urlClientId) {
          notesData = await SessionNoteService.getClientSessionNotes(urlClientId);
          setSelectedClientId(urlClientId);
        } else {
          notesData = await SessionNoteService.getAllSessionNotes();
        }
        
        setAllNotes(notesData);
        setFilteredNotes(notesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [urlClientId]);

  // Apply filters when filter criteria change
  useEffect(() => {
    applyFilters();
  }, [selectedClientId, startDate, endDate, sortBy, allNotes]);

  // Apply filters and sorting to notes
  const applyFilters = () => {
    let result = [...allNotes];
    
    // Filter by client
    if (selectedClientId) {
      result = result.filter(note => note.clientId === selectedClientId);
    }
    
    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(note => new Date(note.date) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of the day
      result = result.filter(note => new Date(note.date) <= end);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (sortBy === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
    
    setFilteredNotes(result);
  };

  // Handle form submission for new session note
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClientId || !mood || !note) {
      alert('Please fill in all required fields.');
      return;
    }
    
    try {
      setSaving(true);
      
      const sessionNoteData = {
        clientId: selectedClientId,
        date: new Date(sessionDate).toISOString(),
        mood: parseInt(mood),
        content: note
      };
      
      const createdNote = await SessionNoteService.createSessionNote(sessionNoteData);
      
      // Add the new note to the list and reset form
      setAllNotes(prev => [createdNote, ...prev]);
      resetForm();
      
      setSaving(false);
    } catch (err) {
      console.error('Error saving session note:', err);
      setError('Failed to save session note. Please try again.');
      setSaving(false);
    }
  };

  // Reset the form fields
  const resetForm = () => {
    setSessionDate(formatDateForInput(new Date()));
    setMood('');
    setNote('');
  };

  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  const getMoodClass = (value) => {
    if (value === null || value === undefined) return '';
    if (value >= 7) return 'mood-high';
    if (value >= 4) return 'mood-medium';
    return 'mood-low';
  };

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          className="btn secondary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="session-notes-page">
      <h2>Session Notes</h2>

      <div className="session-notes-container">
        {/* Left Side - Filter Section */}
        <div className="filter-section">
          <h3>Filter</h3>
          
          <div className="form-group">
            <label htmlFor="client">Client:</label>
            <select
              id="client"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Select a Client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sortBy">Sort By Date:</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Filtered Notes */}
          <div className="filtered-notes">
            <h3>Filtered Notes</h3>
            {filteredNotes.length === 0 ? (
              <p className="no-notes-message">
                No notes found for this client (or in this date range).
                <br />
                Try adjusting your date range or adding a new note above.
              </p>
            ) : (
              <ul className="notes-list">
                {filteredNotes.map(note => (
                  <li key={note.id} className="note-item">
                    <div className="note-header">
                      <span className="note-client">{getClientName(note.clientId)}</span>
                      <span className="note-date">{new Date(note.date).toLocaleDateString()}</span>
                    </div>
                    <div className="note-mood">Mood: <span className={`mood-rating ${getMoodClass(note.mood)}`}>{note.mood}/10</span></div>
                    <div className="note-content">{note.content}</div>
                    <Link to={`/clients/${note.clientId}`} className="view-client-link">
                      View Client
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Side - Add Note Form */}
        <div className="add-note-section">
          <h3>Add a Note</h3>
          <form onSubmit={handleSubmit} className="session-note-form">
            <div className="form-group">
              <label htmlFor="sessionDate">Session Date:</label>
              <input
                type="date"
                id="sessionDate"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mood">Mood (0-10):</label>
              <input
                type="number"
                min="0"
                max="10"
                id="mood"
                placeholder="e.g. 7"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Note Content:</label>
              <textarea
                id="note"
                placeholder="Enter session details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                disabled={saving}
                rows={8}
              />
            </div>

            <button 
              type="submit" 
              className="btn primary save-note-btn"
              disabled={saving || !selectedClientId}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionNotesPage;
