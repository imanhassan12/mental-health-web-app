// server/routes/appointments.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Appointment, Client, Practitioner } = db;
const auditLog = require('../utils/auditLogger');

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ]
    });
    await auditLog({ req, action: 'VIEW_APPOINTMENT_LIST', entity: 'Appointment', entityId: null, details: { count: appointments.length } });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// GET single appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await auditLog({ req, action: 'VIEW_APPOINTMENT', entity: 'Appointment', entityId: appointment.id, details: {} });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE an appointment
router.post('/', async (req, res) => {
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  if (!clientId || !practitionerId || !startTime) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const client = await Client.findByPk(clientId);
    const practitioner = await Practitioner.findByPk(practitionerId);
    if (!client || !practitioner) {
      return res.status(404).json({ message: 'Client or practitioner not found.' });
    }
    const appointment = await Appointment.create({
      clientId,
      practitionerId,
      startTime,
      endTime: endTime || null,
      status: status || 'scheduled',
      title: title || 'Session',
      notes: notes || ''
    });
    await auditLog({ req, action: 'CREATE_APPOINTMENT', entity: 'Appointment', entityId: appointment.id, details: req.body });
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
});

// UPDATE an appointment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  try {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    await appointment.update({
      clientId: clientId || appointment.clientId,
      practitionerId: practitionerId || appointment.practitionerId,
      startTime: startTime || appointment.startTime,
      endTime: endTime || appointment.endTime,
      status: status || appointment.status,
      title: title || appointment.title,
      notes: notes || appointment.notes
    });
    await auditLog({ req, action: 'UPDATE_APPOINTMENT', entity: 'Appointment', entityId: appointment.id, details: req.body });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// DELETE an appointment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    await appointment.destroy();
    await auditLog({ req, action: 'DELETE_APPOINTMENT', entity: 'Appointment', entityId: appointment.id, details: {} });
    res.json({ message: 'Appointment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error: error.message });
  }
});

// GET appointments by practitioner
router.get('/practitioner/:practitionerId', async (req, res) => {
  const { practitionerId } = req.params;
  try {
    const appointments = await Appointment.findAll({
      where: { practitionerId },
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ],
      order: [['startTime', 'ASC']]
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments for practitioner', error: error.message });
  }
});

// GET appointments by client
router.get('/client/:clientId', async (req, res) => {
  const { clientId } = req.params;
  try {
    const appointments = await Appointment.findAll({
      where: { clientId },
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ],
      order: [['startTime', 'ASC']]
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments for client', error: error.message });
  }
});

// --- SMART SCHEDULING ENDPOINT ---
router.get('/schedule/suggest', async (req, res) => {
  const { clientId, assigneeId, duration, limit } = req.query;
  if (!clientId || !assigneeId) return res.status(400).json({ message: 'clientId and assigneeId required' });
  const slotDuration = Number(duration) || 60; // in minutes
  const slotLimit = Math.min(Number(limit) || 3, 10);
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 14);
  const clientAppts = await Appointment.findAll({
    where: {
      clientId,
      startTime: { [db.Sequelize.Op.between]: [now, endDate] }
    }
  });
  const assigneeAppts = await Appointment.findAll({
    where: {
      practitionerId: assigneeId,
      startTime: { [db.Sequelize.Op.between]: [now, endDate] }
    }
  });
  const busy = [...clientAppts, ...assigneeAppts].map(a => ({
    start: new Date(a.startTime),
    end: a.endTime ? new Date(a.endTime) : new Date(new Date(a.startTime).getTime() + 60 * 60 * 1000)
  }));
  function isFree(slotStart, slotEnd) {
    return !busy.some(b => slotStart < b.end && slotEnd > b.start);
  }
  const slots = [];
  let day = new Date(now);
  for (let d = 0; d < 14 && slots.length < slotLimit; d++) {
    const weekday = day.getDay();
    if (weekday !== 0 && weekday !== 6) { // Mon-Fri
      for (let hour = 9; hour <= 17 - Math.ceil(slotDuration / 60); hour++) {
        const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
        if (slotStart > now && isFree(slotStart, slotEnd)) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
          if (slots.length >= slotLimit) break;
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }
  return res.json(slots);
});

// --- BUSY SLOTS ENDPOINT ---
router.get('/schedule/busy', async (req, res) => {
  const { clientId, assigneeId } = req.query;
  if (!clientId || !assigneeId) return res.status(400).json({ message: 'clientId and assigneeId required' });
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 14);
  const clientAppts = await Appointment.findAll({
    where: {
      clientId,
      startTime: { [db.Sequelize.Op.between]: [now, endDate] }
    }
  });
  const assigneeAppts = await Appointment.findAll({
    where: {
      practitionerId: assigneeId,
      startTime: { [db.Sequelize.Op.between]: [now, endDate] }
    }
  });
  res.json({
    client: clientAppts.map(a => ({ start: a.startTime, end: a.endTime })),
    assignee: assigneeAppts.map(a => ({ start: a.startTime, end: a.endTime }))
  });
});

module.exports = router;
