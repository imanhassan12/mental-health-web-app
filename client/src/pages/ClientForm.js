// client/src/pages/ClientForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ClientService from '../services/client.service';
import '../styles/ClientForm.css';

const ClientForm = ({ isEdit }) => {
  const { clientId } = useParams(); // if editing a specific client
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClientData = async () => {
      if (isEdit && clientId) {
        try {
          setLoading(true);
          const client = await ClientService.getClientById(clientId);
          setName(client.name);
          setPhone(client.phone || '');
          setNotes(client.notes || '');
          setDiagnosis(client.diagnosis || '');
          setError(null);
        } catch (err) {
          console.error('Error fetching client:', err);
          setError('Failed to load client data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchClientData();
  }, [isEdit, clientId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { name, phone, notes, diagnosis };

    try {
      setLoading(true);
      
      if (isEdit) {
        await ClientService.updateClient(clientId, payload);
      } else {
        await ClientService.createClient(payload);
      }
      
      // Redirect back to clients list
      navigate('/clients');
    } catch (err) {
      console.error('Error saving client:', err);
      setError('Failed to save client. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  if (loading && isEdit) {
    return <div className="loading">Loading client data...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <button 
          className="btn secondary" 
          onClick={() => navigate('/clients')}
        >
          Go Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="client-form-page">
      <h2>{isEdit ? 'Edit Client' : 'Add Client'}</h2>

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-group">
          <label htmlFor="name">Client Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="diagnosis">Diagnosis</label>
          <input
            id="diagnosis"
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            disabled={loading}
            placeholder="e.g. Depression, Anxiety"
          />
        </div>
        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Add any relevant information about the client here"
          />
        </div>
        <div className="form-buttons">
          <button 
            type="button" 
            className="btn secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Client' : 'Create Client')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
