// server/routes/sessionNotes.js
const express = require('express');
const router = express.Router();
const { SessionNote, Client } = require('../models');

// GET all session notes
router.get('/', async (req, res) => {
  try {
    const notes = await SessionNote.findAll({
      include: [{ model: Client, as: 'client' }]
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching session notes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET session notes for a specific client
router.get('/client/:clientId', async (req, res) => {
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
router.get('/:id', async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    res.json(note);
  } catch (error) {
    console.error('Error fetching session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE new session note
router.post('/', async (req, res) => {
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
    
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE session note
router.put('/:id', async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    
    await note.update(req.body);
    res.json(note);
  } catch (error) {
    console.error('Error updating session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE session note
router.delete('/:id', async (req, res) => {
  try {
    const note = await SessionNote.findByPk(req.params.id);
    if (!note) return res.status(404).json({ message: 'Session note not found' });
    
    await note.destroy();
    res.json({ message: 'Session note deleted' });
  } catch (error) {
    console.error('Error deleting session note:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 