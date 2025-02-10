// server/routes/clients.js
const express = require('express');
const router = express.Router();

let clients = [
  // Example data
  { id: '1', name: 'Alice', phone: '555-1234', notes: 'High anxiety, weekly sessions' },
  { id: '2', name: 'Bob', phone: '555-5678', notes: 'Moderate depression, check-ins every 2 weeks' },
];

// GET all clients
router.get('/', (req, res) => {
  res.json(clients);
});

// GET single client
router.get('/:id', (req, res) => {
  const client = clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  res.json(client);
});

// CREATE new client
router.post('/', (req, res) => {
  const { name, phone, notes } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  const newClient = {
    id: String(Date.now()), // simple unique ID
    name,
    phone: phone || '',
    notes: notes || '',
  };
  clients.push(newClient);
  res.status(201).json(newClient);
});

// UPDATE client
router.put('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Client not found' });

  const existingClient = clients[index];
  const updatedClient = { ...existingClient, ...req.body };
  clients[index] = updatedClient;
  res.json(updatedClient);
});

// DELETE client
router.delete('/:id', (req, res) => {
  const index = clients.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Client not found' });
  clients.splice(index, 1);
  res.json({ message: 'Client deleted' });
});

module.exports = router;
