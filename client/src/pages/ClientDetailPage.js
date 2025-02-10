// client/src/pages/ClientDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ClientDetailPage = () => {
  const { clientId } = useParams();
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Example: fetch client detail from /api/clients/:clientId
    fetch(`/api/clients/${clientId}`)
      .then(res => res.json())
      .then(data => setClient(data))
      .catch(err => console.error('Error fetching client detail:', err));
  }, [clientId]);

  if (!client) {
    return <div>Loading client data...</div>;
  }

  return (
    <div>
      <h2>Client Detail</h2>
      <p><strong>Name:</strong> {client.name}</p>
      <p><strong>Phone:</strong> {client.phone}</p>
      <p><strong>Notes:</strong> {client.notes}</p>
      {/* Any other fields you need */}
      
      <Link to={`/clients/${clientId}/edit`}>Edit Client</Link>
    </div>
  );
};

export default ClientDetailPage;
