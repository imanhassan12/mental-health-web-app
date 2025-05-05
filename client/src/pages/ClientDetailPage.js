// client/src/pages/ClientDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ClientService from '../services/client.service';
import SessionNoteService from '../services/sessionNote.service';
import AppointmentService from '../services/appointment.service';
import AuthService from '../services/auth.service';
import '../styles/ClientDetailPage.css';
import { FaVideo } from 'react-icons/fa';
import Modal from 'react-modal';
import { backendUrl } from '../services/api';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [risk, setRisk] = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [riskError, setRiskError] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const now = new Date();

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

  useEffect(() => {
    const fetchRisk = async () => {
      setRiskLoading(true);
      setRiskError(null);
      try {
        const riskData = await ClientService.getClientRisk(clientId);
        setRisk(riskData);
      } catch (err) {
        setRiskError('Could not fetch risk prediction.');
      } finally {
        setRiskLoading(false);
      }
    };
    fetchRisk();
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

  const downloadFile = async (url, filename) => {
    const token = AuthService.getToken();
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const getEligibleAppointment = () => {
    return appointments.find(appt => {
      const start = new Date(appt.startTime);
      return (start.getTime() - now.getTime() < 15 * 60 * 1000) && (now.getTime() - start.getTime() < 60 * 60 * 1000);
    });
  };

  const eligibleAppt = getEligibleAppointment();

  const handleStartVideo = async () => {
    if (!eligibleAppt) return;
    setVideoLoading(true);
    try {
      const res = await fetch(`/api/video/meeting-link?appointmentId=${eligibleAppt.id}`);
      const data = await res.json();
      if (res.ok && data.url) {
        setVideoUrl(data.url);
        setVideoModalOpen(true);
      } else {
        alert('Failed to get video session link.');
      }
    } catch (err) {
      alert('Failed to get video session link.');
    } finally {
      setVideoLoading(false);
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
        <div className="ehr-export-buttons" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn small"
            title="Export client data as CSV for use in other systems."
            onClick={() => {
              downloadFile(`${backendUrl}/api/clients/${clientId}/export/csv`, `client-${clientId}.csv`);
            }}
          >
            Export CSV
          </button>
          <button
            className="btn small"
            title="Export client data as FHIR (Fast Healthcare Interoperability Resources) JSON."
            onClick={() => {
              downloadFile(`${backendUrl}/api/clients/${clientId}/export/fhir`, `client-${clientId}.json`);
            }}
          >
            Export FHIR JSON
          </button>
          <span style={{ fontSize: 14, color: '#888', marginLeft: 6 }} title="EHR/EMR Export: Download this client's record for use in other healthcare systems.">ℹ️</span>
        </div>
      </div>

      {/* AI-Powered Risk Prediction Section */}
      <div className="risk-section" style={{ margin: '18px 0', padding: '12px', background: '#f8f9fa', borderRadius: 8, border: '1px solid #e0e0e0' }}>
        <h4 style={{ margin: 0, marginBottom: 6 }}>AI-Powered Risk Prediction</h4>
        {riskLoading ? (
          <span style={{ color: '#888' }}>Loading risk prediction...</span>
        ) : riskError ? (
          <span style={{ color: 'red' }}>{riskError}</span>
        ) : risk ? (
          <div>
            <span style={{ fontWeight: 600, color: risk.risk === 'High' ? '#d32f2f' : risk.risk === 'Medium' ? '#fbc02d' : '#388e3c' }}>
              Risk Level: {risk.risk}
            </span>
            <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>
              {risk.factors}
            </div>
          </div>
        ) : null}
      </div>

      <div className="client-info">
        <p><strong>Phone:</strong> {client.phone}</p>
        <p><strong>Diagnosis:</strong> {client.diagnosis || 'Unknown'}</p>
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

      {eligibleAppt && (
        <button
          className="btn small"
          style={{ marginTop: 12 }}
          onClick={handleStartVideo}
          disabled={videoLoading}
          title="Start/Join Video Session"
        >
          <FaVideo style={{ marginRight: 4 }} />
          {videoLoading ? 'Loading...' : 'Video Session'}
        </button>
      )}

      <Modal
        isOpen={videoModalOpen}
        onRequestClose={() => setVideoModalOpen(false)}
        contentLabel="Video Session"
        style={{ content: { width: '90vw', height: '80vh', margin: 'auto', padding: 0 } }}
      >
        <button onClick={() => setVideoModalOpen(false)} style={{ position: 'absolute', top: 8, right: 12, zIndex: 2 }}>Close</button>
        {videoUrl ? (
          <iframe
            src={videoUrl}
            title="Jitsi Video Session"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="camera; microphone; fullscreen; display-capture"
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading video session...</div>
        )}
      </Modal>
    </div>
  );
};

export default ClientDetailPage;
