const express = require('express');
const router = express.Router();
const db = require('../models');
const { encrypt, decrypt } = require('../utils/messageCrypto');
const jwt = require('jsonwebtoken');
const { Parser } = require('json2csv');
const auditLog = require('../utils/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

// Helper: Extract user from JWT
function getUserFromReq(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const token = auth.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// POST /api/messages/thread - Create a thread
router.post('/thread', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  let { participantIds, clientId } = req.body;
  try {
    // Ensure the creator is a participant
    if (!participantIds || !Array.isArray(participantIds)) participantIds = [];
    if (!participantIds.includes(user.id)) participantIds.push(user.id);
    // Create thread
    const thread = await db.Thread.create({ clientId: clientId || null });
    // Create ThreadParticipant entries
    await Promise.all(participantIds.map(pid => db.ThreadParticipant.create({ threadId: thread.id, practitionerId: pid })));
    await auditLog({ req, action: 'CREATE_THREAD', entity: 'Thread', entityId: thread.id, details: { participantIds, clientId } });
    return res.status(201).json(thread);
  } catch (err) {
    return res.status(500).json({ message: 'Error creating thread', error: err.message });
  }
});

// POST /api/messages - Send a message (encrypt content)
router.post('/', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { threadId, clientId, content } = req.body;
  if (!threadId || !content) return res.status(400).json({ message: 'threadId and content required' });
  try {
    const encrypted = encrypt(content);
    const message = await db.Message.create({
      senderId: user.id,
      threadId,
      clientId: clientId || null,
      content: encrypted,
      timestamp: new Date()
    });
    // Update thread lastMessageAt
    await db.Thread.update({ lastMessageAt: new Date() }, { where: { id: threadId } });
    // Emit socket event to all participants
    const io = req.app.get('io');
    const participants = await db.ThreadParticipant.findAll({ where: { threadId } });
    participants.forEach(tp => {
      console.log(`[SOCKET] Emitting 'message:new' to practitionerId:`, tp.practitionerId, 'for threadId:', threadId, 'message:', { ...message.toJSON(), content });
      io.to(tp.practitionerId).emit('message:new', { threadId, message: { ...message.toJSON(), content } });
    });
    await auditLog({ req, action: 'SEND_MESSAGE', entity: 'Message', entityId: message.id, details: { threadId, clientId, content } });
    return res.status(201).json({ ...message.toJSON(), content }); // Return plaintext for sender
  } catch (err) {
    return res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

// GET /api/messages/threads - List threads for user (only participant)
router.get('/threads', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    // Find thread IDs where user is a participant
    const participantThreads = await db.ThreadParticipant.findAll({ where: { practitionerId: user.id } });
    const threadIds = participantThreads.map(tp => tp.threadId);
    const threads = await db.Thread.findAll({
      where: { id: threadIds },
      order: [['lastMessageAt', 'DESC']],
      include: [
        { model: db.Client, as: 'client' },
        { model: db.Message, as: 'messages', limit: 1, order: [['timestamp', 'DESC']] },
        {
          model: db.ThreadParticipant,
          as: 'participants',
          include: [{ model: db.Practitioner, as: 'practitioner', attributes: ['id', 'name', 'email'] }]
        }
      ]
    });
    await auditLog({ req, action: 'VIEW_THREAD_LIST', entity: 'Thread', entityId: null, details: { count: threads.length } });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: 'Error listing threads', error: err.message });
  }
});

// GET /api/messages/thread/:id - List messages in a thread (only if participant)
router.get('/thread/:id', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  try {
    // Check if user is a participant
    const isParticipant = await db.ThreadParticipant.findOne({ where: { threadId: id, practitionerId: user.id } });
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    const messages = await db.Message.findAll({
      where: { threadId: id },
      order: [['timestamp', 'ASC']],
      include: [
        { model: db.Practitioner, as: 'sender', attributes: ['id', 'name', 'email'] }
      ]
    });
    // Decrypt content
    const result = messages.map(msg => ({
      ...msg.toJSON(),
      content: decrypt(msg.content)
    }));
    // Log access for audit
    await Promise.all(messages.map(msg => db.MessageAccessLog.create({
      messageId: msg.id,
      userId: user.id,
      accessedAt: new Date()
    })));
    await auditLog({ req, action: 'VIEW_THREAD', entity: 'Thread', entityId: id, details: {} });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error listing messages', error: err.message });
  }
});

