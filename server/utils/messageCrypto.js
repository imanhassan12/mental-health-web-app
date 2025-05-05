const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Lazy init: use process.env.MESSAGE_CRYPTO_KEY if set, else fallback
function getKey() {
  const keySource = process.env.MESSAGE_CRYPTO_KEY || 'demo_secret_key';
  return crypto.createHash('sha256').update(keySource).digest();
}
const IV = Buffer.alloc(16, 0); // For demo only; use random IV in production

function encrypt(text) {
  const KEY = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(encrypted) {
  const KEY = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt }; 