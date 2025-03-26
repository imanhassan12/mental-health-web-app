import api from './api';

const GoalService = {
  // Get all goals
  getAllGoals: async () => {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get goals for a specific client
  getClientGoals: async (clientId) => {
    try {
      const response = await api.get(`/goals/client/${clientId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a specific goal by ID
  getGoalById: async (id) => {
    try {
      const response = await api.get(`/goals/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new goal
  createGoal: async (goalData) => {
    try {
      const response = await api.post('/goals', goalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing goal
  updateGoal: async (id, goalData) => {
    try {
      const response = await api.put(`/goals/${id}`, goalData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a goal
  deleteGoal: async (id) => {
    try {
      const response = await api.delete(`/goals/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update goal status
  updateGoalStatus: async (id, status) => {
    try {
      const response = await api.patch(`/goals/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default GoalService; 