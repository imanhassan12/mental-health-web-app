const { AuditLog } = require('../models');

module.exports = async function auditLog({ req, action, entity, entityId, details }) {
  console.log('auditLog', req, action, entity, entityId, details);
  if (!req.user) {
    console.warn('Audit log skipped: req.user is missing');
    return;
  }
  try {
    await AuditLog.create({
      userId: req.user.id,
      userRole: req.user.role,
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