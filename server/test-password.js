const argon2 = require('argon2');

// The password we want to verify
const password = 'password123';

// The stored bcrypt hash from the demo data
const storedBcryptHash = '$argon2id$v=19$m=65536,t=3,p=4$I6vv2WIRdtgTT/b1JkGMSQ$JtuSWVR7HAdEC5/iNV8fe5dg0K3NbV6EZWsKdq5jm7o';

async function testPassword() {
  try {
    console.log('Testing password verification with Argon2 and bcrypt hash...');
    console.log(`Password: ${password}`);
    console.log(`Stored bcrypt Hash: ${storedBcryptHash}`);
    
    // Test if Argon2 can directly verify a bcrypt hash (this will likely fail)
    try {
      const isMatchArgon2 = await argon2.verify(storedBcryptHash, password);
      console.log(`Direct Argon2 verification of bcrypt hash result: ${isMatchArgon2}`);
    } catch (error) {
      console.error('Error when trying to verify bcrypt hash with Argon2:', error.message);
    }
    
    // Generate a new Argon2 hash for the password
    const newArgon2Hash = await argon2.hash(password);
    console.log(`\nNewly generated Argon2 hash: ${newArgon2Hash}`);
    
    // Test if the password matches the new Argon2 hash
    const newIsMatch = await argon2.verify(newArgon2Hash, password);
    console.log(`Password match with new Argon2 hash: ${newIsMatch}`);
    
    // Test string comparison for legacy bcrypt passwords
    console.log(`\nTesting direct string comparison for demo login:`);
    const isMatchStringCompare = password === 'password123';
    console.log(`Direct string comparison result: ${isMatchStringCompare}`);
    
  } catch (error) {
    console.error('Error testing password:', error);
  }
}

// Run the test
testPassword(); 