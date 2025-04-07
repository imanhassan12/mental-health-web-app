import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../styles/MoodAnalytics.css';
import api from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const MoodAnalyticsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionNotes, setSessionNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    avgMood: '–',
    minMood: '–',
    maxMood: '–',
  });

  // Fetch clients and session notes on component mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/clients'),
      api.get('/session-notes')
    ])
      .then(([clientsResponse, notesResponse]) => {
        setClients(clientsResponse.data);
        setSessionNotes(notesResponse.data);
        setFilteredNotes(notesResponse.data);
        updateStats(notesResponse.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [selectedClient, startDate, endDate, sessionNotes]);

  // Apply filters to session notes
  const applyFilters = () => {
    let filtered = [...sessionNotes];

    // Filter by client
    if (selectedClient && selectedClient !== 'all') {
      filtered = filtered.filter(note => note.clientId === selectedClient);
    }

    // Filter by date range
    if (startDate) {
      const startDateObj = new Date(startDate);
      filtered = filtered.filter(note => new Date(note.date) >= startDateObj);
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59); // End of the selected day
      filtered = filtered.filter(note => new Date(note.date) <= endDateObj);
    }

    // Update filtered notes and stats
    setFilteredNotes(filtered);
    updateStats(filtered);
  };

  // Update session statistics
  const updateStats = (notes) => {
    if (!notes || notes.length === 0) {
      setSessionStats({
        total: 0,
        avgMood: '–',
        minMood: '–',
        maxMood: '–',
      });
      return;
    }

    const moodValues = notes.map(note => note.mood).filter(mood => mood !== null && mood !== undefined);
    
    if (moodValues.length === 0) {
      setSessionStats({
        total: notes.length,
        avgMood: '–',
        minMood: '–',
        maxMood: '–',
      });
      return;
    }

    const avgMood = moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;
    const minMood = Math.min(...moodValues);
    const maxMood = Math.max(...moodValues);

    setSessionStats({
      total: notes.length,
      avgMood: avgMood.toFixed(1),
      minMood: minMood.toString(),
      maxMood: maxMood.toString(),
    });
  };

  // Prepare data for Mood Progression chart (line chart)
  const prepareMoodProgressionData = () => {
    if (filteredNotes.length === 0) return null;

    // Sort notes by date
    const sortedNotes = [...filteredNotes]
      .filter(note => note.mood !== null && note.mood !== undefined)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = sortedNotes.map(note => 
      new Date(note.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    );
    
    const data = sortedNotes.map(note => note.mood);

    return {
      labels,
      datasets: [
        {
          label: 'Mood Progression',
          data,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(75, 192, 192)',
          pointHoverBackgroundColor: 'rgb(255, 255, 255)',
          pointBorderColor: 'rgb(75, 192, 192)',
          pointHoverBorderColor: 'rgb(75, 192, 192)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  // Prepare data for Mood per Session chart (bar chart)
  const prepareMoodPerSessionData = () => {
    if (filteredNotes.length === 0) return null;

    // Sort notes by date
    const sortedNotes = [...filteredNotes]
      .filter(note => note.mood !== null && note.mood !== undefined)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = sortedNotes.map(note => 
      new Date(note.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    );
    
    const data = sortedNotes.map(note => note.mood);

    return {
      labels,
      datasets: [
        {
          label: 'Mood per Session',
          data,
          backgroundColor: 'rgba(255, 159, 64, 0.7)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1
        }
      ]
    };
  };

  // Chart options
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
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Mood: ${context.raw}/10`;
          }
        }
      }
    }
  };

  // Find client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Data for charts
  const moodProgressionData = prepareMoodProgressionData();
  const moodPerSessionData = prepareMoodPerSessionData();

  // Render session notes table
  const renderNotesTable = () => {
    if (filteredNotes.length === 0) {
      return <p className="no-data-message">No session notes found with the selected filters.</p>;
    }

    return (
      <div className="notes-table-container">
        <table className="notes-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Date</th>
              <th>Mood</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map(note => (
              <tr key={note.id}>
                <td>{getClientName(note.clientId)}</td>
                <td>{new Date(note.date).toLocaleDateString()}</td>
                <td className="mood-cell">{note.mood !== null ? note.mood : '–'}</td>
                <td className="notes-cell">{note.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  return (
    <div className="mood-analytics-page">
      <div className="analytics-header">
        <h2>Mood Analytics</h2>
        <Link to="/" className="back-button">Back to Dashboard</Link>
      </div>

      {/* Filters section */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label htmlFor="client-select">Select Client:</label>
          <select 
            id="client-select"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="all">All Assigned Clients</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="start-date">Start Date:</label>
          <input 
            type="date" 
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date">End Date:</label>
          <input 
            type="date" 
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Charts section */}
      <div className="analytics-charts">
        {/* Mood Progression (Line Chart) */}
        <div className="chart-container">
          <h3>Mood Progression (Line)</h3>
          {moodProgressionData ? (
            <div className="chart">
              <Line data={moodProgressionData} options={chartOptions} />
            </div>
          ) : (
            <p className="no-data-message">No mood data available for the selected filters.</p>
          )}
        </div>

        {/* Mood per Session (Bar Chart) */}
        <div className="chart-container">
          <h3>Mood per Session (Bar)</h3>
          {moodPerSessionData ? (
            <div className="chart">
              <Bar data={moodPerSessionData} options={chartOptions} />
            </div>
          ) : (
            <p className="no-data-message">No mood data available for the selected filters.</p>
          )}
        </div>
      </div>

      {/* Session Stats section */}
      <div className="session-stats">
        <h3>Session Data</h3>
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Total Sessions:</span>
            <span className="stat-value">{sessionStats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Mood:</span>
            <span className="stat-value">{sessionStats.avgMood}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Min Mood:</span>
            <span className="stat-value">{sessionStats.minMood}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Max Mood:</span>
            <span className="stat-value">{sessionStats.maxMood}</span>
          </div>
        </div>
      </div>

      {/* Session Notes Table */}
      {renderNotesTable()}
    </div>
  );
};

export default MoodAnalyticsPage; 