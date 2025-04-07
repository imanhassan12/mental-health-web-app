// server/update-argon2-passwords.js
require('dotenv').config();
const argon2 = require('argon2');
const { Sequelize } = require('sequelize');
const config = require('./config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// The demo login password
const DEMO_PASSWORD = 'password123';

async function updatePasswords() {
  try {
    console.log('Updating practitioner passwords from bcrypt to argon2...');
    
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

    // First, get all practitioners
    const [practitioners] = await sequelize.query(
      'SELECT id, username, password FROM Practitioners'
    );
    
    console.log(`Found ${practitioners.length} practitioners to process.`);
    
    // For each practitioner, check if they have a bcrypt password and update it
    let updatedCount = 0;
    
    for (const practitioner of practitioners) {
      const { id, username, password } = practitioner;
      
      // Check if this is a bcrypt password (starts with $2)
      if (password && password.startsWith('$2')) {
        console.log(`Updating password for ${username} (${id})...`);
        
        // Generate new argon2 hash from demo password
        // NOTE: In a real app, you would need to ask users to reset their passwords
        // This is only for demo purposes
        const newPasswordHash = await argon2.hash(DEMO_PASSWORD);
        
        // Update the practitioner's password
        await sequelize.query(
          'UPDATE Practitioners SET password = ? WHERE id = ?',
          {
            replacements: [newPasswordHash, id]
          }
        );
        
        updatedCount++;
        console.log(`Updated password for ${username} to use argon2.`);
      } else {
        console.log(`Skipping ${username}, already using a non-bcrypt hash format.`);
      }
    }
    
    console.log(`\nPassword update complete! Updated ${updatedCount} practitioners.`);
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