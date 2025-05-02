import api from './api';

const messageService = {
  // Create a new thread
  createThread: (data) => api.post('/messages/thread', data).then(res => res.data),

  // Send a message (content will be encrypted on backend)
  sendMessage: (data) => api.post('/messages', data).then(res => res.data),

  // List all threads for the current user
  getThreads: () => api.get('/messages/threads').then(res => res.data),

  // List all messages in a thread
  getMessages: (threadId) => api.get(`/messages/thread/${threadId}`).then(res => res.data),

  // Export audit log (admin only)
  getAuditLog: () => api.get('/messages/audit-log').then(res => res.data),

  // List all practitioners for participant selection
  getPractitioners: () => api.get('/messages/practitioners').then(res => res.data),

  // Add participants to a thread
  addParticipants: (threadId, participantIds) => api.post(`/messages/thread/${threadId}/participants`, { participantIds }).then(res => res.data),

  // Remove a participant from a thread
  removeParticipant: (threadId, practitionerId) => api.delete(`/messages/thread/${threadId}/participants/${practitionerId}`).then(res => res.data),

  // Mark a message as read
  markMessageAsRead: (messageId, token) =>
    api.post(`/messages/${messageId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),

  // Get all users who have read a message
  getMessageReaders: (messageId, token) =>
    api.get(`/messages/${messageId}/readers`, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data),

  // Smart scheduling endpoints
  getSuggestedSlots: (clientId, assigneeId, duration, limit) =>
    api.get(`/appointments/schedule/suggest`, { params: { clientId, assigneeId, duration, limit } }).then(res => res.data),
  getBusySlots: (clientId, assigneeId) =>
    api.get(`/appointments/schedule/busy`, { params: { clientId, assigneeId } }).then(res => res.data),
};

export default messageService; 