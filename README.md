# Mental Health Practitioner Aide

A web application for mental health practitioners to manage clients, appointments, session notes, and goals.

## Features

- Client management
- Appointment scheduling
- Session notes recording
- Goal tracking
- Dashboard with key metrics

## Tech Stack

- **Frontend**: React, React Router, Axios, Chart.js
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: MySQL
- **Docker**: Containerization for easy deployment

## Prerequisites

- Docker
- Docker Compose

### Installing Docker & Docker Compose

#### Docker
- **Mac**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

#### Docker Compose
- **Mac/Windows**: Docker Compose is included with Docker Desktop
- **Linux**: Follow the [official installation guide](https://docs.docker.com/compose/install/linux/)
  ```bash
  # Download the current stable release of Docker Compose
  sudo curl -SL https://github.com/docker/compose/releases/download/v2.34.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
  
  # Apply executable permissions
  sudo chmod +x /usr/local/bin/docker-compose
  
  # Verify installation
  docker-compose --version
  ```

## Quick Start with Docker

The easiest way to run the application is using Docker Compose, which will start all components (database, backend, and frontend) with a single command.

1. Clone the repository:
```bash
git clone <repository-url>
cd mental-health-web-app
```

2. Run the setup script (which creates the `.env` file and starts the application):
```bash
./setup.sh
```

**OR** follow these manual steps:

1. Create a `.env` file in the root directory:
```
DB_USERNAME=user
DB_PASSWORD=password
JWT_SECRET=YourSuperSecretKeyForJWT
```

2. Start the application:
```bash
npm run start
```

This will:
- Start a MySQL database on port 3306
- Start phpMyAdmin on port 8080 (access at http://localhost:8080)
- Start the backend server on port 4000
- Start the frontend on port 3000 (access the application at http://localhost:3000)
- Set up the database with demo data

3. To stop the application:
```bash
npm run stop
```

4. To remove all data and start fresh:
```bash
npm run clean
```

## Using phpMyAdmin

The application includes phpMyAdmin for database management, accessible at http://localhost:8080 once the containers are running.

### Login Credentials

When accessing phpMyAdmin, use the following details:

- **Server**: `mysql` (not localhost, as phpMyAdmin connects via Docker's internal network)
- **Username**: `user` (default regular user) or `root` (administrator)
- **Password**: `password` (for regular user) or `rootpassword` (for root user)

### Troubleshooting phpMyAdmin Access

If you encounter connection issues with phpMyAdmin:

1. Ensure the MySQL container is running:
   ```bash
   docker ps | grep mysql
   ```

2. Check if MySQL is properly initialized:
   ```bash
   docker logs mental_health_db
   ```

3. Make sure you're using the service name `mysql` as the server, not `localhost`

4. If you modified the default credentials in your `.env` file, use those values instead

5. Try restarting the containers:
   ```bash
   docker-compose restart
   ```

## Login Credentials

After starting the application with demo data, you can log in with:
- Username: `jsmith`
- Password: `password123`

Or:
- Username: `mjohnson`
- Password: `password123`

## Troubleshooting

### Common Issues

- **Docker Compose Not Found**: Make sure Docker Compose is installed. On Linux, you need to install it separately; on Mac/Windows, it comes with Docker Desktop.
- **Docker Not Running**: Make sure Docker is running before starting the application.
- **Port Conflicts**: If you already have services running on ports 3000, 4000, 3306, or 8080, you'll need to stop them or modify the port mappings in docker-compose.yml.

## Manual Setup (Without Docker)

If you prefer to run the components separately, follow these steps:

### Setup Database (MySQL)

1. Install MySQL locally or use Docker:
```bash
docker-compose up -d mysql
```

2. Access phpMyAdmin at http://localhost:8080 (username: user, password: password).

### Setup Backend

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your database credentials.

4. Initialize the database:
```bash
npm run db:demo-setup
```

5. Start the server:
```bash
npm run dev
```

The server will be running at http://localhost:4000.

### Setup Frontend

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

## Development

- `npm run dev:client` - Run the frontend in development mode
- `npm run dev:server` - Run the backend in development mode
- `npm run install:all` - Install all dependencies (root, client, server)
- `npm run db:setup` - Initialize the database with demo data

## License

ISC
