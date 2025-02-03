// server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// In production, store this key in an environment variable!
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

// Middleware
app.use(cors());
app.use(express.json());

// Dummy in-memory "database"
// In production, replace this with a real database like PostgreSQL or MongoDB.
const users = [];

/**
 * Registration Endpoint
 * Expects: { firstName, lastName, username, password }
 */
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, username, password } = req.body;

  // Validate input
  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }

  // Check if the username already exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists.' });
  }

  try {
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length + 1, // In production, use your database's auto-generated id
      firstName,
      lastName,
      username,
      password: hashedPassword, // Store the hashed password
    };

    users.push(newUser);

    // Optionally, issue a JWT token immediately after registration
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
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
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/**
 * Login Endpoint
 * Expects: { username, password }
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Find the user by username
  const user = users.find(u => u.username === username);
  if (!user) {
    // Avoid revealing which field was incorrect for security reasons
    return res.status(401).json({ message: 'Incorrect username or password.' });
  }

  try {
    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect username or password.' });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
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
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
