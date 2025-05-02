'use strict';
const crypto = require('crypto');

function hashPasswordSync(password) {
  // Use a fixed salt for demo consistency
  const salt = 'demo_salt_for_consistency_1234567890';
  const derivedKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
  return `pbkdf2:10000:${salt}:${derivedKey.toString('hex')}`;
}

module.exports = {
  async up (queryInterface, Sequelize) {
    const password = hashPasswordSync('Password123!');
    await queryInterface.bulkInsert('Practitioners', [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Alice Admin',
        username: 'alice',
        password,
        email: 'alice.admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Bob Practitioner',
        username: 'bob',
        password,
        email: 'bob.practitioner@example.com',
        role: 'practitioner',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Carol Viewer',
        username: 'carol',
        password,
        email: 'carol.viewer@example.com',
        role: 'viewer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Practitioners', {
      username: ['alice', 'bob', 'carol']
    });
  }
}; 