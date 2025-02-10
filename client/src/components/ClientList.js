import React from 'react';
import '../styles/ClientList.css';

const ClientList = () => {
  const clients = [
    { id: 1, name: "Alice", lastCheckIn: "2025-01-15", mood: "8/10" },
    { id: 2, name: "Bob", lastCheckIn: "2025-01-14", mood: "6/10" },
    { id: 3, name: "Charlie", lastCheckIn: "2025-01-16", mood: "7/10" }
  ];

  return (
    <div className="client-list">
      <h2>Clients</h2>
      <ul>
        {clients.map(client => (
          <li key={client.id}>
            <span className="client-name">{client.name}</span>
            <span className="client-checkin">Last Check-In: {client.lastCheckIn}</span>
            <span className="client-mood">Mood: {client.mood}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientList;
