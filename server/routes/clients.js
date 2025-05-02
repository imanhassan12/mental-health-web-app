// server/routes/clients.js
const express = require('express');
const router = express.Router();
const { Client, FieldPreference, Practitioner, AuditLog } = require('../models');
const { Parser } = require('json2csv');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const auditLog = require('../utils/auditLogger');
const { getRiskPrediction } = require('../services/riskAgent');

// Middleware to require a specific role
function requireRole(...roles) {
  return async (req, res, next) => {
    // Log the incoming Authorization header
    console.log('[AUTH] Authorization header:', req.headers.authorization);
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      console.log('[AUTH] No token found');
      return res.status(401).json({ message: 'Unauthorized (no token)' });
    }
    let payload = null;
    try {
      payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY');
      console.log('[AUTH] Decoded JWT payload:', payload);
    } catch (err) {
      console.log('[AUTH] JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Unauthorized (invalid token)' });
    }
    // Attach user info to req
    req.user = payload;
    // Look up user in Practitioner table
    const user = await Practitioner.findByPk(req.user.id);
    if (!user) {
      console.log('[AUTH] No user found in DB for id:', req.user.id);
      return res.status(401).json({ message: 'Unauthorized (user not found)' });
    }
    console.log('[AUTH] User found in DB:', { id: user.id, username: user.username, role: user.role });
    if (!roles.includes(user.role)) {
      console.log('[AUTH] User role not allowed:', user.role, 'Required:', roles);
      return res.status(403).json({ message: 'Forbidden (role not allowed)' });
    }
    req.user = user;
    next();
  };
}

// GET all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.findAll();
    await auditLog({ req, action: 'VIEW_CLIENT_LIST', entity: 'Client', entityId: null, details: { count: clients.length } });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Import client from CSV
router.post('/import/csv', requireRole('admin'), upload.single('file'), async (req, res) => {
  const db = require('../models');
  const csv = req.file.buffer.toString();
  const rows = csv.split('\n');
  let fields = ['id','name','phone','email','notes','appointments','sessionNotes'];
  const pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id } });
  if (pref && pref.fields && pref.fields.import) fields = pref.fields.import;
  const headers = rows[0].split(',').map(h => h.trim());
  let successes = 0, errors = 0, duplicates = 0;
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    const values = rows[i].split(',');
    const record = Object.fromEntries(headers.map((h, idx) => [h, values[idx]?.trim()]));
    const filteredRecord = Object.fromEntries(fields.map(f => [f, record[f]]));
    try {
      const [client, created] = await db.Client.findOrCreate({ where: { id: filteredRecord.id }, defaults: filteredRecord });
      if (!created) duplicates++;
      else successes++;
    } catch {
      errors++;
    }
  }
  res.json({ successes, errors, duplicates });
});

// Import client from FHIR JSON
router.post('/import/fhir', requireRole('admin'), upload.single('file'), async (req, res) => {
  const db = require('../models');
  try {
    const fhir = JSON.parse(req.file.buffer.toString());
    if (fhir.resourceType !== 'Patient') throw new Error('Not a FHIR Patient resource');
    let fields = ['id','name','phone','email','notes','appointments','sessionNotes'];
    const pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id } });
    if (pref && pref.fields && pref.fields.import) fields = pref.fields.import;
    const record = {
      ...(fields.includes('id') && { id: fhir.id }),
      ...(fields.includes('name') && { name: fhir.name?.[0]?.text }),
      ...(fields.includes('phone') && { phone: fhir.telecom?.[0]?.value }),
      ...(fields.includes('email') && { email: fhir.extension?.find(e => e.url === 'email')?.valueString }),
      ...(fields.includes('notes') && { notes: fhir.extension?.find(e => e.url === 'notes')?.valueString }),
      ...(fields.includes('appointments') && { appointments: fhir.extension?.find(e => e.url === 'appointments')?.valueString }),
      ...(fields.includes('sessionNotes') && { sessionNotes: fhir.extension?.find(e => e.url === 'sessionNotes')?.valueString })
    };
    const [client, created] = await db.Client.findOrCreate({ where: { id: record.id }, defaults: record });
    res.json({ successes: created ? 1 : 0, errors: 0, duplicates: created ? 0 : 1 });
  } catch (err) {
    res.status(400).json({ message: 'Error importing FHIR', error: err.message });
  }
});

