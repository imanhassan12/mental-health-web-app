import api from './api';

const AuthService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Verify if token is still valid by making a test request to a protected endpoint
  checkToken: async () => {
    try {
      // Use clients endpoint to verify token validity
      const response = await api.get('/clients');
      return true;
    } catch (error) {
      AuthService.logout();
      throw error;
    }
  }
};

export default AuthService; 