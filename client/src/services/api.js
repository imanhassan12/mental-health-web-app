import axios from 'axios';

// Create an axios instance with defaults
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// If you have any hardcoded endpoints for schedule, update them:
// Example (if using axios):
// api.get('/appointments/schedule/suggest', ...)
// api.get('/appointments/schedule/busy', ...)

export const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
// update baseURL accordingly
api.defaults.baseURL = backendUrl + '/api';

export default api; 