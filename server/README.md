# Mental Health Practitioner Aide - Server

This is the backend server for the Mental Health Practitioner Aide application. It provides the API endpoints for the client application and handles data storage and authentication.

## Prerequisites

- Node.js (v14 or newer)
- MySQL (v8.0 or newer)

## Getting Started

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory with the following content (update as needed):
```
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=mental_health_db
DB_HOST=127.0.0.1
DB_DIALECT=mysql
JWT_SECRET=YourSuperSecretKeyForJWT
```

4. Initialize the database (create, migrate, and seed):
```bash
npm run db:init
```

5. Start the development server:
```bash
npm run dev
```

The server will be running at http://localhost:4000.

## Demo Data Options

You have two options to populate your database with demo data:

### Option 1: Using Sequelize Seeds (Default)
This option uses the built-in Sequelize seeder:
```bash
npm run db:init
```

### Option 2: Using SQL Demo Data
This option loads a comprehensive set of demo data using direct SQL:
```bash
# If you already created the database and ran migrations
npm run db:demo

# Or for a complete setup from scratch (create DB, run migrations, load demo data)
npm run db:demo-setup

# Alternatively, if you prefer to use the bash script directly (Unix/Mac):
cd scripts
./load-demo-data.sh
```

The SQL demo data includes:
- 2 practitioners
- 4 clients
- Multiple appointments, session notes, and goals
- Realistic sample data with appropriate relationships

Login credentials for demo data:
- Username: `jsmith`, Password: `password123`
- Username: `mjohnson`, Password: `password123`

## Database Schema

The application uses the following database schema:

```
Practitioner
-----------
id (UUID, PK)
name (String)
username (String, unique)
password (String)
email (String, unique)
createdAt (Date)
updatedAt (Date)

Client
-----------
id (UUID, PK)
name (String)
phone (String)
notes (Text)
createdAt (Date)
updatedAt (Date)

Appointment
-----------
id (UUID, PK)
clientId (UUID, FK -> Client.id)
practitionerId (UUID, FK -> Practitioner.id)
startTime (Date)
endTime (Date)
status (String)
title (String)
notes (Text)
createdAt (Date)
updatedAt (Date)

SessionNote
-----------
id (UUID, PK)
clientId (UUID, FK -> Client.id)
date (Date)
mood (Integer, 1-10)
content (Text)
createdAt (Date)
updatedAt (Date)

Goal
-----------
id (UUID, PK)
clientId (UUID, FK -> Client.id)
title (String)
description (Text)
status (String)
targetDate (Date)
createdAt (Date)
updatedAt (Date)
```

## Database Management

- **Setup database only**: `npm run db:setup`
- **Run migrations**: `npm run db:migrate`
- **Seed database with Sequelize**: `npm run db:seed`
- **Load SQL demo data**: `npm run db:demo`
- **Reset database** (undo all migrations, migrate, and seed): `npm run db:reset`
- **Complete demo setup** (create DB, migrate, load SQL demo): `npm run db:demo-setup`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new practitioner
- `POST /api/login` - Login a practitioner

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get a specific client
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client

### Session Notes
- `GET /api/session-notes` - Get all session notes
- `GET /api/session-notes/client/:clientId` - Get all session notes for a client
- `GET /api/session-notes/:id` - Get a specific session note
- `POST /api/session-notes` - Create a new session note
- `PUT /api/session-notes/:id` - Update a session note
- `DELETE /api/session-notes/:id` - Delete a session note

### Goals
- `GET /api/goals` - Get all goals
- `GET /api/goals/client/:clientId` - Get all goals for a client
- `GET /api/goals/:id` - Get a specific goal
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `DELETE /api/goals/:id` - Delete a goal

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update an appointment
- `DELETE /api/appointments/:id` - Delete an appointment

## Default Login

After seeding the database, you can log in with:
- Username: `jsmith`
- Password: `password123` 