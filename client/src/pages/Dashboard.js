// client/src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/Dashboard.css';
import api from '../services/api'; // Import the API service
import FullCalendar from '../components/FullCalendar'; // Updated to use FullCalendar
import { FaExclamationTriangle } from 'react-icons/fa';
import { io } from 'socket.io-client';
import AlertService from '../services/alert.service';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [activeClients, setActiveClients] = useState(0);
  const [avgMood, setAvgMood] = useState(null); 
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [alerts, setAlerts] = useState([]); // e.g. array of "risk" items
  const [recentClients, setRecentClients] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [todaysAppt, setTodaysAppt] = useState('--'); // For today's appointment count
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateAlert, setEscalateAlert] = useState(null);
  const [escalateForm, setEscalateForm] = useState({ priority: 'high', dueDate: '', note: '' });
  const [showHistory, setShowHistory] = useState(false);
  const [historyAlert, setHistoryAlert] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [escalateError, setEscalateError] = useState('');

  useEffect(() => {
    // Use the api service instead of direct fetch
    Promise.all([
      api.get('/dashboard-stats'),
      api.get('/dashboard-clients'),
      api.get('/dashboard-notes')
    ])
      .then(([statsResponse, clientsResponse, notesResponse]) => {
        const statsData = statsResponse.data;
        const clientsData = clientsResponse.data;
        const notesData = notesResponse.data;
        
        // Set the state based on API response
        setActiveClients(statsData.activeClients || 0);
        setAvgMood(statsData.avgMood || '--');
        setUpcomingCount(statsData.upcomingAppointments || 0);
        setTodaysAppt(statsData.todaysAppointments ? statsData.todaysAppointments.length : 0);
        setTodaysAppointments(statsData.todaysAppointments || []);
        
        // Set other state variables from API
        setRecentClients(clientsData.recent || []);
        setRecentNotes(notesData.recent || []);
      })
      .then(() => {
        return AlertService.getAlerts(false).then(res => setAlerts(res.data));
      })
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
      });
  }, []);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000');
    const requestNotif = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    requestNotif();
    socket.on('alert-new', (alert) => {
      setAlerts(prev => [alert, ...prev]);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Risk Alert', {
          body: `${alert.clientName}: ${alert.message}`,
          icon: '/favicon.ico'
        });
      }
    });
    socket.on('alert-updated', (alert) => {
      setAlerts(prev => {
        if (alert.acknowledged) {
          return prev.filter(a => a.id !== alert.id);
        }
        return prev.map(a => (a.id === alert.id ? alert : a));
      });
    });
    return () => socket.disconnect();
  }, []);

  const acknowledge = async (id) => {
    await AlertService.acknowledgeAlert(id);
  };

  const openEscalate = (alert) => {
    console.log('openEscalate called', alert);
    setEscalateAlert(alert);
    setEscalateForm({ priority: 'high', dueDate: '', note: '' });
    setShowEscalate(true);
  };

  const closeEscalate = () => {
    setShowEscalate(false);
    setEscalateAlert(null);
  };

  const handleEscalateChange = (e) => {
    setEscalateForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submitEscalate = async (e) => {
    e.preventDefault();
    if (!escalateForm.priority || !escalateForm.dueDate || !escalateForm.note.trim()) {
      setEscalateError('All fields are required.');
      return;
    }
    setEscalateError('');
    try {
      await AlertService.escalateAlert(escalateAlert.id, escalateForm);
      closeEscalate();
    } catch (err) {
      setEscalateError('Failed to escalate alert. Please try again.');
    }
  };

  const openHistory = async (alert) => {
    setHistoryAlert(alert);
    setShowHistory(true);
    const res = await api.get(`/alerts/${alert.id}/history`);
    setAuditLogs(res.data);
  };

  const closeHistory = () => {
    setShowHistory(false);
    setHistoryAlert(null);
    setAuditLogs([]);
  };

  // Prepare data for the overall mood trend chart
  const prepareMoodData = () => {
    const labels = recentNotes.map(note => note.sessionDate).reverse();
    const data = recentNotes.map(note => note.moodRating).reverse();
    
    return {
      labels,
      datasets: [
        {
          label: 'Mood Rating',
          data,
          borderColor: 'rgb(42, 160, 155)',
          backgroundColor: 'rgba(42, 160, 155, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(42, 160, 155)',
          pointHoverBackgroundColor: 'rgb(255, 255, 255)',
          pointBorderColor: 'rgb(42, 160, 155)',
          pointHoverBorderColor: 'rgb(42, 160, 155)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  // Prepare data for the daily mood trend chart (secondary chart)
  const prepareDailyMoodData = () => {
    if (recentNotes.length === 0) return null;
    
    // Process notes to get day-wise mood averages for the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Create an array of the last 7 days as labels
    const dayLabels = [];
    const dayData = Array(7).fill(null);
    
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      dayLabels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
    }
    
    // Calculate average mood for each day from notes
    recentNotes.forEach(note => {
      const noteDate = new Date(note.sessionDate);
      
      // Skip if note is older than 7 days
      if (noteDate < sevenDaysAgo) return;
      
      // Find which day index this note belongs to
      const diffTime = Math.abs(today - noteDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dayIndex = 6 - diffDays; // Reverse index because our array goes backward
      
      if (dayIndex >= 0 && dayIndex < 7) {
        if (dayData[dayIndex] === null) {
          dayData[dayIndex] = { sum: note.moodRating, count: 1 };
        } else {
          dayData[dayIndex].sum += note.moodRating;
          dayData[dayIndex].count += 1;
        }
      }
    });
    
    // Convert to averages
    const moodAverages = dayData.map(day => 
      day === null ? null : Math.round((day.sum / day.count) * 10) / 10
    );
    
    return {
      labels: dayLabels,
      datasets: [
        {
          label: 'Daily Mood Average',
          data: moodAverages,
          borderColor: 'rgb(103, 183, 209)',
          backgroundColor: 'rgba(103, 183, 209, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(103, 183, 209)',
          pointHoverBackgroundColor: 'rgb(255, 255, 255)',
          pointBorderColor: 'rgb(103, 183, 209)',
          pointHoverBorderColor: 'rgb(103, 183, 209)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 1
        },
        grid: {
          display: true,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        title: {
          display: true,
          text: 'Mood Rating'
        }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: 'Date'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            return `Mood: ${context.raw}/10`;
          }
        }
      }
    }
  };

  const dailyChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: {
          display: true,
          text: 'Daily Mood Average'
        }
      },
      x: {
        ...chartOptions.scales.x,
        title: {
          display: true,
          text: 'Day'
        }
      }
    }
  };

  const moodChartData = prepareMoodData();
  const dailyMoodData = prepareDailyMoodData();

  return (
    <div className="dashboard-page">
      <h2 className="dashboard-title">Dashboard</h2>
      
      {/* Top stats row */}
      <div className="dashboard-stats-row">
        <div className="stat-card">
          <h3>Active Clients</h3>
          <div className="stat-value">{activeClients}</div>
        </div>
        
        <div className="stat-card">
          <h3>Average Mood</h3>
          <div className="stat-value">{avgMood}</div>
        </div>
        
        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <div className="stat-value">{upcomingCount}</div>
        </div>
        
        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <div className="stat-value">{todaysAppt}</div>
        </div>
      </div>
      
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Risk Alerts</h3>
          <ul className="alerts-list">
            {alerts.map((alert, idx) => (
              <li key={idx} className={`alert-item alert-${alert.type}`}>  
                <FaExclamationTriangle className="alert-icon" aria-label="Critical alert" />
                <div className="alert-content">
                  <Link to={`/clients/${alert.clientId}`} className="alert-link alert-client">
                    {alert.clientName || 'Client'}
                  </Link>
                  <span className="alert-message">{alert.message}</span>
                </div>
                <span className="alert-badge critical">Critical</span>
                {!alert.acknowledged && (
                  <button className="ack-btn" onClick={() => acknowledge(alert.id)}>Acknowledge</button>
                )}
                {!alert.acknowledged && (
                  <button className="escalate-btn" onClick={() => openEscalate(alert)}>Escalate</button>
                )}
                <button className="history-btn" onClick={() => openHistory(alert)} title="View History">🕑</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Appointment Calendar - Full Width */}
      <div className="full-width-section">
        <div className="appointment-section">
          <h3>Appointment Calendar</h3>
          <FullCalendar />
        </div>
      </div>
      
      {/* Overall Mood Trend - Full Width */}
      <div className="full-width-section">
        <div className="mood-trend-section">
          <h3>Overall Mood Trend</h3>
          {recentNotes.length === 0 ? (
            <p>No mood data available.</p>
          ) : (
            <div className="chart-container">
              <Line data={moodChartData} options={chartOptions} />
            </div>
          )}
          <div className="view-links">
            <Link to="/notes" className="view-link">View Session Notes</Link>
            <Link to="/mood-analytics" className="view-link">View Full Analytics</Link>
          </div>
        </div>
      </div>

      {/* Bottom row: Recent Activity only (full width) */}
      <div className="dashboard-lower-row">
        <div className="dashboard-card full-width">
          <h3>Recent Clients</h3>
          {recentClients.length === 0 ? (
            <p>No recent client activity.</p>
          ) : (
            <ul>
              {recentClients.map(client => (
                <li key={client.id}>
                  <strong>{client.name}</strong> - Last check-in: {client.lastCheckIn}, Mood: {client.mood || '--'}
                  <Link to={`/clients/${client.id}`}> View</Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/clients" className="view-link">View All Clients</Link>
        </div>
      </div>

      {showEscalate && (
        <div className="modal-overlay" style={{zIndex: 2000, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)'}}>
          <div className="escalate-modal">
            <h3>Escalate Alert</h3>
            <form className="escalate-form" onSubmit={submitEscalate}>
              {escalateError && <div className="escalate-error">{escalateError}</div>}
              <label className="escalate-label">Priority:
                <select className="escalate-input" name="priority" value={escalateForm.priority} onChange={handleEscalateChange}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="escalate-label">Due Date:
                <input className="escalate-input" type="date" name="dueDate" value={escalateForm.dueDate} onChange={handleEscalateChange} />
              </label>
              <label className="escalate-label">Note:
                <textarea className="escalate-input" name="note" value={escalateForm.note} onChange={handleEscalateChange} />
              </label>
              <div className="escalate-actions">
                <button type="submit" className="escalate-btn">Submit</button>
                <button type="button" onClick={closeEscalate} className="escalate-cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="modal-overlay" style={{zIndex: 2000}}>
          <div className="history-modal" style={{zIndex: 2100, background: '#fff', position: 'relative', minWidth: 320}}>
            <h3>Alert History</h3>
            <ul className="audit-timeline">
              {auditLogs.length === 0 ? <li>No history found.</li> : auditLogs.map(log => (
                <li key={log.id}>
                  <span className="audit-action">{log.action}</span> by <span className="audit-actor">{log.actorId || 'System'}</span> <span className="audit-date">{new Date(log.createdAt).toLocaleString()}</span>
                  {log.note && <div className="audit-note">{log.note}</div>}
                </li>
              ))}
            </ul>
            <button onClick={closeHistory} style={{marginTop:'1rem'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
