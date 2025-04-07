// server/scripts/run-sql-demo.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const os = require('os');
require('dotenv').config();

// Get database configuration from environment variables
const {
  DB_USERNAME = 'user',
  DB_PASSWORD = 'password',
  DB_NAME = 'mental_health_db',
  DB_HOST = 'mysql',
} = process.env;

// Path to SQL file
const sqlFilePath = path.join(__dirname, 'demo-data.sql');

// Function to run the SQL file using the mysql command line client
async function runSqlFile() {
  try {
    console.log('🚀 Running SQL demo data file...');
    console.log(`🔌 Database: ${DB_NAME} on ${DB_HOST} with user ${DB_USERNAME}`);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file read successfully.');
    
    // Write the SQL to a temporary file to avoid command line length limitations
    // Use a file in /tmp directory to avoid path issues with spaces
    const tempSqlFile = path.join(os.tmpdir(), 'temp-demo-data.sql');
    fs.writeFileSync(tempSqlFile, sqlContent);
    console.log(`📄 Temp SQL file created at: ${tempSqlFile}`);
    
    // Build the mariadb command with password handling and proper escaping for paths
    // Using mariadb instead of mysql client in Alpine Linux
    let command;
    if (DB_PASSWORD) {
      // Using MYSQL_PWD environment variable to avoid password in command line
      command = `MYSQL_PWD="${DB_PASSWORD}" mariadb -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_NAME}" < "${tempSqlFile}"`;
    } else {
      command = `mariadb -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_NAME}" < "${tempSqlFile}"`;
    }
    
    // Execute the SQL file
    console.log('⚙️ Executing SQL file...');
    console.log('Command:', command.replace(DB_PASSWORD, '******')); // Log command with password redacted
    
    // Use /bin/sh instead of /bin/bash (Alpine Linux)
    const { stdout, stderr } = await execPromise(command, { shell: '/bin/sh' });
    
    // Clean up the temporary file
    fs.unlinkSync(tempSqlFile);
    console.log('🧹 Temp SQL file cleaned up.');
    
    if (stderr && !stderr.includes('Warning')) {
      throw new Error(stderr);
    }
    
    if (stdout) {
      console.log('MySQL Output:', stdout);
    }
    
    console.log('✨ Demo data has been successfully loaded into the database!');
    console.log('\nYou can now access the application with the following accounts:');
    console.log('- Username: jsmith, Password: password123');
    console.log('- Username: mjohnson, Password: password123');
    return true;
  } catch (error) {
    console.error('❌ Error running SQL file:', error);
    return false;
  }
}

// Run the function
if (require.main === module) {
  runSqlFile()
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

module.exports = runSqlFile; 