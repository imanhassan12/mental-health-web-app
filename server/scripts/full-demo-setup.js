// server/scripts/full-demo-setup.js
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const setupDatabase = require('./db-setup');
const runSqlDemo = require('./run-sql-demo');

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
    const demoDataSuccess = await runSqlDemo();
    
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