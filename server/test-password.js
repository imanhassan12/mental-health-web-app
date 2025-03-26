const bcrypt = require('bcrypt');

// The password we want to verify
const password = 'password123';

// The stored hash from the demo data
const storedHash = '$2b$10$W2Qj6oIZGnSCQhRyejyubeQ5Ry0n4bBCi0s.qk40pz4scvSj1UWDW';

async function testPassword() {
  try {
    console.log('Testing bcrypt password verification...');
    console.log(`Password: ${password}`);
    console.log(`Stored Hash: ${storedHash}`);
    
    // Test if the password matches the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log(`Password match result: ${isMatch}`);
    
    // Generate a new hash for the password
    const newHash = await bcrypt.hash(password, 10);
    console.log(`Newly generated hash: ${newHash}`);
    
    // Test if the password matches the new hash
    const newIsMatch = await bcrypt.compare(password, newHash);
    console.log(`Password match with new hash: ${newIsMatch}`);
  } catch (error) {
    console.error('Error testing password:', error);
  }
}

// Run the test
testPassword(); 