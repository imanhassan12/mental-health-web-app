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
      .catch(error => {
        console.error('Error fetching dashboard data:', error);
      });
  }, []);

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
      
      {/* Appointment Calendar - Full Width */}
      <div className="full-width-section">
        <div className="appointment-section">
          <h3>Appointment Calendar</h3>
          <FullCalendar />
          <Link to="/appointments" className="view-link">Manage Appointments</Link>
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
          <Link to="/notes" className="view-link">View Session Notes</Link>
        </div>
      </div>

      {/* Bottom row: Recent Activity and Daily Mood Trend */}
      <div className="dashboard-lower-row">
        <div className="dashboard-card">
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

        <div className="dashboard-card">
          <h3>Daily Mood Trend</h3>
          {!dailyMoodData ? (
            <p>No recent mood data available.</p>
          ) : (
            <div className="chart-container">
              <Line data={dailyMoodData} options={dailyChartOptions} />
            </div>
          )}
          <Link to="/notes" className="view-link">View Session Notes</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
