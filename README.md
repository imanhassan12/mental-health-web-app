# Mental Health Practitioner Aide

## Overview

**Mental Health Practitoner Aide** is an innovative web application designed specifically for mental health practitioners. Our tool streamlines client management by enabling secure, centralized access to client data, **daily mood check-ins, treatment goal tracking, note logging, and actionable insights.** By replacing outdated paper-based systems with a modern, integrated digital solution, our app empowers practitioners to make data-driven decisions and enhance treatment outcomes. 

---

## Vision & Scope

### **Vision**
Empower mental health practitioners with a secure, integrated, and user-friendly platform for comprehensive client management, enabling better tracking of client progress and improved treatment outcomes.

### **Scope**
#### ✅ **Core Features:**
- **Secure Practitoner Login:** Role-based authentication ensures that only authorized practitioners can access client data.
- **Client Management Dashboard:** View and manage detailed client profiles, including mood, check-ins, session notes, and treatment goals.
- **Daily Check-ins:** Record client mood and session observations to track progress over time.
- **Goal Setting & Monitoring:** Establish and monitor treatment goals to support client improvement.
- **Integrated Analytics:** Visualize client data trends to gain actionable insights.
- **Secure Communication:** Send reminders and real-time notifications to ensure proactive engagement.
#### 🔮 **Planned Features:**
- **Skills Library:** Guided DBT/CBT exercises.
- **Progress Tracking:** Visualize mood trends over time.

---

## Features

- **Secure Practitoner Login:** Role-based authentication to ensure private data remains protected. 
- **Client Management Dashboard:** Unified interface for viewing/editing client profiles, mood-checkins, and goals.
- **Goal Setting and Monitoring:** Create measureable treatment goals, track progress over time.
- **Session Notes:** Easily capture session summaries, structured notes, and attach them to a client's profile. 
- **Appointment & Scheduling:** Schedule and manage client appointments with status updates
- **Resources:** Skills Library that include DBT/CBT exercises for clients. 

---

## Tech Stack

### **Frontend**
- React (with Create React App)
- Bootstrap for responsive, modern design
- Custom CSS & React Icons for a polished look

### **Backend**
- Node.js with Express for lightweight, scalable API endpoints
- Sequelize ORM for database operations
- MySQL for relational database storage

### **Database**
- MySQL for reliability and flexibility. It handles complex client data, supports advanced queries, and scales as our needs grow.

### **Version Control**
- 🔄 Git & GitHub for collaboration and code management

---
## Getting Started

### Prerequisites
- Node.js (v14 or newer)
- Docker and Docker Compose (for MySQL database)
- npm or yarn

### Setup Database with Docker

1. Start the MySQL database using Docker:
```bash
docker-compose up -d
```

This will start MySQL on port 3306 and phpMyAdmin on port 8080. You can access phpMyAdmin at http://localhost:8080 (username: user, password: password).

### Install and Set Up Backend

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory with the following content:
```
DB_USERNAME=user
DB_PASSWORD=password
DB_DATABASE=mental_health_db
DB_HOST=localhost
DB_DIALECT=mysql
JWT_SECRET=YourSuperSecretKeyForJWT
```

4. Initialize the database - you have two options:

   **Option 1:** Standard setup with basic seed data:
   ```bash
   npm run db:init
   ```

   **Option 2:** Enhanced setup with comprehensive SQL demo data:
   ```bash
   npm run db:demo-setup
   ```
   *This loads more extensive sample data including multiple practitioners, clients, appointments, notes, and goals.*

5. Start the development server:
```bash
npm run dev
```

The backend server will be running at http://localhost:4000.

### Default Login Credentials

After seeding the database, you can log in with:

For basic seed data:
- Username: `jsmith`, Password: `password123`

For enhanced SQL demo data:
- Username: `jsmith`, Password: `password123`
- Username: `mjohnson`, Password: `password123`

### Install and Set Up Frontend

1. Open a new terminal and navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be running at http://localhost:3000.

### Default Login

After seeding the database, you can log in with:
- Username: `jsmith`
- Password: `password123`

---

## Usage

See the individual README files in the client and server directories for more details about usage and API endpoints.
