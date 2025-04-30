import api from './api';

const AlertService = {
  getAlerts: (acknowledged = false) => {
    return api.get(`/alerts?acknowledged=${acknowledged}`);
  },
  acknowledgeAlert: (alertId, userId = null) => {
    return api.post(`/alerts/${alertId}/acknowledge`, { userId });
  },
  escalateAlert: (alertId, data) => {
    return api.post(`/alerts/${alertId}/escalate`, data);
  }
};

export default AlertService; 