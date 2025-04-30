const express = require('express');
const router = express.Router();

const { Alert, Client, EscalationTask, AlertAuditLog } = require('../models');

// GET /api/alerts - list alerts, query param acknowledged=false/true
router.get('/', async (req, res) => {
  try {
    const { acknowledged } = req.query;
    const where = {};
    if (acknowledged === 'true') where.acknowledged = true;
    if (acknowledged === 'false') where.acknowledged = false;

    const alerts = await Alert.findAll({
      where,
      include: [{ model: Client, as: 'client' }],
      order: [['createdAt', 'DESC']]
    });

    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/alerts/:id/acknowledge - mark alert acknowledged
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByPk(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (!alert.acknowledged) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = req.body.userId || null; // can pass practitionerId
      await alert.save();

      // emit socket event for alert update
      const io = req.app.get('io');
      if (io) io.emit('alert-updated', alert);
    }

    return res.json(alert);
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/alerts/:id/history
router.get('/:id/history', async (req,res)=>{
  try{
    const logs = await AlertAuditLog.findAll({ where:{ alertId:req.params.id }, order:[['createdAt','ASC']]});
    return res.json(logs);
  }catch(e){
    return res.status(500).json({ message:'Internal error'});
  }
});

// POST /api/alerts/:id/escalate
router.post('/:id/escalate', async (req,res)=>{
  try{
    const { priority='high', dueDate=null, assigneeId=null, note='' , actorId=null } = req.body;
    const alert = await Alert.findByPk(req.params.id);
    if(!alert) return res.status(404).json({ message:'Alert not found'});

    const task = await EscalationTask.create({
      alertId: alert.id,
      clientId: alert.clientId,
      assigneeId,
      priority,
      dueDate,
      comments: note
    });

    await AlertAuditLog.create({
      alertId: alert.id,
      action: 'escalated',
      actorId,
      note
    });

    const io = req.app.get('io');
    if(io){
      io.emit('task-new', task);
      io.emit('alert-updated', alert);
    }

    return res.status(201).json(task);
  }catch(e){
    console.error('Escalate error',e);
    return res.status(500).json({ message:'Internal error'});
  }
});

module.exports = router; 