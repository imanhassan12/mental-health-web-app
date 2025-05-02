import api from './api';

const ClientService = {
  // Get all clients
  getAllClients: async () => {
    try {
      const response = await api.get('/clients');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific client by ID
  getClientById: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new client
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients', clientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing client
  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a client
  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get AI-powered risk prediction for a client
  getClientRisk: async (id) => {
    try {
      const response = await api.get(`/clients/${id}/risk`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ClientService; 