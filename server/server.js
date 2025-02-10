// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Your routes
const clientsRoute = require('./routes/clients'); // newly added

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// DUMMY IN-MEMORY "DATABASES"
// In production, replace with an actual DB (PostgreSQL, MongoDB, etc.)
// ---------------------------------------------------------------------------
const users = [];       // For user registration/login
const appointments = []; // For scheduling feature

// ---------------------------------------------------------------------------
// USER REGISTRATION (POST /api/register)
// ---------------------------------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, username, password } = req.body;
  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      firstName,
      lastName,
      username,
      password: hashedPassword,
    };
    users.push(newUser);
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// USER LOGIN (POST /api/login)
// ---------------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Incorrect username or password.' });
  }
  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// BASIC CHECK-IN EXAMPLE (POST /api/checkin)
// ---------------------------------------------------------------------------
app.post('/api/checkin', (req, res) => {
  const { mood, message } = req.body;
  if (!mood) {
    return res.status(400).json({ message: "Mood is required." });
  }
  console.log(`New check-in: Mood - ${mood}, Message - ${message}`);
  return res.status(200).json({ message: "Check-in successful!" });
});

// ---------------------------------------------------------------------------
// APPOINTMENTS CRUD (SCHEDULING FEATURE)
// ---------------------------------------------------------------------------
app.get('/api/appointments', (req, res) => {
  return res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  if (!clientId || !practitionerId || !startTime) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  const newAppointment = {
    id: String(Date.now()),
    clientId,
    practitionerId,
    startTime,
    endTime: endTime || null,
    status: status || 'scheduled',
    title: title || 'Session',
    notes: notes || '',
  };
  appointments.push(newAppointment);
  return res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }
  const existing = appointments[index];
  const updatedAppointment = {
    ...existing,
    clientId: clientId ?? existing.clientId,
    practitionerId: practitionerId ?? existing.practitionerId,
    startTime: startTime ?? existing.startTime,
    endTime: endTime ?? existing.endTime,
    status: status ?? existing.status,
    title: title ?? existing.title,
    notes: notes ?? existing.notes,
  };
  appointments[index] = updatedAppointment;
  return res.json(updatedAppointment);
});

app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }
  appointments.splice(index, 1);
  return res.json({ message: 'Appointment deleted.' });
});

// ---------------------------------------------------------------------------
// Clients Route
// ---------------------------------------------------------------------------
app.use('/api/clients', clientsRoute);

// ---------------------------------------------------------------------------
// BASIC SERVER CHECK
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

// ---------------------------------------------------------------------------
// START SERVER (only once!)
// ---------------------------------------------------------------------------
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
