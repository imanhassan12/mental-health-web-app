# Mental Health Practioner Aide

## Overview

**Mental Health Practitoner Aide** is an innovative web application designed specifically for mental health practitioners. Our tool streamlines client management by enabling secure, centralized access to client data, **daily mood check-ins,treatment goal tracking, note logging,and actionable insights.** By replacing outdated paper-based systems with a modern. integrated digital solutin, out app empowers practitioners to make data-driven decisions and enhance treatment outcomese. 

---

## Vision & Scope

### **Vision**
Empower mental health practitioners with a secure, integrated, and user-friendly platdorm for comprehensive client management, enabling better tracking of client progress and improved treatment outcomes.

### **Scope**
#### ✅ **Core Features:**
- **Secure Practitoner Login:** Rle-based authentication ensures that only authorized practitoners can access client data.
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

- **Secure Practitoner Login :** Role-based authentication to ensure private data remains protected. 
- **Client Management Dashboard**  Unified interface for viewing/editing client profiles, mood-checkins, and goals.
- **Goal Setting and Monitoring** Create measureable treatment goals, track progress over time.
- **Session Notes** Easily capture session summaries, structured notes, and attach them to a client's profile. 
- **Appointment & Scheduling** - Schedule and manage client appointments with status updates
- **Resources** - Skills Library that include DBT/CBT exercises for clients. 

---

## Tech Stack

### **Frontend**
- React (with Create React App)
- Bootstrap for responsive, modern design
- Custom CSS & React Icons for a polished look

### **Backend**
- Node.js with Express for lightweight, scalable API endpoints
- Integratin with AWS services for hosting and data management

### **Database**
- PostgreSQL for reliability and flexibility. It handles complex client data, supports advanced queries, and scales as our needs grow.

### **Version Control**
- 🔄 Git & GitHub for collaboration and code management

---
## Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/imanhassan12/mental-health-web-app.git
```

### 2️⃣ Install Dependencies

#### Client (Frontend)
```bash
cd mental-health-web-app/client
npm install
```

#### Server (Backend)
```bash
cd ../server
npm install
```

## Usage

### Start the Backend

Navigate to the server directory and run:
```bash
cd server
npm install  # Ensure dependencies are installed
npx nodemon server.js
```

### Start the Frontend

In a separate terminal, navigate to the client directory and run:
```bash
cd client
npm start
```
