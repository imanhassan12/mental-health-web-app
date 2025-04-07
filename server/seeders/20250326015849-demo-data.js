'use strict';
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Helper function for hashing passwords with crypto
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Use a consistent salt for demo accounts to ensure reproducibility
    const salt = 'demo_salt_for_consistency_1234567890';
    
    // Use PBKDF2 to hash the password with the salt
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      
      // Format: algorithm:iterations:salt:hash
      const hash = `pbkdf2:10000:${salt}:${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate some UUIDs for consistent references
    const practitionerId1 = uuidv4();
    const practitionerId2 = uuidv4();
    const clientId1 = uuidv4();
    const clientId2 = uuidv4();
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Hash a password for the demo practitioners using PBKDF2
    const hashedPassword = await hashPassword('password123');
    
    // Add practitioners
    await queryInterface.bulkInsert('Practitioners', [
      {
        id: practitionerId1,
        name: 'Dr. Jane Smith',
        username: 'jsmith',
        password: hashedPassword,
        email: 'jane.smith@example.com',
        createdAt: now,
        updatedAt: now
      },
      {
        id: practitionerId2,
        name: 'Dr. Michael Johnson',
        username: 'mjohnson',
        password: hashedPassword,
        email: 'michael.johnson@example.com',
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    // Add clients
    await queryInterface.bulkInsert('Clients', [
      {
        id: clientId1,
        name: 'Alice Johnson',
        phone: '555-1234',
        notes: 'High anxiety, weekly sessions',
        createdAt: now,
        updatedAt: now
      },
      {
        id: clientId2,
        name: 'Bob Williams',
        phone: '555-5678',
        notes: 'Moderate depression, check-ins every 2 weeks',
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    // Add appointments
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);
    
    await queryInterface.bulkInsert('Appointments', [
      {
        id: uuidv4(),
        clientId: clientId1,
        practitionerId: practitionerId1,
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 3600000), // 1 hour later
        status: 'scheduled',
        title: 'Weekly Check-in',
        notes: 'Discuss anxiety management strategies',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        clientId: clientId2,
        practitionerId: practitionerId1,
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 3600000), // 1 hour later
        status: 'scheduled',
        title: 'Bi-weekly Session',
        notes: 'Review mood tracking and medication efficacy',
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    // Add session notes
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    await queryInterface.bulkInsert('SessionNotes', [
      {
        id: uuidv4(),
        clientId: clientId1,
        date: yesterday,
        mood: 6,
        content: 'Alice reported feeling moderately anxious but is making progress with breathing exercises.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        clientId: clientId2,
        date: lastWeek,
        mood: 4,
        content: 'Bob continues to struggle with low mood but is maintaining social connections.',
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    // Add goals
    const twoMonthsLater = new Date(now);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    
    await queryInterface.bulkInsert('Goals', [
      {
        id: uuidv4(),
        clientId: clientId1,
        title: 'Reduce anxiety in social situations',
        description: 'Practice grounding techniques before and during social events',
        status: 'in progress',
        targetDate: twoMonthsLater,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        clientId: clientId2,
        title: 'Establish daily exercise routine',
        description: 'Start with 15 minutes of walking daily, gradually increasing to 30 minutes',
        status: 'in progress',
        targetDate: twoMonthsLater,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data in reverse order to avoid foreign key issues
    await queryInterface.bulkDelete('Goals', null, {});
    await queryInterface.bulkDelete('SessionNotes', null, {});
    await queryInterface.bulkDelete('Appointments', null, {});
    await queryInterface.bulkDelete('Clients', null, {});
    await queryInterface.bulkDelete('Practitioners', null, {});
  }
};
