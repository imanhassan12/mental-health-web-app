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
  DB_USERNAME = 'root',
  DB_PASSWORD = '',
  DB_DATABASE = 'mental_health_db',
  DB_HOST = '127.0.0.1',
} = process.env;

// Path to SQL file
const sqlFilePath = path.join(__dirname, 'demo-data.sql');

// Function to run the SQL file using the mysql command line client
async function runSqlFile() {
  try {
    console.log('🚀 Running SQL demo data file...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file read successfully.');
    
    // Write the SQL to a temporary file to avoid command line length limitations
    // Use a file in /tmp directory to avoid path issues with spaces
    const tempSqlFile = path.join(os.tmpdir(), 'temp-demo-data.sql');
    fs.writeFileSync(tempSqlFile, sqlContent);
    console.log(`📄 Temp SQL file created at: ${tempSqlFile}`);
    
    // Build the mysql command with password handling and proper escaping for paths
    let command;
    if (DB_PASSWORD) {
      // Using MYSQL_PWD environment variable to avoid password in command line
      command = `MYSQL_PWD="${DB_PASSWORD}" mysql -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_DATABASE}" < "${tempSqlFile}"`;
    } else {
      command = `mysql -h "${DB_HOST}" -u "${DB_USERNAME}" "${DB_DATABASE}" < "${tempSqlFile}"`;
    }
    
    // Execute the SQL file
    console.log('⚙️ Executing SQL file...');
    const { stdout, stderr } = await execPromise(command, { shell: '/bin/bash' });
    
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