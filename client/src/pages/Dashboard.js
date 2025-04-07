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
  const [topGoals, setTopGoals] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [todaysAppt, setTodaysAppt] = useState('--'); // For today's appointment count

  useEffect(() => {
    // Use the api service instead of direct fetch
    Promise.all([
      api.get('/dashboard-stats'),
      api.get('/dashboard-clients'),
      api.get('/dashboard-notes'),
    ])
    .then(([statsResponse, clientsResponse, notesResponse]) => {
      const statsData = statsResponse.data;
      const clientsData = clientsResponse.data;
      const notesData = notesResponse.data;
      
      setActiveClients(statsData.activeClients);
      setAvgMood(statsData.avgMood);
      setUpcomingCount(statsData.upcomingAppointments);
      setAlerts(statsData.alerts);
      setRecentClients(clientsData.recent || []);
      setTopGoals(statsData.topGoals || []);
      setRecentNotes(notesData.recent || []);
      setTodaysAppointments(statsData.todaysAppointments || []);
      
      // Set today's appointment count
      if (statsData.todaysAppointments && Array.isArray(statsData.todaysAppointments)) {
        setTodaysAppt(statsData.todaysAppointments.length);
      }
    })
    .catch(err => console.error('Error fetching dashboard data:', err));
  }, []);

  // Prepare mood chart data
  const moodChartData = {
    labels: recentNotes.map(note => note.sessionDate || '').slice(0, 10).reverse(),
    datasets: [
      {
        label: 'Mood Rating',
        data: recentNotes.map(note => note.moodRating || null).slice(0, 10).reverse(),
        borderColor: '#2aa09b',
        backgroundColor: 'rgba(42, 160, 155, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2aa09b',
        pointHoverBackgroundColor: '#1e7772', 
        pointBorderColor: '#fff',
        pointHoverBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0
        },
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        title: {
          display: true,
          text: 'Mood Rating',
          font: {
            size: 14
          }
        }
      },
      x: {
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(200, 200, 200, 0.2)'
        },
        title: {
          display: true,
          text: 'Date',
          font: {
            size: 14
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        callbacks: {
          title: (tooltipItems) => {
            return `Date: ${tooltipItems[0].label}`;
          },
          label: (context) => {
            return `Mood Rating: ${context.parsed.y}/10`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2,
        fill: true
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
        hoverBorderWidth: 2
      }
    }
  };

  // Dummy data for overall mood trend - in a real app, you'd get this from the API
  const overallMoodTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Aggregate Mood',
        data: [5, 6, 7, 5.5, 6.8, 7.2],
        borderColor: '#67B7D1',
        backgroundColor: 'rgba(103, 183, 209, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#67B7D1',
        pointHoverBackgroundColor: '#3399CC', 
        pointBorderColor: '#fff',
        pointHoverBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7
      },
    ],
  };

  return (
    <div className="dashboard-page">
      <h2 className="dashboard-title">Overview</h2>

      {/* Top Stats Row */}
      <div className="dashboard-stats-row">
        <div className="stat-card">
          <h3>Active Clients</h3>
          <p className="stat-value">{activeClients}</p>
        </div>

        <div className="stat-card">
          <h3>Avg Mood</h3>
          <p className="stat-value">{avgMood || '--'}</p>
        </div>

        <div className="stat-card">
          <h3>Upcoming Appointments</h3>
          <p className="stat-value">{upcomingCount}</p>
        </div>

        <div className="stat-card">
          <h3>Today's Appt</h3>
          <p className="stat-value">{todaysAppt}</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="alerts-section">
        <h3>Alerts</h3>
        {alerts.length === 0 ? (
          <p>No urgent alerts</p>
        ) : (
          <ul>
            {alerts.map(alert => (
              <li key={alert.id}>
                {alert.message} <Link to={alert.link}>View</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Overall Mood Trend */}
      <div className="mood-trend-section">
        <h3>Overall Mood Trend</h3>
        <p>All Assigned Clients (Aggregate)</p>
        <div className="chart-container">
          <Line data={overallMoodTrendData} options={chartOptions} />
        </div>
        <Link to="/analytics" className="view-link">View Full Mood Analytics</Link>
      </div>

      {/* Appointment Calendar Section */}
      <div className="appointment-section">
        <h3>Appointments Calendar</h3>
        <FullCalendar />
      </div>

      {/* Next Row: Clients, Mood Trends, Goals */}
      <div className="dashboard-lower-row">
        <div className="dashboard-card">
          <h3>Clients</h3>
          {recentClients.length === 0 ? (
            <p>No recent updates.</p>
          ) : (
            <ul>
              {recentClients.map(c => (
                <li key={c.id}>
                  {c.name}: Last Check-In {c.lastCheckIn} | Mood: {c.mood}/10
                </li>
              ))}
            </ul>
          )}
          <Link to="/clients">View All Clients</Link>
        </div>

        {/* Mood Trends Chart */}
        <div className="dashboard-card">
          <h3>Mood Trends</h3>
          {recentNotes.length === 0 ? (
            <p>No mood data available.</p>
          ) : (
            <div className="chart-container">
              <Line data={moodChartData} options={chartOptions} />
            </div>
          )}
          <Link to="/progress">See Full Analytics</Link>
        </div>

        <div className="dashboard-card">
          <h3>Goals</h3>
          {topGoals.length === 0 ? (
            <p>No goals set.</p>
          ) : (
            topGoals.map(goal => (
              <div key={goal.id} className="goal-item">
                <p>{goal.title}</p>
                <div className="goal-bar">
                  <div
                    className="goal-bar-fill"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span>{goal.progress}%</span>
              </div>
            ))
          )}
          <Link to="/goals">Manage Goals</Link>
        </div>
      </div>

      {/* Another Row: Session Notes & Today's Appointments */}
      <div className="dashboard-lower-row">
      
<div className="dashboard-card">
  <h3>Session Notes</h3>
  {recentNotes.length === 0 ? (
    <p>No recent notes.</p>
  ) : (
    <ul>
      {recentNotes.map(note => (
        <li key={note.id}>
          <strong>{note.sessionDate}</strong> - {note.moodRating || '--'}/10 mood
          <Link to={`/sessionNotes/${note.id}`}> View</Link>
        </li>
      ))}
    </ul>
  )}
  {/* Quick link to add a new note */}
  <Link to="/sessionNotes/new" className="btn primary small-btn">
    + Add Session Note
  </Link>
</div>


        <div className="dashboard-card">
          <h3>Today's Appointments</h3>
          {todaysAppointments.length === 0 ? (
            <p>No appointments scheduled today.</p>
          ) : (
            <ul>
              {todaysAppointments.map(a => (
                <li key={a.id}>
                  {new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}– {a.clientName}
                  <Link to={`/appointments/${a.id}`}> Details</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
