const { Sequelize } = require('sequelize');
require('dotenv').config();

// Read database configuration
const config = require('../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create database
const setupDatabase = async () => {
  try {
    // Create a connection to MySQL server without specifying database (for initialization)
    const sequelize = new Sequelize(null, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect
    });

    // Authenticate connection
    await sequelize.authenticate();
    console.log('Connected to MySQL server successfully.');

    // Create database if it doesn't exist
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    console.log(`Database ${dbConfig.database} created or already exists.`);

    // Close the connection
    await sequelize.close();
    console.log('Database setup completed successfully.');
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up database:', error);
    return { success: false, error };
  }
};

// Run the setup function if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(result => {
      if (result.success) {
        console.log('Database setup completed successfully. You can now run migrations.');
        process.exit(0);
      } else {
        console.error('Database setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error during database setup:', err);
      process.exit(1);
    });
}

module.exports = setupDatabase; 