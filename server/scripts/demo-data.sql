-- server/scripts/demo-data.sql
-- SQL script to insert demo data into the mental health web app database

-- Clear existing data (if needed) in reverse order of dependencies
DELETE FROM Goals;
DELETE FROM SessionNotes;
DELETE FROM Appointments;
DELETE FROM Clients;
DELETE FROM Practitioners;

-- Demo Practitioners
-- Using PBKDF2 hashing (Node.js built-in) with a consistent salt for demo accounts
-- Format: pbkdf2:iterations:salt:hash
-- Both passwords are 'password123'
INSERT INTO Practitioners (id, name, username, password, email, createdAt, updatedAt) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Dr. Jane Smith', 'jsmith', 'pbkdf2:10000:demo_salt_for_consistency_1234567890:1f47a3e28cd7faca48da44b71129f82ca8be704f09f881f61b9fe1265a3661c64334b36f0ce94e9ef8c6e14c6840d5a4a8773e36cc0431a9fde496768b5c94ea', 'jane.smith@example.com', NOW(), NOW()),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Dr. Michael Johnson', 'mjohnson', 'pbkdf2:10000:demo_salt_for_consistency_1234567890:1f47a3e28cd7faca48da44b71129f82ca8be704f09f881f61b9fe1265a3661c64334b36f0ce94e9ef8c6e14c6840d5a4a8773e36cc0431a9fde496768b5c94ea', 'michael.johnson@example.com', NOW(), NOW());
-- Note: Both passwords are set to 'password123'

-- Demo Clients
INSERT INTO Clients (id, name, phone, notes, createdAt, updatedAt) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Alice Johnson', '555-1234', 'High anxiety, weekly sessions required. Responds well to breathing exercises.', NOW(), NOW()),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Bob Williams', '555-5678', 'Moderate depression, check-ins every 2 weeks. Has been making steady progress.', NOW(), NOW()),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Carol Davis', '555-9012', 'ADHD management, monthly sessions. Trying new medication regimen.', NOW(), NOW()),
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'David Miller', '555-3456', 'Grief counseling, weekly sessions. Recent loss of parent.', NOW(), NOW());

-- Demo Appointments
-- Tomorrow at 10:00 AM
SET @tomorrow_10am = DATE_ADD(DATE(NOW()), INTERVAL 1 DAY);
SET @tomorrow_10am = DATE_ADD(@tomorrow_10am, INTERVAL 10 HOUR);
-- Tomorrow at 11:00 AM
SET @tomorrow_11am = DATE_ADD(@tomorrow_10am, INTERVAL 1 HOUR);
-- Tomorrow at 2:00 PM
SET @tomorrow_2pm = DATE_ADD(@tomorrow_10am, INTERVAL 4 HOUR);
-- Tomorrow at 3:00 PM
SET @tomorrow_3pm = DATE_ADD(@tomorrow_10am, INTERVAL 5 HOUR);
-- Next week at 10:00 AM
SET @next_week_10am = DATE_ADD(@tomorrow_10am, INTERVAL 7 DAY);
-- Next week at 11:00 AM
SET @next_week_11am = DATE_ADD(@tomorrow_11am, INTERVAL 7 DAY);

INSERT INTO Appointments (id, clientId, practitionerId, startTime, endTime, status, title, notes, createdAt, updatedAt) VALUES
('g6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', @tomorrow_10am, @tomorrow_11am, 'scheduled', 'Weekly Check-in', 'Discuss anxiety management strategies', NOW(), NOW()),
('h7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', @tomorrow_2pm, @tomorrow_3pm, 'scheduled', 'Bi-weekly Session', 'Review mood tracking and medication efficacy', NOW(), NOW()),
('i8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', @next_week_10am, @next_week_11am, 'scheduled', 'Monthly Follow-up', 'Assess new medication effectiveness', NOW(), NOW()),
('j9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', @tomorrow_10am, @tomorrow_11am, 'scheduled', 'Grief Counseling', 'Continue processing emotions around recent loss', NOW(), NOW());

-- Demo Session Notes
-- Yesterday
SET @yesterday = DATE_SUB(DATE(NOW()), INTERVAL 1 DAY);
-- Last week
SET @last_week = DATE_SUB(DATE(NOW()), INTERVAL 7 DAY);
-- Two weeks ago
SET @two_weeks_ago = DATE_SUB(DATE(NOW()), INTERVAL 14 DAY);
-- One month ago
SET @one_month_ago = DATE_SUB(DATE(NOW()), INTERVAL 30 DAY);

INSERT INTO SessionNotes (id, clientId, date, mood, content, createdAt, updatedAt) VALUES
('k0eebc99-9c0b-4ef8-bb6d-6bb9bd380abb', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', @yesterday, 6, 'Alice reported feeling moderately anxious but is making progress with breathing exercises. She managed to attend a social event over the weekend with minimal anxiety.', NOW(), NOW()),
('l1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', @last_week, 4, 'Alice experienced higher anxiety this week. Identified work deadline as trigger. Practiced grounding techniques during session.', NOW(), NOW()),
('m2eebc99-9c0b-4ef8-bb6d-6bb9bd380add', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', @last_week, 5, 'Bob continues to struggle with low mood but is maintaining social connections. Reported sleeping better this week.', NOW(), NOW()),
('n3eebc99-9c0b-4ef8-bb6d-6bb9bd380aee', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', @two_weeks_ago, 3, 'Bob reported very low mood today. Discussed potential medication adjustment with psychiatrist.', NOW(), NOW()),
('o4eebc99-9c0b-4ef8-bb6d-6bb9bd380aff', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', @one_month_ago, 7, 'Carol is responding well to new medication. Reported improved focus at work and home.', NOW(), NOW()),
('p5eebc99-9c0b-4ef8-bb6d-6bb9bd380a00', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', @yesterday, 4, 'David expressed continued grief but showed interest in rejoining social activities. Progress noted.', NOW(), NOW());

-- Demo Goals
-- Target dates
SET @one_month_later = DATE_ADD(DATE(NOW()), INTERVAL 30 DAY);
SET @two_months_later = DATE_ADD(DATE(NOW()), INTERVAL 60 DAY);
SET @three_months_later = DATE_ADD(DATE(NOW()), INTERVAL 90 DAY);

INSERT INTO Goals (id, clientId, title, description, status, targetDate, createdAt, updatedAt) VALUES
('q6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Reduce anxiety in social situations', 'Practice grounding techniques before and during social events. Aim to attend at least one social gathering per week.', 'in progress', @two_months_later, NOW(), NOW()),
('r7eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Improve sleep quality', 'Establish consistent sleep schedule. No screen time 1 hour before bed.', 'not started', @one_month_later, NOW(), NOW()),
('s8eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Establish daily exercise routine', 'Start with 15 minutes of walking daily, gradually increasing to 30 minutes', 'in progress', @two_months_later, NOW(), NOW()),
('t9eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Practice daily gratitude', 'Write down three things to be grateful for each morning', 'in progress', @one_month_later, NOW(), NOW()),
('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Implement organization system', 'Use planner consistently and establish daily routine to manage ADHD symptoms', 'in progress', @three_months_later, NOW(), NOW()),
('v1eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Join grief support group', 'Attend at least two meetings to connect with others experiencing similar losses', 'not started', @one_month_later, NOW(), NOW()); 