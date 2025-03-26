// client/src/pages/ClientsPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ClientService from '../services/client.service';
import '../styles/ClientsPage.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await ClientService.getAllClients();
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) {
    return (
      <div className="clients-page">
        <h2>Clients</h2>
        <div className="loading">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients-page">
        <h2>Clients</h2>
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
    <div className="clients-page">
      <h2>Clients</h2>
      <Link to="/clients/new" className="btn primary">+ Add Client</Link>

      {clients.length === 0 ? (
        <p>No clients found. Add your first client to get started.</p>
      ) : (
        <ul className="client-list">
          {clients.map((client) => (
            <li key={client.id} className="client-item">
              <Link to={`/clients/${client.id}`}>
                {client.name} - {client.phone}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientsPage;
