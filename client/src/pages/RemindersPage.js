import React, { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/RemindersPage.css';
import { FaCalendarAlt, FaCheckCircle, FaClock, FaBell, FaEdit, FaPlus } from 'react-icons/fa';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [form, setForm] = useState({
    message: '',
    dueDate: '',
    phoneNumber: '',
    type: 'custom',
    recurrence: 'none',
  });
  const [formError, setFormError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    if (editReminder) {
      setForm({
        message: editReminder.message || '',
        dueDate: editReminder.dueDate ? editReminder.dueDate.slice(0, 16) : '',
        phoneNumber: editReminder.phoneNumber || '',
        type: editReminder.type || 'custom',
        recurrence: editReminder.recurrence || 'none',
      });
    } else {
      setForm({ message: '', dueDate: '', phoneNumber: '', type: 'custom', recurrence: 'none' });
    }
    setFormError('');
  }, [showModal, editReminder]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reminders');
      setReminders(res.data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  const handleMarkDone = async (id) => {
    await api.patch(`/reminders/${id}/done`);
    fetchReminders();
  };

  const handleEdit = (reminder) => {
    setEditReminder(reminder);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditReminder(null);
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.message || !form.dueDate || !form.phoneNumber) {
      setFormError('Message, due date, and phone number are required.');
      return;
    }
    try {
      if (editReminder) {
        await api.put(`/reminders/${editReminder.id}`, form);
      } else {
        await api.post('/reminders', form);
      }
      setShowModal(false);
      fetchReminders();
    } catch (err) {
      setFormError('Failed to save reminder.');
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filterStatus === 'pending' && reminder.isDone) return false;
    if (filterStatus === 'done' && !reminder.isDone) return false;
    if (filterType !== 'all' && reminder.type !== filterType) return false;
    if (search && !(
      reminder.message.toLowerCase().includes(search.toLowerCase()) ||
      reminder.phoneNumber.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  // Calculate stats
  const total = reminders.length;
  const pending = reminders.filter(r => !r.isDone).length;
  const done = reminders.filter(r => r.isDone).length;
  const sent = reminders.filter(r => r.sent).length;

  return (
    <div className="reminders-page">
      <h2>Reminders & Follow-ups</h2>
      <button className="reminder-summary-toggle" onClick={() => setShowSummary(s => !s)}>
        {showSummary ? 'Hide' : 'Show'} Summary
      </button>
      {showSummary && (
        <div className="reminder-summary-cards">
          <div className="reminder-summary-card total"><FaBell />Total: {total}</div>
          <div className="reminder-summary-card pending"><FaClock />Pending: {pending}</div>
          <div className="reminder-summary-card done"><FaCheckCircle />Done: {done}</div>
          <div className="reminder-summary-card sent"><FaCalendarAlt />Sent: {sent}</div>
        </div>
      )}
      <div className="reminder-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="done">Done</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="custom">Custom</option>
          <option value="appointment">Appointment</option>
          <option value="followup">Follow-up</option>
        </select>
        <input
          type="text"
          placeholder="Search message or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <button className="reminder-create-btn" onClick={handleCreate}><FaPlus /> New Reminder</button>
      {loading ? <div>Loading...</div> : (
        <div className="reminders-list">
          {filteredReminders.map(reminder => (
            <div className={`reminder-card${reminder.isDone ? ' done' : ''}`} key={reminder.id}>
              <div className="reminder-message">
                {reminder.type === 'appointment' && <FaCalendarAlt />}
                {reminder.type === 'followup' && <FaClock />}
                {reminder.type === 'custom' && <FaBell />}
                {reminder.message}
              </div>
              <div className="reminder-meta">
                <span><FaClock style={{marginRight: 4}}/> {new Date(reminder.dueDate).toLocaleString()}</span>
                <span>Type: {reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}</span>
                <span>Recurrence: {reminder.recurrence}</span>
                <span>Status: {reminder.isDone ? <span className="reminder-badge badge-done">Done</span> : <span className="reminder-badge badge-pending">Pending</span>}</span>
                {reminder.sent && <span className="reminder-badge badge-sent">Sent</span>}
                <span>To: {reminder.phoneNumber}</span>
              </div>
              <div className="reminder-actions">
                {!reminder.isDone && <button onClick={() => handleMarkDone(reminder.id)}><FaCheckCircle /> Mark Done</button>}
                <button onClick={() => handleEdit(reminder)}><FaEdit /> Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="reminder-modal-overlay">
          <div className="reminder-modal">
            <h3>{editReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
            <form onSubmit={handleFormSubmit} className="reminder-form">
              <label>
                Message:
                <input name="message" value={form.message} onChange={handleFormChange} required />
              </label>
              <label>
                Due Date:
                <input type="datetime-local" name="dueDate" value={form.dueDate} onChange={handleFormChange} required />
              </label>
              <label>
                Phone Number:
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleFormChange} required />
              </label>
              <label>
                Type:
                <select name="type" value={form.type} onChange={handleFormChange}>
                  <option value="custom">Custom</option>
                  <option value="appointment">Appointment</option>
                  <option value="followup">Follow-up</option>
                </select>
              </label>
              <label>
                Recurrence:
                <select name="recurrence" value={form.recurrence} onChange={handleFormChange}>
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              {formError && <div className="reminder-form-error">{formError}</div>}
              <div style={{marginTop: 24, display: 'flex', gap: 12}}>
                <button type="submit"><FaCheckCircle /> Save</button>
                <button type="button" onClick={() => setShowModal(false)}><FaCalendarAlt /> Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersPage; 