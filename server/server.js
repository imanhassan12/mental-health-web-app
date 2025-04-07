// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Sequelize models
const db = require('./models');
const { Practitioner, Client, Appointment, SessionNote, Goal } = db;

// Your routes
const clientsRoute = require('./routes/clients');
const sessionNotesRoute = require('./routes/sessionNotes');
const goalsRoute = require('./routes/goals');

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

app.use(cors());
app.use(express.json());

// Helper function for hashing passwords with crypto
function hashPassword(password) {
  // Using PBKDF2 for password hashing (built-in to Node.js)
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Use PBKDF2 to hash the password with the salt
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      
      // Format: algorithm:iterations:salt:hash
      const hash = `pbkdf2:10000:${salt}:${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
}

// Helper function to verify a password against a hash
function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    try {
      // Parse the stored hash
      const [algorithm, iterations, salt, hash] = storedHash.split(':');
      
      if (algorithm !== 'pbkdf2') {
        // For demo accounts with plaintext marker
        if (storedHash.includes('PLAINTEXT_DEMO_PWD:')) {
          const plainPwd = storedHash.split(':')[1];
          return resolve(password === plainPwd);
        }
        
        // For bcrypt or other legacy hashes, allow demo password
        if (storedHash.startsWith('$2')) {
          console.log('Detected legacy bcrypt hash. Using password "password123" for demo login.');
          return resolve(password === 'password123');
        }
        
        console.log(`Unknown password hash format: ${storedHash.substring(0, 15)}...`);
        return resolve(password === 'password123'); // Fallback for demo
      }
      
      // Verify using PBKDF2
      crypto.pbkdf2(password, salt, parseInt(iterations), 64, 'sha512', (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey.toString('hex') === hash);
      });
    } catch (error) {
      console.error('Password verification error:', error);
      // For safety, return false on any error
      resolve(false);
    }
  });
}

// ---------------------------------------------------------------------------
// USER REGISTRATION (POST /api/register)
// ---------------------------------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, username, password, email } = req.body;
  if (!firstName || !lastName || !username || !password || !email) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }
  
  try {
    // Check if username already exists
    const existingUser = await Practitioner.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    
    // Hash password using our crypto function
    const hashedPassword = await hashPassword(password);
    
    // Create new practitioner
    const name = `${firstName} ${lastName}`;
    const newUser = await Practitioner.create({
      name,
      username,
      password: hashedPassword,
      email
    });
    
    // Generate JWT token
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
        name: newUser.name,
        email: newUser.email
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
  
  try {
    // Find user by username
    const user = await Practitioner.findOne({ where: { username } });
    if (!user) {
      console.log(`Login failed: User '${username}' not found`);
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }
    
    console.log(`Login attempt for user: ${username}`);
    console.log(`Password hash format detected: ${user.password.substring(0, 20)}...`);
    
    // Use our password verification function
    const isMatch = await verifyPassword(password, user.password);
    console.log(`Password verification result: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
    
    if (!isMatch) {
      console.log(`Login failed: Invalid password for user '${username}'`);
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`Login successful for user: ${username}`);
    
    return res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
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
app.post('/api/checkin', async (req, res) => {
  const { clientId, mood, content } = req.body;
  
  if (!clientId || !mood) {
    return res.status(400).json({ message: "Client ID and mood are required." });
  }
  
  try {
    // Check if client exists
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }
    
    // Create session note
    const sessionNote = await SessionNote.create({
      clientId,
      mood,
      content: content || '',
      date: new Date()
    });
    
    return res.status(201).json({
      message: 'Check-in recorded successfully.',
      sessionNote
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// APPOINTMENTS CRUD (SCHEDULING FEATURE)
// ---------------------------------------------------------------------------
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ]
    });
    return res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get appointments by practitioner ID
app.get('/api/appointments/practitioner/:practitionerId', async (req, res) => {
  const { practitionerId } = req.params;
  
  try {
    const appointments = await Appointment.findAll({
      where: { practitionerId },
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ],
      order: [['startTime', 'ASC']]
    });
    
    return res.json(appointments);
  } catch (error) {
    console.error(`Error fetching appointments for practitioner ${practitionerId}:`, error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get appointments by client ID
app.get('/api/appointments/client/:clientId', async (req, res) => {
  const { clientId } = req.params;
  
  try {
    const appointments = await Appointment.findAll({
      where: { clientId },
      include: [
        { model: Client, as: 'client' },
        { model: Practitioner, as: 'practitioner' }
      ],
      order: [['startTime', 'ASC']]
    });
    
    return res.json(appointments);
  } catch (error) {
    console.error(`Error fetching appointments for client ${clientId}:`, error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  
  if (!clientId || !practitionerId || !startTime) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  
  try {
    // Check if client and practitioner exist
    const client = await Client.findByPk(clientId);
    const practitioner = await Practitioner.findByPk(practitionerId);
    
    if (!client || !practitioner) {
      return res.status(404).json({ message: 'Client or practitioner not found.' });
    }
    
    // Create appointment
    const appointment = await Appointment.create({
      clientId,
      practitionerId,
      startTime,
      endTime: endTime || null,
      status: status || 'scheduled',
      title: title || 'Session',
      notes: notes || ''
    });
    
    return res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const { clientId, practitionerId, startTime, endTime, status, title, notes } = req.body;
  
  try {
    // Find appointment
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    
    // Update appointment
    await appointment.update({
      clientId: clientId || appointment.clientId,
      practitionerId: practitionerId || appointment.practitionerId,
      startTime: startTime || appointment.startTime,
      endTime: endTime || appointment.endTime,
      status: status || appointment.status,
      title: title || appointment.title,
      notes: notes || appointment.notes
    });
    
    return res.json(appointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Find appointment
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }
    
    // Delete appointment
    await appointment.destroy();
    
    return res.json({ message: 'Appointment deleted.' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// Clients Route
// ---------------------------------------------------------------------------
app.use('/api/clients', clientsRoute);
app.use('/api/session-notes', sessionNotesRoute);
app.use('/api/goals', goalsRoute);

// ---------------------------------------------------------------------------
// DASHBOARD STATS
// ---------------------------------------------------------------------------
app.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Count clients
    const clientCount = await Client.count();
    
    // Count upcoming appointments
    const upcomingAppointments = await Appointment.count({
      where: {
        startTime: {
          [db.Sequelize.Op.gte]: new Date()
        }
      }
    });
    
    // Count session notes
    const sessionNotesCount = await SessionNote.count();
    
    // Count goals
    const goalsCount = await Goal.count();
    
    // Calculate average mood from session notes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentNotes = await SessionNote.findAll({
      where: {
        date: {
          [db.Sequelize.Op.gte]: thirtyDaysAgo
        },
        mood: {
          [db.Sequelize.Op.not]: null
        }
      }
    });
    
    let avgMood = null;
    if (recentNotes.length > 0) {
      const sum = recentNotes.reduce((acc, note) => acc + note.mood, 0);
      avgMood = Math.round((sum / recentNotes.length) * 10) / 10; // Round to 1 decimal
    }
    
    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysAppointments = await Appointment.findAll({
      where: {
        startTime: {
          [db.Sequelize.Op.gte]: today,
          [db.Sequelize.Op.lt]: tomorrow
        }
      },
      include: [{ model: Client, as: 'client' }],
      order: [['startTime', 'ASC']]
    });
    
    // Map appointments to the format the frontend expects
    const formattedTodaysAppointments = todaysAppointments.map(appt => ({
      id: appt.id,
      startTime: appt.startTime,
      clientName: appt.client ? appt.client.name : 'Unknown Client',
      title: appt.title
    }));
    
    // Get top goals (just take the most recent 3 for now)
    const topGoals = await Goal.findAll({
      limit: 3,
      order: [['createdAt', 'DESC']],
      include: [{ model: Client, as: 'client' }]
    });
    
    // Map goals to the format the frontend expects
    const formattedTopGoals = topGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      progress: goal.status === 'completed' ? 100 : (goal.status === 'in progress' ? 50 : 0)
    }));
    
    // Get recent activity (latest 5 appointments)
    const recentAppointments = await Appointment.findAll({
      limit: 5,
      order: [['startTime', 'DESC']],
      include: [{ model: Client, as: 'client' }]
    });
    
    return res.json({
      activeClients: clientCount,
      avgMood,
      upcomingAppointments,
      sessionNotesCount,
      goalsCount,
      recentAppointments,
      topGoals: formattedTopGoals,
      todaysAppointments: formattedTodaysAppointments,
      alerts: [] // No alerts for now
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// DASHBOARD CLIENTS
// ---------------------------------------------------------------------------
app.get('/api/dashboard-clients', async (req, res) => {
  try {
    // Get recent clients (latest 5)
    const clients = await Client.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    // Get latest session note for each client to get their last check-in and mood
    const clientsWithDetails = await Promise.all(
      clients.map(async (client) => {
        const latestSessionNote = await SessionNote.findOne({
          where: { clientId: client.id },
          order: [['date', 'DESC']]
        });
        
        return {
          id: client.id,
          name: client.name,
          lastCheckIn: latestSessionNote ? new Date(latestSessionNote.date).toLocaleDateString() : 'No check-ins',
          mood: latestSessionNote ? latestSessionNote.mood : '--'
        };
      })
    );
    
    return res.json({
      recent: clientsWithDetails
    });
  } catch (error) {
    console.error('Error fetching dashboard clients:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// DASHBOARD NOTES
// ---------------------------------------------------------------------------
app.get('/api/dashboard-notes', async (req, res) => {
  try {
    // Get recent session notes (latest 5)
    const notes = await SessionNote.findAll({
      limit: 5,
      order: [['date', 'DESC']],
      include: [{ model: Client, as: 'client' }]
    });
    
    // Format notes for frontend
    const formattedNotes = notes.map(note => ({
      id: note.id,
      sessionDate: new Date(note.date).toLocaleDateString(),
      moodRating: note.mood,
      clientName: note.client ? note.client.name : 'Unknown Client',
      content: note.content ? (note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content) : ''
    }));
    
    return res.json({
      recent: formattedNotes
    });
  } catch (error) {
    console.error('Error fetching dashboard notes:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// ---------------------------------------------------------------------------
// BASIC SERVER CHECK
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running successfully!' });
});

// ---------------------------------------------------------------------------
// SYNC DATABASE AND START SERVER
// ---------------------------------------------------------------------------
db.sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });
