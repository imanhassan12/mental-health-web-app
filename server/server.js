// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const expressApp = express();
const server = http.createServer(expressApp);
const io = socketIo(server, { cors: { origin: '*' } });
expressApp.set('io', io);

const port = process.env.PORT || 4000;

expressApp.use(cors());
expressApp.use(express.json());

// Brute-force protection: track failed login attempts in memory
const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

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

// Helper to fetch a secret from AWS Secrets Manager
async function getSecret(secretArn) {
  if (!secretArn) return undefined;
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);
  return response.SecretString;
}

// Cache for secrets
const secretsCache = {};

async function loadSecretsFromAWS() {
  const secretEnvMap = {
    JWT_SECRET: process.env.JWT_SECRET_ARN,
    DB_PASSWORD: process.env.DB_PASSWORD_SECRET_ARN,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID_ARN,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN_ARN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER_ARN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY_ARN,
  };
  for (const [key, arn] of Object.entries(secretEnvMap)) {
    if (arn) {
      try {
        secretsCache[key] = await getSecret(arn);
      } catch (err) {
        console.error(`Failed to fetch secret for ${key}:`, err);
        secretsCache[key] = undefined;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// SYNC DATABASE AND START SERVER
// ---------------------------------------------------------------------------
(async () => {
  await loadSecretsFromAWS();
  // Now override process.env with secrets for compatibility
  for (const [key, value] of Object.entries(secretsCache)) {
    if (value !== undefined) process.env[key] = value;
  }

  // Sequelize models
  const db = require('./models');
  const { Practitioner, Client, Appointment, SessionNote, Goal } = db;

  const auditLog = require('./utils/auditLogger');
  
  const clientsRoute = require('./routes/clients');
  const sessionNotesRoute = require('./routes/sessionNotes');
  const goalsRoute = require('./routes/goals');
  const alertsRoute = require('./routes/alerts');
  const tasksRoute = require('./routes/tasks');
  const remindersRoute = require('./routes/reminders');
  const analyticsRoute = require('./routes/analytics');
  const messagesRoute = require('./routes/messages');
  const practitionersRoute = require('./routes/practitioners');
  const translationRoute = require('./routes/translation');
  const videoRoute = require('./routes/video');

  const auth = require('./middleware/auth');

  // ---------------------------------------------------------------------------
  // USER REGISTRATION (POST /api/register)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    expressApp.post('/api/register', async (req, res) => {
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
        
        await auditLog({ req, action: 'REGISTER', entity: 'Practitioner', entityId: newUser.id, details: { username, email } });
        
        // Generate JWT token
        const token = jwt.sign(
          { id: newUser.id, username: newUser.username },
          secretsCache.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        return res.status(201).json({
          message: 'Account created successfully.',
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          },
        });
      } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // USER LOGIN (POST /api/login)
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    expressApp.post('/api/login', async (req, res) => {
      const { username, password } = req.body;
      const now = Date.now();
      // Initialize or clean up old attempts
      if (!loginAttempts[username]) {
        loginAttempts[username] = { attempts: [], lockedUntil: null };
      } else {
        // Remove attempts older than WINDOW_MINUTES
        loginAttempts[username].attempts = loginAttempts[username].attempts.filter(ts => now - ts < WINDOW_MINUTES * 60 * 1000);
      }
      // Check lockout
      if (loginAttempts[username].lockedUntil && now < loginAttempts[username].lockedUntil) {
        const minutesLeft = Math.ceil((loginAttempts[username].lockedUntil - now) / 60000);
        return res.status(429).json({ message: `Account locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).` });
      }
      try {
        // Find user by username
        const user = await Practitioner.findOne({ where: { username } });
        if (!user) {
          loginAttempts[username].attempts.push(now);
          if (loginAttempts[username].attempts.length >= MAX_ATTEMPTS) {
            loginAttempts[username].lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000;
          }
          await auditLog({ req, action: 'LOGIN_FAILED', entity: 'Practitioner', entityId: null, details: { username, reason: 'User not found' } });
          return res.status(401).json({ message: 'Incorrect username or password.' });
        }
        
        console.log(`Login attempt for user: ${username}`);
        console.log(`Password hash format detected: ${user.password.substring(0, 20)}...`);
        
        // Use our password verification function
        const isMatch = await verifyPassword(password, user.password);
        console.log(`Password verification result: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        
        if (!isMatch) {
          loginAttempts[username].attempts.push(now);
          if (loginAttempts[username].attempts.length >= MAX_ATTEMPTS) {
            loginAttempts[username].lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000;
          }
          await auditLog({ req, action: 'LOGIN_FAILED', entity: 'Practitioner', entityId: user.id, details: { username, reason: 'Invalid password' } });
          return res.status(401).json({ message: 'Incorrect username or password.' });
        }
        
        // On success, reset attempts
        loginAttempts[username] = { attempts: [], lockedUntil: null };
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          secretsCache.JWT_SECRET,
          { expiresIn: '1h' }
        );
        
        await auditLog({ req, action: 'LOGIN_SUCCESS', entity: 'Practitioner', entityId: user.id, details: { username } });
        
        return res.status(200).json({
          message: 'Logged in successfully.',
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role
          },
        });
      } catch (error) {
        console.error('Error during login:', error);
        await auditLog({ req, action: 'LOGIN_ERROR', entity: 'Practitioner', entityId: null, details: { username, error: error.message } });
        return res.status(500).json({ message: 'Internal server error.' });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // BASIC CHECK-IN EXAMPLE (POST /api/checkin)
  // ---------------------------------------------------------------------------
  expressApp.post('/api/checkin', async (req, res) => {
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
  // Clients Route
  // ---------------------------------------------------------------------------
  expressApp.use('/api/clients', auth, clientsRoute);
  expressApp.use('/api/session-notes', auth, sessionNotesRoute);
  expressApp.use('/api/goals', auth, goalsRoute);
  expressApp.use('/api/alerts', auth, alertsRoute);
  expressApp.use('/api/tasks', auth, tasksRoute);
  expressApp.use('/api/reminders', auth, remindersRoute);
  expressApp.use('/api/analytics', auth, analyticsRoute);
  expressApp.use('/api/messages', auth, messagesRoute);
  expressApp.use('/api/appointments', auth, require('./routes/appointments'));
  expressApp.use('/api/practitioners', auth, practitionersRoute);
  expressApp.use('/api/translate', auth, translationRoute);
  expressApp.use('/api/video', auth, videoRoute);

  // ---------------------------------------------------------------------------
  // DASHBOARD STATS
  // ---------------------------------------------------------------------------
  expressApp.get('/api/dashboard-stats', async (req, res) => {
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
      
      // Get recent activity (latest 5 appointments)
      const recentAppointments = await Appointment.findAll({
        limit: 5,
        order: [['startTime', 'DESC']],
        include: [{ model: Client, as: 'client' }]
      });
      
      // Calculate risk alerts
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentLowMoodNotes = await SessionNote.findAll({
        where: {
          date: {
            [db.Sequelize.Op.gte]: sevenDaysAgo
          },
          mood: {
            [db.Sequelize.Op.lte]: 3
          }
        },
        include: [{ model: Client, as: 'client' }],
        order: [['date', 'DESC']]
      });

      // Ensure DB alerts exist and collect unacknowledged alerts
      const dbAlerts = [];
      for (const note of recentLowMoodNotes) {
        if (!note.client) continue;
        const existing = await db.Alert.findOne({ where: { clientId: note.client.id, type: 'lowMood', acknowledged: false } });
        if (!existing) {
          const created = await db.Alert.create({
            clientId: note.client.id,
            type: 'lowMood',
            message: `Low mood rating (${note.mood}/10) recorded on ${new Date(note.date).toLocaleDateString()}`,
            severity: 'critical',
            sessionNoteId: note.id
          });
          dbAlerts.push(created);
        } else {
          dbAlerts.push(existing);
        }
      }

      const alerts = await Promise.all(dbAlerts.map(async (a) => {
        const cl = await Client.findByPk(a.clientId);
        return {
          id: a.id,
          clientId: a.clientId,
          clientName: cl ? cl.name : 'Unknown',
          type: a.type,
          message: a.message,
          severity: a.severity,
          acknowledged: a.acknowledged
        };
      }));
      
      // after inserting new alert record
      if (io) io.emit('alert-new', alerts[alerts.length - 1]);
      
      return res.json({
        activeClients: clientCount,
        avgMood,
        upcomingAppointments,
        sessionNotesCount,
        recentAppointments,
        todaysAppointments: formattedTodaysAppointments,
        alerts
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  });

  // ---------------------------------------------------------------------------
  // DASHBOARD CLIENTS
  // ---------------------------------------------------------------------------
  expressApp.get('/api/dashboard-clients', async (req, res) => {
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
  expressApp.get('/api/dashboard-notes', async (req, res) => {
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
  expressApp.get('/', (req, res) => {
    res.json({ message: 'Backend is running successfully!' });
  });


  io.on('connection', (socket) => {
    console.log('Socket.io: client connected', socket.id);
    // Join user room
    socket.on('join', ({ userId }) => {
      if (userId) {
        socket.join(userId);
        console.log(`[Socket.io] User ${userId} joined their room (socket ${socket.id})`);
      }
    });
    // Relay typing event to all other participants
    socket.on('typing', ({ threadId, userId, name }) => {
      if (!threadId || !userId) return;
      db.ThreadParticipant.findAll({ where: { threadId } }).then(participants => {
        participants.forEach(tp => {
          if (tp.practitionerId !== userId) {
            console.log(`[SOCKET] Emitting 'typing' to practitionerId:`, tp.practitionerId, 'for threadId:', threadId, 'from userId:', userId, 'name:', name);
            io.to(tp.practitionerId).emit('typing', { threadId, userId, name });
          }
        });
      });
    });
  });

  db.sequelize.sync()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });
})();