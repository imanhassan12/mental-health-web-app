// client/src/pages/SessionNotesPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SessionNoteService from '../services/sessionNote.service';
import ClientService from '../services/client.service';
import '../styles/SessionNotes.css';
import { FaLightbulb, FaTags, FaTasks, FaSmile, FaList, FaGlobe, FaSync, FaInfoCircle } from 'react-icons/fa';
import api from '../services/api';
const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'ru', label: 'Russian' },
  { code: 'hi', label: 'Hindi' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  // Add more as needed
];

const getLangLabel = (code) => languageOptions.find(l => l.code === code)?.label || code;

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
  const [nlpInsights, setNlpInsights] = useState({}); // { [noteId]: { loading, error, data } }
  const [recentNoteId, setRecentNoteId] = useState(null);
  const [expandedInsights, setExpandedInsights] = useState({}); // { [noteId]: true/false }
  const [targetLang, setTargetLang] = useState('en');
  const [translation, setTranslation] = useState({}); // { [noteId]: { loading, error, text, showingTranslated } }

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
      
      setAllNotes(prev => [createdNote, ...prev]);
      setRecentNoteId(createdNote.id);
      setNlpInsights(prev => ({ ...prev, [createdNote.id]: { loading: true, error: null, data: null } }));
      try {
        const data = await SessionNoteService.analyzeSessionNote(createdNote.id);
        setNlpInsights(prev => ({ ...prev, [createdNote.id]: { loading: false, error: null, data } }));
      } catch (err) {
        setNlpInsights(prev => ({ ...prev, [createdNote.id]: { loading: false, error: 'Could not fetch NLP insights.', data: null } }));
      }
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

  const fetchNlpInsights = async (noteId) => {
    setNlpInsights(prev => ({ ...prev, [noteId]: { loading: true, error: null, data: null } }));
    try {
      const data = await SessionNoteService.analyzeSessionNote(noteId);
      setNlpInsights(prev => ({ ...prev, [noteId]: { loading: false, error: null, data } }));
    } catch (err) {
      setNlpInsights(prev => ({ ...prev, [noteId]: { loading: false, error: 'Could not fetch NLP insights.', data: null } }));
    }
  };

  // When a new note is added, default its insights to expanded
  useEffect(() => {
    if (recentNoteId) {
      setExpandedInsights(prev => ({ ...prev, [recentNoteId]: true }));
    }
  }, [recentNoteId]);

  const handleTranslate = async (noteId, text) => {
    setTranslation(prev => ({ ...prev, [noteId]: { loading: true, error: null, text: '', showingTranslated: true } }));
    try {
      const res = await api.post('/translate', {
        text,
        targetLang
      });
      if (res.data && res.data.translatedText) {
        setTranslation(prev => ({ ...prev, [noteId]: { loading: false, error: null, text: res.data.translatedText, showingTranslated: true } }));
      } else {
        setTranslation(prev => ({ ...prev, [noteId]: { loading: false, error: 'Translation failed', text: '', showingTranslated: false } }));
      }
    } catch (err) {
      setTranslation(prev => ({ ...prev, [noteId]: { loading: false, error: err.message, text: '', showingTranslated: false } }));
    }
  };

  const toggleTranslation = (noteId) => {
    setTranslation(prev => ({
      ...prev,
      [noteId]: {
        ...prev[noteId],
        showingTranslated: !prev[noteId]?.showingTranslated
      }
    }));
  };

  // Use localStorage for language preference
  useEffect(() => {
    const storedLang = localStorage.getItem('preferredLang');
    if (storedLang && languageOptions.some(l => l.code === storedLang)) {
      setTargetLang(storedLang);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('preferredLang', targetLang);
  }, [targetLang]);

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
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FaGlobe style={{ color: '#1976d2', marginRight: 4 }} />
        <label htmlFor="targetLang" style={{ fontWeight: 500, marginRight: 6 }}>Target Language:</label>
        <select
          id="targetLang"
          value={targetLang}
          onChange={e => setTargetLang(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4 }}
          title="Set your preferred language for translation"
        >
          {languageOptions.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
        <FaInfoCircle style={{ color: '#888', cursor: 'pointer' }} title="Set your preferred language for translation. This will be remembered for next time." />
      </div>

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
                {filteredNotes.map(note => {
                  const t = translation[note.id];
                  const isAlreadyTranslated = t && t.text && t.showingTranslated && targetLang && t.text && t.text !== note.content;
                  return (
                    <li key={note.id} className={`note-item${note.id === recentNoteId ? ' recent-note' : ''}`}>
                      <div className="note-header">
                        <span className="note-client">{getClientName(note.clientId)}</span>
                        <span className="note-date">{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <div className="note-mood">Mood: <span className={`mood-rating ${getMoodClass(note.mood)}`}>{note.mood}/10</span></div>
                      <div className="note-content fade-in-translation">
                        {t && t.showingTranslated && t.text ? (
                          <span style={{ color: '#1976d2' }}>{t.text}</span>
                        ) : (
                          note.content
                        )}
                      </div>
                      {t && t.showingTranslated && t.text && (
                        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                          Translated to {getLangLabel(targetLang)}
                        </div>
                      )}
                      <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          className="btn small"
                          onClick={() => handleTranslate(note.id, note.content)}
                          disabled={t?.loading || isAlreadyTranslated}
                          title={isAlreadyTranslated ? 'Already translated' : 'Translate this note'}
                        >
                          {t?.loading ? <span className="spinner" /> : 'Translate'}
                        </button>
                        {t && t.text && (
                          <button
                            className="btn tiny"
                            style={{ marginLeft: 2 }}
                            onClick={() => toggleTranslation(note.id)}
                            title={t.showingTranslated ? 'Show Original' : 'Show Translation'}
                          >
                            <FaSync style={{ marginRight: 2 }} /> {t.showingTranslated ? 'Show Original' : 'Show Translation'}
                          </button>
                        )}
                        {t && t.error && <span style={{ color: 'red', fontSize: 13 }}>{t.error}</span>}
                      </div>
                      <Link to={`/clients/${note.clientId}`} className="view-client-link">
                        View Client
                      </Link>
                      <button
                        className="btn small"
                        style={{ marginTop: 8 }}
                        onClick={() => {
                          if (!nlpInsights[note.id]?.data) fetchNlpInsights(note.id);
                          setExpandedInsights(prev => ({ ...prev, [note.id]: !prev[note.id] }));
                        }}
                        disabled={nlpInsights[note.id]?.loading}
                      >
                        {nlpInsights[note.id]?.loading ? (
                          <span className="spinner" />
                        ) : expandedInsights[note.id] ? 'Hide Insights' : 'Show Insights'}
                      </button>
                      {nlpInsights[note.id]?.error && (
                        <div style={{ color: 'red', fontSize: 13 }}>
                          {nlpInsights[note.id].error}
                          <button onClick={() => fetchNlpInsights(note.id)} className="btn tiny" style={{ marginLeft: 8 }}>Retry</button>
                        </div>
                      )}
                      {nlpInsights[note.id]?.data && expandedInsights[note.id] && (
                        <div className="nlp-insights" style={{ background: note.id === recentNoteId ? '#e3fcec' : '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: 6, padding: 10, marginTop: 8 }}>
                          <div><FaLightbulb style={{ color: '#fbc02d', marginRight: 4 }}/> <strong>Summary:</strong> {nlpInsights[note.id].data.summary}</div>
                          <div><FaList style={{ color: '#1976d2', marginRight: 4 }}/> <strong>Key Topics:</strong> {nlpInsights[note.id].data.keyTopics.join(', ')}</div>
                          <div><FaSmile style={{ color: '#43a047', marginRight: 4 }}/> <strong>Mood Indicators:</strong> {nlpInsights[note.id].data.moodIndicators.join(', ')}</div>
                          <div><FaTasks style={{ color: '#8d6e63', marginRight: 4 }}/> <strong>Action Items:</strong> {nlpInsights[note.id].data.actionItems.join(', ')}</div>
                          <div>
                            <FaTags style={{ color: '#ab47bc', marginRight: 4 }}/> <strong>Suggested Tags:</strong>
                            {nlpInsights[note.id].data.suggestedTags.map(tag => (
                              <span key={tag} className="tag-chip">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
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

// Add CSS for tag chips and spinner
// You can move this to your CSS file if preferred
const style = document.createElement('style');
style.innerHTML = `
.tag-chip {
  display: inline-block;
  background: #e1bee7;
  color: #6a1b9a;
  border-radius: 12px;
  padding: 2px 10px;
  margin: 0 4px 2px 0;
  font-size: 13px;
}
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top: 2px solid #1976d2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: middle;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.fade-in-translation span {
  animation: fadeInTrans 0.5s;
}
@keyframes fadeInTrans {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;
document.head.appendChild(style);