// GET /api/messages/audit-log - Export access logs (admin only, MVP: allow all)
router.get('/audit-log', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const logs = await db.MessageAccessLog.findAll({
      include: [
        { model: db.Message, as: 'message', attributes: ['id', 'threadId', 'senderId'] },
        { model: db.Practitioner, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting audit log', error: err.message });
  }
});

// CSV export for audit log
router.get('/audit-log/csv', async (req, res) => {
  // TODO: Add admin check here
  try {
    const logs = await db.MessageAccessLog.findAll({
      include: [
        { model: db.Message, as: 'message', attributes: ['id', 'threadId', 'senderId'] },
        { model: db.Practitioner, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    const data = logs.map(l => ({
      messageId: l.message.id,
      threadId: l.message.threadId,
      senderId: l.message.senderId,
      userId: l.user.id,
      userName: l.user.name,
      userEmail: l.user.email,
      accessedAt: l.accessedAt
    }));
    const parser = new Parser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-log.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Error exporting audit log as CSV', error: err.message });
  }
});

// GET /api/messages/practitioners - List all practitioners for participant selection
router.get('/practitioners', async (req, res) => {
  try {
    const practitioners = await db.Practitioner.findAll({ attributes: ['id', 'name', 'email'] });
    res.json(practitioners);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching practitioners', error: err.message });
  }
});

// POST /api/messages/thread/:id/participants - Add participants to a thread
router.post('/thread/:id/participants', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  const { participantIds } = req.body;
  try {
    // Only allow if user is a participant
    const isParticipant = await db.ThreadParticipant.findOne({ where: { threadId: id, practitionerId: user.id } });
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    // Add new participants (ignore existing)
    const existing = await db.ThreadParticipant.findAll({ where: { threadId: id } });
    const existingIds = existing.map(tp => tp.practitionerId);
    const toAdd = (participantIds || []).filter(pid => !existingIds.includes(pid));
    await Promise.all(toAdd.map(pid => db.ThreadParticipant.create({ threadId: id, practitionerId: pid })));
    // Emit participant update
    const io = req.app.get('io');
    const allParticipants = await db.ThreadParticipant.findAll({ where: { threadId: id } });
    allParticipants.forEach(tp => {
      io.to(tp.practitionerId).emit('thread:participants', { threadId: id, participantIds: allParticipants.map(p => p.practitionerId) });
    });
    await auditLog({ req, action: 'UPDATE_THREAD', entity: 'Thread', entityId: id, details: { participantIds: toAdd } });
    res.json({ added: toAdd });
  } catch (err) {
    res.status(500).json({ message: 'Error adding participants', error: err.message });
  }
});

// DELETE /api/messages/thread/:id/participants/:practitionerId - Remove a participant
router.delete('/thread/:id/participants/:practitionerId', async (req, res) => {
  const user = getUserFromReq(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { id, practitionerId } = req.params;
  try {
    // Only allow if user is a participant
    const isParticipant = await db.ThreadParticipant.findOne({ where: { threadId: id, practitionerId: user.id } });
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    // Don't allow removing the last participant
    const count = await db.ThreadParticipant.count({ where: { threadId: id } });
    if (count <= 1) return res.status(400).json({ message: 'Cannot remove the last participant' });
    await db.ThreadParticipant.destroy({ where: { threadId: id, practitionerId } });
    // Emit participant update
    const io = req.app.get('io');
    const allParticipants = await db.ThreadParticipant.findAll({ where: { threadId: id } });
    allParticipants.forEach(tp => {
      io.to(tp.practitionerId).emit('thread:participants', { threadId: id, participantIds: allParticipants.map(p => p.practitionerId) });
    });
    await auditLog({ req, action: 'DELETE_THREAD', entity: 'Thread', entityId: id, details: { practitionerId } });
    res.json({ removed: practitionerId });
  } catch (err) {
    res.status(500).json({ message: 'Error removing participant', error: err.message });
  }
});

// POST /api/messages/:messageId/read - Mark a message as read by the current user
router.post('/:messageId/read', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { messageId } = req.params;
  try {
    // Find the message and thread
    const message = await db.Message.findByPk(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    // Check if user is a participant in the thread
    const isParticipant = await db.ThreadParticipant.findOne({ where: { threadId: message.threadId, practitionerId: user.id } });
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    // Upsert MessageRead
    const [read, created] = await db.MessageRead.findOrCreate({
      where: { messageId, userId: user.id },
      defaults: { readAt: new Date() }
    });
    if (!created) {
      // If already exists, update readAt
      await read.update({ readAt: new Date() });
    }
    // Emit socket.io event to all participants for real-time read receipts
    const practitioner = await db.Practitioner.findByPk(user.id, { attributes: ['id', 'name', 'email'] });
    const io = req.app.get('io');
    const participants = await db.ThreadParticipant.findAll({ where: { threadId: message.threadId } });
    const readAt = new Date();
    participants.forEach(tp => {
      io.to(tp.practitionerId).emit('message:read', {
        threadId: message.threadId,
        messageId,
        user: practitioner,
        readAt
      });
    });
    await auditLog({ req, action: 'READ_MESSAGE', entity: 'Message', entityId: message.id, details: { readAt } });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Error in /api/messages/:messageId/read:', err); // Log the full error
    res.status(500).json({ message: 'Error marking as read', error: err.message });
  }
});

// GET /api/messages/:messageId/readers - Get all users who have read a message
router.get('/:messageId/readers', async (req, res) => {
  const user = getUserFromReq(req);
  req.user = user;
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  const { messageId } = req.params;
  try {
    // Find the message and thread
    const message = await db.Message.findByPk(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    // Check if user is a participant in the thread
    const isParticipant = await db.ThreadParticipant.findOne({ where: { threadId: message.threadId, practitionerId: user.id } });
    if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });
    // Get all MessageRead entries for this message
    const reads = await db.MessageRead.findAll({
      where: { messageId },
      include: [{ model: db.Practitioner, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['readAt', 'ASC']]
    });
    res.json(reads.map(r => ({ user: r.user, readAt: r.readAt })));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching readers', error: err.message });
  }
});

module.exports = router; 