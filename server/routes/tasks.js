const express = require('express');
const router = express.Router();
const { EscalationTask, Client, Alert, AlertAuditLog } = require('../models');

// GET /api/tasks?status=open
router.get('/', async (req, res) => {
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

// PUT /api/tasks/:id - update status/comments
router.put('/:id', async (req, res) => {
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

module.exports = router; 