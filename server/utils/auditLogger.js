const { AuditLog } = require('../models');

module.exports = async function auditLog({ req, action, entity, entityId, details }) {
  try {
    await AuditLog.create({
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      action,
      entity,
      entityId,
      details,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });
  } catch (err) {
    // Optionally log to console or external service
    console.error('Audit log error:', err);
  }
}; 