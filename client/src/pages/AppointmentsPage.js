// client/src/pages/AppointmentsPage.js
import React, { useEffect, useState, useRef } from 'react';
import '../styles/AppointmentsPage.css'; // make sure this path is correct

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editAppointment, setEditAppointment] = useState(null);

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

  // References for focus-trapping
  const modalRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Fetch all appointments
  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => setAppointments(data))
      .catch(err => console.error('Error fetching appointments:', err));
  }, []);

  // Open form in "create" or "edit" mode
  const openForm = (appt = null) => {
    setErrorMessage('');
    if (appt) {
      // Edit mode
      setEditAppointment(appt);
      setClientId(appt.clientId);
      setPractitionerId(appt.practitionerId);
      setStartTime(appt.startTime);
      setEndTime(appt.endTime || '');
      setStatus(appt.status);
      setTitle(appt.title);
      setNotes(appt.notes);
    } else {
      // New appointment
      setEditAppointment(null);
      setClientId('');
      setPractitionerId('');
      setStartTime('');
      setEndTime('');
      setStatus('scheduled');
      setTitle('');
      setNotes('');
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Basic validation
    if (!clientId || !practitionerId || !startTime) {
      setErrorMessage('Please fill in required fields: Client ID, Practitioner ID, Start Time.');
      return;
    }
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      setErrorMessage('End Time must be after Start Time.');
      return;
    }

    const payload = { clientId, practitionerId, startTime, endTime, status, title, notes };

    try {
      let url = '/api/appointments';
      let method = 'POST';
      if (editAppointment) {
        url += `/${editAppointment.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (editAppointment) {
          setAppointments(prev => prev.map(a => (a.id === data.id ? data : a)));
        } else {
          setAppointments(prev => [...prev, data]);
        }
        setShowForm(false);
      } else {
        console.error('Error:', data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      } else {
        console.error(data.message || 'Failed to delete.');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
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

  return (
    <div className="appointments-page">
      <h2 className="section-title">Appointments</h2>
      <button className="btn primary new-appt-btn" onClick={() => openForm(null)}>
        + New Appointment
      </button>

      <table className="appt-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Client</th>
            <th>Practitioner</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appt => (
            <tr key={appt.id}>
              <td>{appt.title}</td>
              <td>{appt.clientId}</td>
              <td>{appt.practitionerId}</td>
              <td>{new Date(appt.startTime).toLocaleString()}</td>
              <td>{appt.endTime ? new Date(appt.endTime).toLocaleString() : 'N/A'}</td>
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

      {/* Modal */}
      {showForm && (
        <div className="custom-backdrop">
          <div className="custom-content" ref={modalRef} onKeyDown={handleKeyDown}>
            <button
              className="close-icon"
              onClick={() => setShowForm(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3>{editAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Session Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  ref={firstFieldRef}
                  required
                />
              </div>

              <div className="form-group">
                <label>Client ID</label>
                <input
                  type="text"
                  placeholder="Client identifier"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Practitioner ID</label>
                <input
                  type="text"
                  placeholder="Practitioner identifier"
                  value={practitionerId}
                  onChange={(e) => setPractitionerId(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="no-show">No-Show</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  placeholder="Any additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn primary">
                  {editAppointment ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
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
