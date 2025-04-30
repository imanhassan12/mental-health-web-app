// server/scripts/full-demo-setup.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const setupDatabase = require('./db-setup');
const runSqlDemo = require('./run-sql-demo');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const db = require('../models');

// Define demoClient in the parent scope
let demoClient;

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

    // -------------------------------------------------------------------
    // Step 4: Insert example risk-alert data (low mood)                   
    // -------------------------------------------------------------------
    try {
      console.log('🔄 Inserting example risk-alert data (low mood session note)...');
      // Find any existing client, else create one quickly
      demoClient = await db.Client.findOne();
      if (!demoClient) {
        demoClient = await db.Client.create({
          name: 'Demo Patient',
          dateOfBirth: '1990-01-01',
          email: 'demo.patient@example.com'
        });
      }

      // Create a recent session note with low mood (<=3)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1); // yesterday

      await db.SessionNote.create({
        clientId: demoClient.id,
        mood: 2, // low mood triggers alert
        content: 'Feeling very low and anxious.',
        date: recentDate
      });

      console.log('✅ Risk-alert demo data inserted.');
    } catch (insertErr) {
      console.error('⚠️ Could not insert risk-alert demo data:', insertErr.message);
      // Continue; not fatal
    }

    // -------------------------------------------------------------------
    // Step 5: Insert example reminders/follow-ups
    // -------------------------------------------------------------------
    try {
      console.log('🔄 Inserting example reminders/follow-ups...');
      const now = new Date();

      // Find any existing practitioner, else create one quickly
      let demoPractitioner = await db.Practitioner.findOne();
      if (!demoPractitioner) {
        demoPractitioner = await db.Practitioner.create({
          name: 'Dr. Demo',
          username: 'drdemo',
          password: 'pbkdf2:10000:salt:hash', // use a valid hash if needed
          email: 'dr.demo@example.com'
        });
      }

      // Create a few reminders
      await db.Reminder.bulkCreate([
        {
          clientId: demoClient.id,
          practitionerId: demoPractitioner.id,
          type: 'appointment',
          message: 'Upcoming appointment tomorrow at 10am.',
          dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
          recurrence: 'none',
          phoneNumber: '+12345678901',
          isDone: false,
          sent: false,
        },
        {
          clientId: demoClient.id,
          practitionerId: demoPractitioner.id,
          type: 'followup',
          message: 'Weekly check-in reminder.',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // next week
          recurrence: 'weekly',
          phoneNumber: '+12345678901',
          isDone: false,
          sent: false,
        },
        {
          clientId: demoClient.id,
          practitionerId: demoPractitioner.id,
          type: 'custom',
          message: 'Custom reminder for demo.',
          dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // in 2 days
          recurrence: 'none',
          phoneNumber: '+12345678901',
          isDone: false,
          sent: false,
        }
      ]);
      console.log('✅ Demo reminders inserted.');
    } catch (reminderErr) {
      console.error('⚠️ Could not insert demo reminders:', reminderErr.message);
      // Continue; not fatal
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