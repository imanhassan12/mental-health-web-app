// server/routes/goals.js
const express = require('express');
const router = express.Router();
const { Goal, Client } = require('../models');

// GET all goals
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findAll({
      include: [{ model: Client, as: 'client' }]
    });
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET goals for a specific client
router.get('/client/:clientId', async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { clientId: req.params.clientId },
      include: [{ model: Client, as: 'client' }]
    });
    res.json(goals);
  } catch (error) {
    console.error('Error fetching client goals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET single goal
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// CREATE new goal
router.post('/', async (req, res) => {
  const { clientId, title, description, status, targetDate } = req.body;
  
  if (!clientId || !title) {
    return res.status(400).json({ message: 'Client ID and title are required' });
  }
  
  try {
    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const newGoal = await Goal.create({
      clientId,
      title,
      description: description || '',
      status: status || 'in progress',
      targetDate: targetDate || null
    });
    
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// UPDATE goal
router.put('/:id', async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    
    await goal.update(req.body);
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    
    await goal.destroy();
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 