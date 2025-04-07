// client/src/pages/ClientDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ClientService from '../services/client.service';
import SessionNoteService from '../services/sessionNote.service';
import AppointmentService from '../services/appointment.service';
import '../styles/ClientDetailPage.css';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        
        // Fetch client details
        const clientData = await ClientService.getClientById(clientId);
        setClient(clientData);
        
        // Fetch related data
        const [notesData, appointmentsData] = await Promise.all([
          SessionNoteService.getClientSessionNotes(clientId),
          AppointmentService.getClientAppointments(clientId)
        ]);
        
        setSessionNotes(notesData);
        setAppointments(appointmentsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Failed to load client data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await ClientService.deleteClient(clientId);
        navigate('/clients');
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Failed to delete client. Please try again.');
      }
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
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!client) {
    return <div className="not-found">Client not found</div>;
  }

  return (
    <div className="client-detail-page">
      <div className="client-header">
        <h2>{client.name}</h2>
        <div className="action-buttons">
          <Link to={`/clients/${clientId}/edit`} className="btn primary">Edit Client</Link>
          <button onClick={handleDelete} className="btn danger">Delete Client</button>
        </div>
      </div>

      <div className="client-info">
        <p><strong>Phone:</strong> {client.phone}</p>
        <p><strong>Notes:</strong> {client.notes}</p>
      </div>

      {/* Session Notes Section */}
      <div className="section">
        <div className="section-header">
          <h3>Session Notes</h3>
          <Link to={`/clients/${clientId}/notes/new`} className="btn small">+ Add Note</Link>
        </div>
        {sessionNotes.length === 0 ? (
          <p>No session notes found.</p>
        ) : (
          <ul className="notes-list">
            {sessionNotes.slice(0, 3).map((note) => (
              <li key={note.id} className="note-item">
                <Link to={`/notes/${note.id}`}>
                  <span className="date">{new Date(note.date).toLocaleDateString()}</span>
                  <span className="mood">Mood: {note.mood}/10</span>
                  <p className="content">{note.content.substring(0, 100)}...</p>
                </Link>
              </li>
            ))}
            {sessionNotes.length > 3 && (
              <Link to={`/clients/${clientId}/notes`} className="view-all">
                View all {sessionNotes.length} notes
              </Link>
            )}
          </ul>
        )}
      </div>

      {/* Upcoming Appointments Section */}
      <div className="section">
        <div className="section-header">
          <h3>Upcoming Appointments</h3>
          <Link to={`/appointments/new?clientId=${clientId}`} className="btn small">+ Schedule</Link>
        </div>
        {appointments.length === 0 ? (
          <p>No upcoming appointments.</p>
        ) : (
          <ul className="appointments-list">
            {appointments.map((apt) => (
              <li key={apt.id} className="appointment-item">
                <Link to={`/appointments/${apt.id}`}>
                  <span className="date">{new Date(apt.startTime).toLocaleDateString()}</span>
                  <span className="time">
                    {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                    {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="title">{apt.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
