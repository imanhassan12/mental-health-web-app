// client/src/pages/ClientsPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ClientsPage.css';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => setClients(data))
      .catch(err => console.error('Error fetching clients:', err));
  }, []);

  return (
    <div className="clients-page">
      <h2>Clients</h2>
      <Link to="/clients/new" className="btn primary">+ Add Client</Link>

      {clients.length === 0 ? (
        <p>No clients found.</p>
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
