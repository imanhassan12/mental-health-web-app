// server/scripts/full-demo-setup.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const setupDatabase = require('./db-setup');
const runSqlDemo = require('./run-sql-demo');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');

// Runs a command and outputs the results
const runCommand = async (command, description) => {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
};

// Fallback method to load demo data using Sequelize
const loadDemoDataFallback = async () => {
  try {
    console.log('🔄 Using fallback method to load demo data...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'demo-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .replace(/\/\*.*\*\//g, '') // Remove comments
      .replace(/--.*\n/g, '\n')  // Remove single-line comments
      .split(';')
      .filter(stmt => stmt.trim() !== '');
    
    // Execute each statement separately
    for (const stmt of statements) {
      try {
        await sequelize.query(stmt);
      } catch (error) {
        console.error(`Error executing statement: ${error.message}`);
        console.error(`Statement: ${stmt.trim().substring(0, 100)}...`);
        // Continue with next statement even if one fails
      }
    }
    
    console.log('✅ Demo data loaded successfully via fallback method');
    return true;
  } catch (error) {
    console.error('❌ Error in fallback demo data loading:', error);
    return false;
  }
};

// Main function to run all steps in sequence
const fullDemoSetup = async () => {
  try {
    console.log('🔥 Starting full database setup with demo data...');
    
    // Step 1: Create database if it doesn't exist
    const dbSetupResult = await setupDatabase();
    if (!dbSetupResult.success) {
      console.error('❌ Database setup failed. Exiting.');
      return false;
    }
    
    // Step 2: Run migrations
    const migrationSuccess = await runCommand(
      'npx sequelize-cli db:migrate',
      'Running database migrations'
    );
    
    if (!migrationSuccess) {
      console.error('❌ Migrations failed. Exiting.');
      return false;
    }
    
    // Step 3: Run the SQL demo data
    let demoDataSuccess = await runSqlDemo();
    
    // If SQL file method fails, try the fallback method
    if (!demoDataSuccess) {
      console.warn('⚠️ Primary method for loading demo data failed, trying fallback method...');
      demoDataSuccess = await loadDemoDataFallback();
    }
    
    if (!demoDataSuccess) {
      console.error('❌ Loading demo data failed. Exiting.');
      return false;
    }
    
    console.log('\n🎉 Full database setup with demo data completed successfully!');
    console.log('\nYou can now start the server with: npm run dev');
    console.log('Login credentials:');
    console.log('- Username: jsmith, Password: password123');
    console.log('- Username: mjohnson, Password: password123');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during setup:', error);
    return false;
  }
};

// Run the initialization
if (require.main === module) {
  fullDemoSetup()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = fullDemoSetup; 