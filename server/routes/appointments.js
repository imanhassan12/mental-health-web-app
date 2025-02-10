// server/routes/appointments.js
const express = require('express');
const router = express.Router();

// In a real app, replace this with your database model or ORM queries.
let appointments = []; // TEMP: In-memory array for demonstration

// GET all appointments
router.get('/', (req, res) => {
  // You would fetch from your DB in a real scenario
  res.json(appointments);
});

// CREATE an appointment
router.post('/', (req, res) => {
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  
  // Basic validation (expand as needed)
  if (!clientId || !practitionerId || !startTime) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const newAppointment = {
    id: String(Date.now()), // or DB-generated ID
    clientId,
    practitionerId,
    startTime,
    endTime: endTime || null,
    status: status || 'scheduled',
    title: title || 'Session',
    notes: notes || '',
  };

  appointments.push(newAppointment);
  res.status(201).json(newAppointment);
});

// UPDATE an appointment
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;

  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }

  // Merge updates
  appointments[index] = {
    ...appointments[index],
    clientId: clientId ?? appointments[index].clientId,
    practitionerId: practitionerId ?? appointments[index].practitionerId,
    startTime: startTime ?? appointments[index].startTime,
    endTime: endTime ?? appointments[index].endTime,
    status: status ?? appointments[index].status,
    title: title ?? appointments[index].title,
    notes: notes ?? appointments[index].notes,
  };

  res.json(appointments[index]);
});

// DELETE an appointment
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }
  appointments.splice(index, 1);
  res.json({ message: 'Appointment deleted.' });
});

module.exports = router;