// GET /api/audit-logs - list audit logs (admin only)
router.get('/audit-logs', requireRole('admin'), async (req, res) => {
  const { start, end, action } = req.query;
  const where = {};
  if (start) where.timestamp = { ...where.timestamp, [require('sequelize').Op.gte]: new Date(start) };
  if (end) where.timestamp = { ...where.timestamp, [require('sequelize').Op.lte]: new Date(end) };
  if (action) where.action = action;
  const logs = await AuditLog.findAll({ where, order: [['timestamp', 'DESC']] });
  res.json(logs);
});

// GET /api/audit-logs/csv - export audit logs as CSV (admin only)
router.get('/audit-logs/csv', requireRole('admin'), async (req, res) => {
  const { start, end, action } = req.query;
  const where = {};
  if (start) where.timestamp = { ...where.timestamp, [require('sequelize').Op.gte]: new Date(start) };
  if (end) where.timestamp = { ...where.timestamp, [require('sequelize').Op.lte]: new Date(end) };
  if (action) where.action = action;
  const logs = await AuditLog.findAll({ where, order: [['timestamp', 'DESC']] });
  const data = logs.map(l => ({
    timestamp: l.timestamp,
    userId: l.userId,
    userRole: l.userRole,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    ip: l.ip,
    userAgent: l.userAgent,
    details: JSON.stringify(l.details)
  }));
  const parser = new Parser();
  const csv = parser.parse(data);
  res.header('Content-Type', 'text/csv');
  res.attachment('audit-logs.csv');
  res.send(csv);
});

// GET single client
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    await auditLog({ req, action: 'VIEW_CLIENT', entity: 'Client', entityId: client.id, details: { name: client.name } });
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE new client
router.post('/', async (req, res) => {
  const { name, phone, notes } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  try {
    const newClient = await Client.create({
      name,
      phone: phone || '',
      notes: notes || '',
    });
    await auditLog({ req, action: 'CREATE_CLIENT', entity: 'Client', entityId: newClient.id, details: { name, phone } });
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    await client.update(req.body);
    await auditLog({ req, action: 'UPDATE_CLIENT', entity: 'Client', entityId: client.id, details: req.body });
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    await client.destroy();
    await auditLog({ req, action: 'DELETE_CLIENT', entity: 'Client', entityId: client.id, details: { name: client.name } });
    res.json({ message: 'Client deleted' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get field preferences for current user (admin)
router.get('/field-preferences/me', requireRole('admin', 'practitioner'), async (req, res) => {
  let pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id, scope: 'user' } });
  if (!pref) {
    pref = await FieldPreference.findOne({ where: { scope: 'global' } });
  }
  if (!pref) return res.json({ import: ['id','name','phone','email','notes','appointments','sessionNotes'], export: ['id','name','phone','email','notes','appointments','sessionNotes'] });
  res.json({ import: pref.fields.import, export: pref.fields.export });
});

// Set field preferences for current user (admin)
router.post('/field-preferences/me', requireRole('admin', 'practitioner'), async (req, res) => {
  if (req.body.reset) {
    // Remove per-user preference
    await FieldPreference.destroy({ where: { practitionerId: req.user.id, scope: 'user' } });
    return res.json({ success: true });
  }
  let pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id, scope: 'user' } });
  if (!pref) {
    pref = await FieldPreference.create({ practitionerId: req.user.id, type: 'both', fields: req.body, scope: 'user' });
  } else {
    pref.fields = req.body;
    await pref.save();
  }
  res.json({ success: true });
});

// Get/set global field preferences (admin only)
router.get('/field-preferences/global', requireRole('admin', 'practitioner'), async (req, res) => {
  const pref = await FieldPreference.findOne({ where: { scope: 'global' } });
  if (!pref) return res.json({ import: ['id','name','phone','email','notes','appointments','sessionNotes'], export: ['id','name','phone','email','notes','appointments','sessionNotes'] });
  res.json({ import: pref.fields.import, export: pref.fields.export });
});
router.post('/field-preferences/global', requireRole('admin'), async (req, res) => {
  let pref = await FieldPreference.findOne({ where: { scope: 'global' } });
  if (!pref) {
    pref = await FieldPreference.create({ type: 'both', fields: req.body, scope: 'global' });
  } else {
    pref.fields = req.body;
    await pref.save();
  }
  res.json({ success: true });
});

