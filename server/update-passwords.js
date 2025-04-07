// server/update-passwords.js
require('dotenv').config();
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const config = require('./config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Demo password for test accounts
const DEMO_PASSWORD = 'password123';

// Helper function for hashing passwords with crypto
function hashPassword(password) {
  // Using PBKDF2 for password hashing (built-in to Node.js)
  return new Promise((resolve, reject) => {
    // Use a consistent salt for demo accounts to ensure reproducibility
    const salt = 'demo_salt_for_consistency_1234567890';
    
    // Use PBKDF2 to hash the password with the salt
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      
      // Format: algorithm:iterations:salt:hash
      const hash = `pbkdf2:10000:${salt}:${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
}

async function updatePasswords() {
  try {
    console.log('Updating practitioner password hashes with PBKDF2...');
    
    // Initialize Sequelize
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        dialect: dbConfig.dialect
      }
    );

    // Authenticate with database
    await sequelize.authenticate();
    console.log('Connected to database successfully.');

    // Hash the demo password using PBKDF2
    const demoPasswordHash = await hashPassword(DEMO_PASSWORD);
    console.log(`Created PBKDF2 password hash for demo accounts`);

    // Update passwords in database for demo accounts only
    const [affectedRows] = await sequelize.query(
      'UPDATE Practitioners SET password = ? WHERE username IN ("jsmith", "mjohnson")',
      {
        replacements: [demoPasswordHash]
      }
    );

    console.log(`Updated passwords for ${affectedRows} practitioners.`);
    console.log('Password update complete!');
    console.log('\nYou can now login with:');
    console.log('- Username: jsmith, Password: password123');
    console.log('- Username: mjohnson, Password: password123');

    // Close the connection
    await sequelize.close();
  } catch (error) {
    console.error('Error updating passwords:', error);
  }
}

// Run the update function
updatePasswords(); 