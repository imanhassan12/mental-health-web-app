const express = require('express');
const router = express.Router();
const { EscalationTask, Client, Alert, AlertAuditLog } = require('../models');
const auditLog = require('../utils/auditLogger');
const { requireAuth } = require('./practitioners');

// GET /api/tasks?status=open
router.get('/', requireAuth, async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  try {
    const tasks = await EscalationTask.findAll({ where, include: [{ model: Client, as: 'client' }, { model: Alert, as: 'alert' }], order: [['createdAt', 'DESC']] });
    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await EscalationTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

// PUT /api/tasks/:id - update status/comments
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const task = await EscalationTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.update(req.body);
    const io = req.app.get('io');
    if (io) io.emit('task-updated', task);
    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

// POST /api/tasks - create a new task
router.post('/', requireAuth, async (req, res) => {
  try {
    const task = await EscalationTask.create(req.body);
    const io = req.app.get('io');
    if (io) io.emit('task-created', task);
    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const task = await EscalationTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await task.destroy();
    const io = req.app.get('io');
    if (io) io.emit('task-deleted', task);
    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Internal error' });
  }
});

module.exports = router; 