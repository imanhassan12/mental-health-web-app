import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import '../styles/TasksPage.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import messageService from '../services/message.service';

const statusColumns = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [form, setForm] = useState({
    clientId: '',
    assigneeId: '',
    dueDate: '',
    priority: 'high',
    comments: ''
  });
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotSuggestions, setSlotSuggestions] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [slotDuration, setSlotDuration] = useState(60); // in minutes
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [busySlots, setBusySlots] = useState({ client: [], assignee: [] });
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [customConflict, setCustomConflict] = useState('');

  useEffect(() => {
    api.get('/tasks').then(res => setTasks(res.data));
    api.get('/messages/practitioners').then(res => setPractitioners(res.data));
    api.get('/clients').then(res => setClients(res.data));
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000');
    socket.on('task-new', (task) => setTasks(prev => [task, ...prev]));
    socket.on('task-updated', (task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (form.clientId && form.assigneeId) {
      setSlotLoading(true);
      setSlotError('');
      setSlotSuggestions([]);
      setShowAllSlots(false);
      messageService.getSuggestedSlots(form.clientId, form.assigneeId, slotDuration, 10)
        .then(res => setSlotSuggestions(res))
        .catch(() => setSlotError('No available slots found.'))
        .finally(() => setSlotLoading(false));
      messageService.getBusySlots(form.clientId, form.assigneeId)
        .then(res => setBusySlots(res))
        .catch(() => setBusySlots({ client: [], assignee: [] }));
    } else {
      setSlotSuggestions([]);
      setSlotError('');
      setBusySlots({ client: [], assignee: [] });
      setShowAllSlots(false);
    }
  }, [form.clientId, form.assigneeId, slotDuration]);

  useEffect(() => {
    if (!customDate || !customTime || !slotDuration) {
      setCustomConflict('');
      return;
    }
    const start = new Date(`${customDate}T${customTime}`);
    const end = new Date(start.getTime() + slotDuration * 60000);
    const allBusy = [...(busySlots.client || []), ...(busySlots.assignee || [])];
    const conflict = allBusy.some(b => {
      if (!b.start || !b.end) return false;
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return start < bEnd && end > bStart;
    });
    setCustomConflict(conflict ? 'Selected time conflicts with an existing appointment.' : '');
  }, [customDate, customTime, slotDuration, busySlots]);

  const updateStatus = async (task, status) => {
    await api.put(`/tasks/${task.id}`, { status });
  };

  const openModal = () => {
    setForm({ clientId: '', assigneeId: '', dueDate: '', priority: 'high', comments: '' });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ clientId: '', assigneeId: '', dueDate: '', priority: 'high', comments: '' });
    setFormError('');
    setLoading(false);
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.assigneeId || !form.dueDate) {
      setFormError('Client, assignee, and due date are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/tasks', form);
      setTasks(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ clientId: '', assigneeId: '', dueDate: '', priority: 'high', comments: '' });
      setFormError('');
      toast.success('Task created successfully!');
    } catch (err) {
      setFormError('Failed to create task.');
    }
    setLoading(false);
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  return (
    <div className="tasks-kanban-page">
      <h2>Escalation Tasks</h2>
      <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={openModal}>+ New Task</button>
      <div className="kanban-board">
        {statusColumns.map(col => (
          <div className="kanban-column" key={col.key}>
            <h3>{col.label}</h3>
            {tasks.filter(t => t.status === col.key).length === 0 ? (
              <div className="kanban-empty">No tasks</div>
            ) : (
              tasks.filter(t => t.status === col.key).map(task => (
                <div className={`kanban-card priority-${task.priority} ${isOverdue(task) ? 'kanban-overdue' : ''}`} key={task.id} style={isOverdue(task) ? { border: '2px solid #d9534f', background: '#fff3f3' } : {}}>
                  <div className="kanban-card-header">
                    <span className="kanban-client">{task.client?.name || 'Unknown Client'}</span>
                    <span className="kanban-priority">{task.priority}</span>
                  </div>
                  <div className="kanban-alert">{task.alert?.message}</div>
                  <div className="kanban-due">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</div>
                  <div className="kanban-comments">{task.comments}</div>
                  <div className="kanban-actions">
                    {col.key !== 'done' && (
                      <button onClick={() => updateStatus(task, col.key === 'open' ? 'in-progress' : 'done')}>
                        Mark as {col.key === 'open' ? 'In Progress' : 'Done'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.25)', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 14, padding: 36, minWidth: 400, maxWidth: 520, boxShadow: '0 4px 24px rgba(20,121,184,0.18)', border: '1px solid #eaf6fa' }}>
            <h3 style={{ marginTop: 0, marginBottom: 24, color: '#1479b8', fontWeight: 700, fontSize: 26, letterSpacing: 0.5 }}>Create New Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, color: '#333', marginBottom: 4, display: 'block' }}>Client</label>
                  <select name="clientId" value={form.clientId} onChange={handleFormChange} required disabled={loading} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #b3e0f7', fontSize: 15, background: '#f8fcff' }}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, color: '#333', marginBottom: 4, display: 'block' }}>Assignee</label>
                  <select name="assigneeId" value={form.assigneeId} onChange={handleFormChange} required disabled={loading} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #b3e0f7', fontSize: 15, background: '#f8fcff' }}>
                    <option value="">Select assignee</option>
                    {practitioners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600, color: '#333', marginBottom: 4, display: 'block' }}>Suggested Time Slots:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <label style={{ fontWeight: 500 }}>Slot Duration:</label>
                  <select value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))} disabled={slotLoading || loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #b3e0f7', fontSize: 15, background: '#f8fcff' }}>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
                {slotLoading && <div style={{ color: '#888', fontStyle: 'italic', margin: '8px 0' }}>Loading slots...</div>}
                {slotError && <div style={{ color: '#d9534f', fontWeight: 500, margin: '8px 0' }}>{slotError}</div>}
                {!slotLoading && !slotError && slotSuggestions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                    {(showAllSlots ? slotSuggestions : slotSuggestions.slice(0, 3)).map((slot, idx) => {
                      const start = new Date(slot.start);
                      const end = new Date(slot.end);
                      const weekday = start.toLocaleDateString(undefined, { weekday: 'long' });
                      const dateStr = start.toLocaleDateString();
                      const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      return (
                        <label key={slot.start} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderRadius: 6, cursor: 'pointer', background: form.dueDate === slot.start ? '#eaf6fa' : 'transparent' }}>
                          <input
                            type="radio"
                            name="dueDateSlot"
                            value={slot.start}
                            checked={form.dueDate === slot.start}
                            onChange={() => setForm(f => ({ ...f, dueDate: slot.start }))}
                            disabled={loading}
                            style={{ accentColor: '#1479b8' }}
                          />
                          <span style={{ fontWeight: 500, color: '#1479b8' }}>{weekday}</span>, {dateStr} <span style={{ color: '#1479b8', fontWeight: 600 }}>{timeStr}</span>
                        </label>
                      );
                    })}
                    {slotSuggestions.length > 3 && !showAllSlots && (
                      <button type="button" className="btn" style={{ marginTop: 6, background: '#eaf6fa', color: '#1479b8', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => setShowAllSlots(true)}>
                        Show more slots
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8, background: '#f8fcff', borderRadius: 8, padding: 12, border: '1px solid #eaf6fa' }}>
                <strong style={{ color: '#1479b8' }}>Busy Times:</strong>
                <div style={{ fontSize: 13, color: '#b81d1d', marginTop: 2, display: 'flex', gap: 16 }}>
                  <div><b>Client:</b> {busySlots.client.length === 0 ? <span style={{ color: '#888' }}>None</span> : ''}</div>
                  <div><b>Assignee:</b> {busySlots.assignee.length === 0 ? <span style={{ color: '#888' }}>None</span> : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ color: '#b81d1d' }}>{busySlots.client.map((b, i) => (
                    <div key={i}>{new Date(b.start).toLocaleString()} - {b.end ? new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  ))}</div>
                  <div style={{ color: '#b81d1d' }}>{busySlots.assignee.map((b, i) => (
                    <div key={i}>{new Date(b.start).toLocaleString()} - {b.end ? new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                  ))}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ fontWeight: 600, color: '#333', marginRight: 8 }}>Or pick a custom time:</label>
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} disabled={loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #b3e0f7', background: '#f8fcff' }} />
                <input type="time" value={customTime} onChange={e => setCustomTime(e.target.value)} step="900" disabled={loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #b3e0f7', background: '#f8fcff' }} />
                <button type="button" className="btn" style={{ fontSize: 13, background: '#eaf6fa', color: '#1479b8', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { if (customDate && customTime) setForm(f => ({ ...f, dueDate: new Date(`${customDate}T${customTime}`).toISOString() })); }}
                  disabled={!customDate || !customTime || loading}
                >Set as Due</button>
                {customConflict && <div style={{ color: '#d9534f', marginLeft: 8 }}>{customConflict}</div>}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <label style={{ fontWeight: 600, color: '#333' }}>Due Date:</label>
                <input type="date" name="dueDate" value={form.dueDate} onChange={handleFormChange} required disabled={loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #b3e0f7', background: '#f8fcff' }} />
                <label style={{ fontWeight: 600, color: '#333' }}>Priority:</label>
                <select name="priority" value={form.priority} onChange={handleFormChange} disabled={loading} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #b3e0f7', background: '#f8fcff' }}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontWeight: 600, color: '#333', display: 'block', marginBottom: 4 }}>Comments:</label>
                <textarea name="comments" value={form.comments} onChange={handleFormChange} disabled={loading} style={{ width: '100%', minHeight: 48, borderRadius: 6, border: '1px solid #b3e0f7', background: '#f8fcff', fontSize: 15, padding: 10, resize: 'vertical' }} />
              </div>
              {formError && <div className="form-error" style={{ color: '#d9534f', marginTop: 8 }}>{formError}</div>}
              <div style={{ marginTop: 18, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={closeModal} disabled={loading} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 16 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: '#1479b8', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 700, fontSize: 16 }}>{loading ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default TasksPage; 