// client/src/pages/ClientForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ClientForm = ({ isEdit }) => {
  const { clientId } = useParams(); // if editing a specific client
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isEdit && clientId) {
      // Fetch existing client data
      fetch(`/api/clients/${clientId}`)
        .then(res => res.json())
        .then(client => {
          setName(client.name);
          setPhone(client.phone);
          setNotes(client.notes);
        })
        .catch(err => console.error('Error fetching client:', err));
    }
  }, [isEdit, clientId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { name, phone, notes };

    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/clients/${clientId}` : '/api/clients';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        console.log('Client saved:', data);
        // redirect back to clients list
        navigate('/clients');
      })
      .catch(err => console.error('Error saving client:', err));
  };

  return (
    <div className="client-form-page">
      <h2>{isEdit ? 'Edit Client' : 'Add Client'}</h2>

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-group">
          <label>Client Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn primary">
          {isEdit ? 'Update Client' : 'Create Client'}
        </button>
      </form>
    </div>
  );
};

export default ClientForm;
