const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const setupDatabase = require('./db-setup');

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
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Step 1: Create database if it doesn't exist
    const dbSetupResult = await setupDatabase();
    if (!dbSetupResult.success) {
      console.error('❌ Database setup failed. Exiting.');
      process.exit(1);
    }
    
    // Step 2: Run migrations
    const migrationSuccess = await runCommand(
      'npx sequelize-cli db:migrate',
      'Running database migrations'
    );
    
    if (!migrationSuccess) {
      console.error('❌ Migrations failed. Exiting.');
      process.exit(1);
    }
    
    // Step 3: Seed the database
    const seedSuccess = await runCommand(
      'npx sequelize-cli db:seed:all',
      'Seeding database with initial data'
    );
    
    if (!seedSuccess) {
      console.error('❌ Seeding failed. Exiting.');
      process.exit(1);
    }
    
    console.log('\n✨ Database initialization completed successfully!');
    console.log('\nYou can now start the server with: npm run dev');
    console.log('- Default practitioner login: username: jsmith, password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error during database initialization:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeDatabase(); 