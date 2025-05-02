const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');

// Helper: Calculate engagement score
function calcEngagement({ appointments, sessionNotes }) {
  // Appointments: count only completed
  const attendedAppointments = appointments.filter(a => a.status === 'completed').length;
  // Session notes: all notes
  const notesCount = sessionNotes.length;
  // Mood check-ins: session notes with a mood value
  const checkinsCount = sessionNotes.filter(n => n.mood !== null && n.mood !== undefined).length;

  // Engagement formula (adjust weights as needed)
  return (attendedAppointments * 2) + notesCount + checkinsCount;
}

// GET /api/analytics/engagement-by-diagnosis
router.get('/engagement-by-diagnosis', async (req, res) => {
  // 1. Get all clients with their diagnosis, appointments, and session notes
  const clients = await db.Client.findAll({
    include: [
      { model: db.Appointment, as: 'appointments' },
      { model: db.SessionNote, as: 'sessionNotes' }
    ]
  });
  // 2. Group by diagnosis
  const diagnosisMap = {};
  for (const client of clients) {
    const diagnosis = client.diagnosis || 'Unknown';
    if (!diagnosisMap[diagnosis]) diagnosisMap[diagnosis] = [];
    // Engagement metrics
    const engagement = calcEngagement({
      appointments: client.appointments || [],
      sessionNotes: client.sessionNotes || []
    });
    diagnosisMap[diagnosis].push({
      id: client.id,
      name: client.name,
      engagement,
      appointments: (client.appointments || []).filter(a => a.status === 'completed').length,
      notes: (client.sessionNotes || []).length,
      checkins: (client.sessionNotes || []).filter(n => n.mood !== null && n.mood !== undefined).length
    });
  }
  // 3. Prepare response
  const result = Object.entries(diagnosisMap).map(([diagnosis, clients]) => ({
    diagnosis,
    avgEngagement: clients.length ? (clients.reduce((sum, c) => sum + c.engagement, 0) / clients.length).toFixed(2) : 0,
    clients: clients.sort((a, b) => a.engagement - b.engagement)
  }));
  res.json(result);
});

// GET /api/analytics/engagement-by-diagnosis/csv
router.get('/engagement-by-diagnosis/csv', async (req, res) => {
  // Reuse logic above
  const clients = await db.Client.findAll({
    include: [
      { model: db.Appointment, as: 'appointments' },
      { model: db.SessionNote, as: 'sessionNotes' }
    ]
  });
  const diagnosisMap = {};
  for (const client of clients) {
    const diagnosis = client.diagnosis || 'Unknown';
    if (!diagnosisMap[diagnosis]) diagnosisMap[diagnosis] = [];
    const engagement = calcEngagement({
      appointments: client.appointments || [],
      sessionNotes: client.sessionNotes || []
    });
    diagnosisMap[diagnosis].push({
      id: client.id,
      name: client.name,
      engagement,
      appointments: (client.appointments || []).filter(a => a.status === 'completed').length,
      notes: (client.sessionNotes || []).length,
      checkins: (client.sessionNotes || []).filter(n => n.mood !== null && n.mood !== undefined).length
    });
  }
  const rows = [];
  Object.entries(diagnosisMap).forEach(([diagnosis, clients]) => {
    clients.forEach(c => {
      rows.push({
        diagnosis,
        client: c.name,
        engagement: c.engagement,
        appointments: c.appointments,
        notes: c.notes,
        checkins: c.checkins
      });
    });
  });
  const parser = new Parser();
  const csv = parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment('engagement_by_diagnosis.csv');
  res.send(csv);
});

module.exports = router; 