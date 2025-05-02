// server/routes/sessionNotes.js
const express = require('express');
const router = express.Router();
const { SessionNote, Client, Alert } = require('../models');
const auditLog = require('../utils/auditLogger');
const { analyzeNote } = require('../services/noteNlpAgent');
const { requireAuth } = require('./practitioners');

// GET all session notes
router.get('/', requireAuth, async (req, res) => {
  try {
    const notes = await SessionNote.findAll({
      include: [{ model: Client, as: 'client' }]
    });
    await auditLog({ req, action: 'VIEW_SESSION_NOTE_LIST', entity: 'SessionNote', entityId: null, details: { count: notes.length } });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching session notes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET session notes for a specific client
router.get('/client/:clientId', requireAuth, async (req, res) => {
  try {
    const notes = await SessionNote.findAll({
      where: { clientId: req.params.clientId },
      order: [['date', 'DESC']],
      include: [{ model: Client, as: 'client' }]
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching client session notes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single session note
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    await auditLog({ req, action: 'VIEW_SESSION_NOTE', entity: 'SessionNote', entityId: note.id, details: {} });
    res.json(note);
  } catch (error) {
    console.error('Error fetching session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE new session note
router.post('/', requireAuth, async (req, res) => {
  const { clientId, mood, content, date } = req.body;
  
  if (!clientId) {
    return res.status(400).json({ message: 'Client ID is required' });
  }
  
  try {
    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const newNote = await SessionNote.create({
      clientId,
      mood: mood || null,
      content: content || '',
      date: date || new Date()
    });
    
    // Check low mood threshold (<=3) configurable via env LOW_MOOD_THRESHOLD
    const threshold = parseInt(process.env.LOW_MOOD_THRESHOLD || '3', 10);
    if (mood !== null && mood <= threshold) {
      // create alert if none unacknowledged for this client of type lowMood
      const existing = await Alert.findOne({ where: { clientId, type: 'lowMood', acknowledged: false } });
      if (!existing) {
        const alertRecord = await Alert.create({
          clientId,
          type: 'lowMood',
          message: `Low mood rating (${mood}/10) recorded`,
          severity: 'critical',
          sessionNoteId: newNote.id
        });
        // emit socket event
        const io = req.app?.get('io');
        if (io) io.emit('alert-new', alertRecord);
      }
    }
    
    await auditLog({ req, action: 'CREATE_SESSION_NOTE', entity: 'SessionNote', entityId: newNote.id, details: req.body });
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE session note
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    
    await note.update(req.body);
    await auditLog({ req, action: 'UPDATE_SESSION_NOTE', entity: 'SessionNote', entityId: note.id, details: req.body });
    res.json(note);
  } catch (error) {
    console.error('Error updating session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE session note
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    
    await note.destroy();
    await auditLog({ req, action: 'DELETE_SESSION_NOTE', entity: 'SessionNote', entityId: note.id, details: {} });
    res.json({ message: 'Session note deleted' });
  } catch (error) {
    console.error('Error deleting session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// NLP analysis for a session note
router.post('/:id/nlp', requireAuth, async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    const nlpResult = await analyzeNote(note.content);
    res.json(nlpResult);
  } catch (error) {
    console.error('Error analyzing session note NLP:', error);
    res.status(500).json({ message: 'Error analyzing session note', error: error.message });
  }
});

module.exports = router; 