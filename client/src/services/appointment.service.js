import api from './api';

const AppointmentService = {
  // Get all appointments
  getAllAppointments: async () => {
    try {
      const response = await api.get('/appointments');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get appointments for a specific practitioner
  getPractitionerAppointments: async (practitionerId) => {
    try {
      const response = await api.get(`/appointments/practitioner/${practitionerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get appointments for a specific client
  getClientAppointments: async (clientId) => {
    try {
      const response = await api.get(`/appointments/client/${clientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific appointment by ID
  getAppointmentById: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new appointment
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing appointment
  updateAppointment: async (id, appointmentData) => {
    try {
      const response = await api.put(`/appointments/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete an appointment
  deleteAppointment: async (id) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default AppointmentService; 