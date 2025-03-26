// client/src/pages/AppointmentsPage.js
import React, { useEffect, useState, useRef } from 'react';
import AppointmentService from '../services/appointment.service';
import ClientService from '../services/client.service';
import AuthService from '../services/auth.service';
import '../styles/AppointmentsPage.css';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form fields
  const [clientId, setClientId] = useState('');
  const [practitionerId, setPractitionerId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Validation error
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // References for focus-trapping
  const modalRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Fetch all appointments and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const currentUser = AuthService.getCurrentUser();
        
        // Fetch appointments for the current practitioner
        const appointmentsData = currentUser?.id ? 
          await AppointmentService.getPractitionerAppointments(currentUser.id) :
          await AppointmentService.getAllAppointments();
        
        // Fetch all clients for the dropdown
        const clientsData = await ClientService.getAllClients();
        
        setAppointments(appointmentsData);
        setClients(clientsData);
        
        // Set practitioner ID from current user if available
        if (currentUser?.id) {
          setPractitionerId(currentUser.id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Open form in "create" or "edit" mode
  const openForm = (appt = null) => {
    setErrorMessage('');
    if (appt) {
      // Edit mode
      setEditAppointment(appt);
      setClientId(appt.clientId);
      setPractitionerId(appt.practitionerId);
      setStartTime(formatDateTimeForInput(new Date(appt.startTime)));
      setEndTime(appt.endTime ? formatDateTimeForInput(new Date(appt.endTime)) : '');
      setStatus(appt.status);
      setTitle(appt.title);
      setNotes(appt.notes);
    } else {
      // New appointment
      setEditAppointment(null);
      setClientId('');
      // Keep practitionerId set to current user if available
      setStartTime('');
      setEndTime('');
      setStatus('scheduled');
      setTitle('');
      setNotes('');
    }
    setShowForm(true);
  };

  // Helper to format date for datetime-local input
  const formatDateTimeForInput = (date) => {
    return date.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic validation
    if (!clientId || !practitionerId || !startTime) {
      setErrorMessage('Please fill in required fields: Client, Start Time.');
      return;
    }
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      setErrorMessage('End Time must be after Start Time.');
      return;
    }

    const payload = { 
      clientId, 
      practitionerId, 
      startTime: new Date(startTime).toISOString(), 
      endTime: endTime ? new Date(endTime).toISOString() : null, 
      status, 
      title, 
      notes 
    };

    try {
      setSaving(true);
      let result;
      
      if (editAppointment) {
        result = await AppointmentService.updateAppointment(editAppointment.id, payload);
        setAppointments(prev => prev.map(a => (a.id === result.id ? result : a)));
      } else {
        result = await AppointmentService.createAppointment(payload);
        setAppointments(prev => [...prev, result]);
      }
      
      setShowForm(false);
    } catch (error) {
      console.error('Error saving appointment:', error);
      setErrorMessage('Failed to save appointment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await AppointmentService.deleteAppointment(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Color-coded status label
  const statusClass = (s) => {
    switch (s) {
      case 'completed': return 'status-completed';
      case 'no-show':   return 'status-noshow';
      default:          return 'status-scheduled';
    }
  };

  // ESC key & focus trap
  useEffect(() => {
    if (showForm) {
      firstFieldRef.current?.focus();
      const handleEsc = (e) => { if (e.key === 'Escape') setShowForm(false); };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [showForm]);

  const handleKeyDown = (e) => {
    if (!modalRef.current) return;
    if (e.key === 'Tab') {
      const focusable = modalRef.current.querySelectorAll('input, select, textarea, button');
      if (!focusable.length) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
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
    <div className="appointments-page">
      <h2 className="section-title">Appointments</h2>
      <button className="btn primary new-appt-btn" onClick={() => openForm(null)}>
        + New Appointment
      </button>

      {appointments.length === 0 ? (
        <p>No appointments found. Create one to get started.</p>
      ) : (
        <table className="appt-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Client</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(appt => (
              <tr key={appt.id}>
                <td>{appt.title}</td>
                <td>{getClientName(appt.clientId)}</td>
                <td>{new Date(appt.startTime).toLocaleDateString()}</td>
                <td>
                  {new Date(appt.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {appt.endTime && ` - ${new Date(appt.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </td>
                <td>
                  <span className={`appt-status ${statusClass(appt.status)}`}>
                    {appt.status}
                  </span>
                </td>
                <td>
                  <button className="btn edit-btn" onClick={() => openForm(appt)}>Edit</button>
                  <button className="btn delete-btn" onClick={() => handleDelete(appt.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal" ref={modalRef} onKeyDown={handleKeyDown}>
            <h3>{editAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>
            <form onSubmit={handleSubmit}>
              {errorMessage && <div className="error-message">{errorMessage}</div>}

              <div className="form-group">
                <label htmlFor="client">Client:</label>
                <select
                  id="client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  ref={firstFieldRef}
                  disabled={saving}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startTime">Start Time:</label>
                <input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time:</label>
                <input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g., Initial Consultation, Weekly Therapy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes:</label>
                <textarea
                  id="notes"
                  placeholder="Any additional details"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status:</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={saving}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No Show</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : (editAppointment ? 'Update Appointment' : 'Create Appointment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
