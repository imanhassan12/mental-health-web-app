import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../services/api';
import AuthService from '../services/auth.service';
import '../styles/AnalyticsPage.css';

const AnalyticsPage = () => {
  const [data, setData] = useState([]);
  const [drilldown, setDrilldown] = useState(null);

  useEffect(() => {
    api.get('/analytics/engagement-by-diagnosis').then(res => setData(res.data));
  }, []);

  const chartData = {
    labels: data.map(d => d.diagnosis),
    datasets: [{
      label: 'Avg. Engagement',
      data: data.map(d => d.avgEngagement),
      backgroundColor: 'rgba(42, 160, 155, 0.7)'
    }]
  };

  const chartOptions = {
    onClick: (evt, elements) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        setDrilldown(data[idx]);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => `Avg. Engagement: ${ctx.raw}` } }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Engagement Score' } },
      x: { title: { display: true, text: 'Diagnosis' } }
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

  const handleExport = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
    downloadFile(`${backendUrl}/api/analytics/engagement-by-diagnosis/csv`, 'engagement-by-diagnosis.csv');
  };

  return (
    <div className="analytics-page">
      <h2>Client Engagement by Diagnosis</h2>
      <button className="analytics-export-btn" onClick={handleExport}>Export CSV</button>
      <div className="analytics-chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
      {drilldown && (
        <div className="drilldown-modal">
          <div className="drilldown-content">
            <h3>Clients with {drilldown.diagnosis}</h3>
            <ul>
              {drilldown.clients.map(c => (
                <li key={c.id}>
                  {c.name} – Engagement: {c.engagement} (Appointments: {c.appointments}, Notes: {c.notes}, Check-ins: {c.checkins})
                </li>
              ))}
            </ul>
            <button className="drilldown-close-btn" onClick={() => setDrilldown(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage; 