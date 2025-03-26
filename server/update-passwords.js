// server/update-passwords.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const config = require('./config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

async function updatePasswords() {
  try {
    console.log('Updating practitioner password hashes...');
    
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

    // Generate new password hash
    const newPasswordHash = await bcrypt.hash('password123', 10);
    console.log(`Generated new password hash: ${newPasswordHash}`);

    // Update passwords in database
    const [affectedRows] = await sequelize.query(
      'UPDATE Practitioners SET password = ? WHERE username IN ("jsmith", "mjohnson")',
      {
        replacements: [newPasswordHash]
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