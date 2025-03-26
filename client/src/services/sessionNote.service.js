import api from './api';

const SessionNoteService = {
  // Get all session notes
  getAllSessionNotes: async () => {
    try {
      const response = await api.get('/sessionNotes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get session notes for a specific client
  getClientSessionNotes: async (clientId) => {
    try {
      const response = await api.get(`/sessionNotes/client/${clientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific session note by ID
  getSessionNoteById: async (id) => {
    try {
      const response = await api.get(`/sessionNotes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new session note
  createSessionNote: async (sessionNoteData) => {
    try {
      const response = await api.post('/sessionNotes', sessionNoteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing session note
  updateSessionNote: async (id, sessionNoteData) => {
    try {
      const response = await api.put(`/sessionNotes/${id}`, sessionNoteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a session note
  deleteSessionNote: async (id) => {
    try {
      const response = await api.delete(`/sessionNotes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default SessionNoteService; 