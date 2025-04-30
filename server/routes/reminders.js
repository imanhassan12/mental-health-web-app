const express = require('express');
const router = express.Router();
const db = require('../models');
const { sendSMS } = require('../utils/twilio');

const Reminder = db.Reminder;

// POST /reminders - create a reminder and send SMS
router.post('/', async (req, res) => {
  try {
    const { clientId, practitionerId, alertId, type, message, dueDate, recurrence, recurrenceRule, phoneNumber } = req.body;
    if (!message || !dueDate || !phoneNumber) {
      return res.status(400).json({ error: 'message, dueDate, and phoneNumber are required.' });
    }
    const reminder = await Reminder.create({
      clientId,
      practitionerId,
      alertId,
      type: type || 'custom',
      message,
      dueDate,
      recurrence: recurrence || 'none',
      recurrenceRule,
      phoneNumber,
      isDone: false,
      sent: false,
    });
    // Send SMS
    await sendSMS(phoneNumber, message);
    reminder.sent = true;
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ error: 'Failed to create reminder.' });
  }
});

// GET /reminders - list reminders (optionally filter by clientId, practitionerId, isDone)
router.get('/', async (req, res) => {
  try {
    const { clientId, practitionerId, isDone } = req.query;
    const where = {};
    if (clientId) where.clientId = clientId;
    if (practitionerId) where.practitionerId = practitionerId;
    if (isDone !== undefined) where.isDone = isDone === 'true';
    const reminders = await Reminder.findAll({ where, order: [['dueDate', 'ASC']] });
    res.json(reminders);
  } catch (err) {
    console.error('Error listing reminders:', err);
    res.status(500).json({ error: 'Failed to list reminders.' });
  }
});

// PUT /reminders/:id - update a reminder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByPk(id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found.' });
    const fields = ['message', 'dueDate', 'recurrence', 'recurrenceRule', 'isDone', 'phoneNumber', 'type'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) reminder[field] = req.body[field];
    });
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    console.error('Error updating reminder:', err);
    res.status(500).json({ error: 'Failed to update reminder.' });
  }
});

// PATCH /reminders/:id/done - mark a reminder as done
router.patch('/:id/done', async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByPk(id);
    if (!reminder) return res.status(404).json({ error: 'Reminder not found.' });
    reminder.isDone = true;
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    console.error('Error marking reminder as done:', err);
    res.status(500).json({ error: 'Failed to mark reminder as done.' });
  }
});

module.exports = router; 