// Export client as CSV
router.get('/:id/export/csv', requireRole('admin', 'practitioner'), async (req, res) => {
  const { id } = req.params;
  const db = require('../models');
  try {
    const client = await db.Client.findByPk(id, {
      include: [
        { model: db.Appointment, as: 'appointments' },
        { model: db.SessionNote, as: 'sessionNotes' }
      ]
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    let fields = ['id','name','phone','email','notes','appointments','sessionNotes'];
    let pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id, scope: 'user' } });
    if (!pref) pref = await FieldPreference.findOne({ where: { scope: 'global' } });
    if (pref && pref.fields && pref.fields.export) fields = pref.fields.export;
    const data = [{
      ...(fields.includes('id') && { id: client.id }),
      ...(fields.includes('name') && { name: client.name }),
      ...(fields.includes('phone') && { phone: client.phone }),
      ...(fields.includes('email') && { email: client.email }),
      ...(fields.includes('notes') && { notes: client.notes }),
      ...(fields.includes('appointments') && { appointments: JSON.stringify(client.appointments) }),
      ...(fields.includes('sessionNotes') && { sessionNotes: JSON.stringify(client.sessionNotes) })
    }];
    const parser = new Parser();
    const csv = parser.parse(data);
    await auditLog({ req, action: 'EXPORT_CLIENT_CSV', entity: 'Client', entityId: client.id, details: { fields } });
    res.header('Content-Type', 'text/csv');
    res.attachment(`client-${id}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting client as CSV', error: err.message });
  }
});

// Export client as FHIR JSON (basic Patient resource + extensions)
router.get('/:id/export/fhir', requireRole('admin', 'practitioner'), async (req, res) => {
  const { id } = req.params;
  const db = require('../models');
  try {
    const client = await db.Client.findByPk(id, {
      include: [
        { model: db.Appointment, as: 'appointments' },
        { model: db.SessionNote, as: 'sessionNotes' }
      ]
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    let fields = ['id','name','phone','email','notes','appointments','sessionNotes'];
    if (req.user.role === 'admin') {
      const pref = await FieldPreference.findOne({ where: { practitionerId: req.user.id } });
      if (pref && pref.fields && pref.fields.export) fields = pref.fields.export;
    }
    const fhir = {
      resourceType: 'Patient',
      ...(fields.includes('id') && { id: client.id }),
      ...(fields.includes('name') && { name: [{ text: client.name }] }),
      ...(fields.includes('phone') && { telecom: [{ value: client.phone }] }),
      ...(fields.includes('email') && { email: client.email }),
      extension: [
        ...(fields.includes('notes') ? [{ url: 'notes', valueString: client.notes }] : []),
        ...(fields.includes('appointments') ? [{ url: 'appointments', valueString: JSON.stringify(client.appointments) }] : []),
        ...(fields.includes('sessionNotes') ? [{ url: 'sessionNotes', valueString: JSON.stringify(client.sessionNotes) }] : [])
      ]
    };
    await auditLog({ req, action: 'EXPORT_CLIENT_FHIR', entity: 'Client', entityId: client.id, details: { fields } });
    res.json(fhir);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting client as FHIR', error: err.message });
  }
});

// Get AI-powered risk prediction for a client
router.get('/:id/risk', async (req, res) => {
  try {
    const db = require('../models');
    const client = await db.Client.findByPk(req.params.id, {
      include: [
        { model: db.SessionNote, as: 'sessionNotes', order: [['date', 'DESC']], limit: 5 },
        { model: db.Appointment, as: 'appointments', order: [['startTime', 'DESC']], limit: 10 }
      ]
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    const sessionNotes = client.sessionNotes || [];
    const moodRatings = sessionNotes.map(n => n.mood);
    const appointments = client.appointments || [];
    const riskResult = await getRiskPrediction({ sessionNotes, moodRatings, appointments });
    res.json(riskResult);
  } catch (err) {
    res.status(500).json({ message: 'Error generating risk prediction', error: err.message });
  }
});

module.exports = router;
