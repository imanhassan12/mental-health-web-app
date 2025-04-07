# Docker Setup for Mental Health Web App

This document outlines the Docker setup created for the Mental Health Practitioner Aide web application.

## Overview

The application is containerized using Docker and can be run with Docker Compose. The setup includes:

1. **MySQL Database**: Stores all application data
2. **phpMyAdmin**: Web interface for database management
3. **Backend Server**: Node.js/Express API
4. **Frontend**: React application

## Prerequisites

### Docker
- **Mac**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### Docker Compose
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

## Files Created/Modified

### 1. `docker-compose.yml`
The main configuration file that defines all services, networks, and volumes.

- **MySQL**: Uses the official MySQL 8.0 image with data persistence
- **phpMyAdmin**: Web interface for database management
- **Backend**: Built from a custom Dockerfile in the server directory
- **Frontend**: Built from a custom Dockerfile in the client directory

### 2. `server/Dockerfile`
Defines how to build the backend container:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

### 3. `client/Dockerfile`
Defines how to build the frontend container:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 4. `.env.example`
Template for environment variables:

```
# Database Configuration
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=mental_health_db
DB_HOST=mysql
DB_DIALECT=mysql

# Backend Configuration
NODE_ENV=development
PORT=4000
JWT_SECRET=YourSuperSecretKeyForJWT
JWT_EXPIRES_IN=24h

# Frontend Configuration
REACT_APP_API_URL=http://localhost:4000

# Docker Configuration (used by docker-compose)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=mental_health_db
MYSQL_USER=user
MYSQL_PASSWORD=password
```

### 5. `setup.sh`
A script to automate the setup process:

- Checks for Docker and Docker Compose
- Assists with installing Docker Compose if needed
- Creates a .env file with default settings
- Builds and starts the application

### 6. Root-level `package.json`
Added convenience scripts for managing the application:

```json
{
  "scripts": {
    "start": "docker-compose up -d",
    "stop": "docker-compose down",
    "restart": "docker-compose restart",
    "logs": "docker-compose logs -f",
    "clean": "docker-compose down -v",
    "build": "docker-compose build",
    "install:all": "npm install && cd client && npm install && cd ../server && npm install",
    "dev:client": "cd client && npm start",
    "dev:server": "cd server && npm run dev",
    "db:setup": "cd server && npm run db:demo-setup"
  }
}
```

### 7. Updated Database Configuration
Modified `server/config/database.js` to use `DB_NAME` instead of `DB_DATABASE`.

### 8. `.gitignore`
Added entries for Docker-specific files and directories.

## Environment Variables

The application uses environment variables for configuration. Default values are provided in the `docker-compose.yml` file, but can be overridden by creating a `.env` file.

## Running the Application

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mental-health-web-app
   ```

2. **Using the setup script**:
   ```bash
   ./setup.sh
   ```

3. **Or manually**:
   ```bash
   # Copy the example .env file
   cp .env.example .env
   # Edit .env if needed
   
   # Start the application
   docker-compose up -d
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - phpMyAdmin: http://localhost:8080 (Server: mysql, Username: user, Password: password)

## Using phpMyAdmin

phpMyAdmin provides a web interface for managing your MySQL database. It's configured as part of the Docker Compose setup and accessible at http://localhost:8080.

### Login Credentials

When accessing phpMyAdmin, use the following connection details:

- **Server**: `mysql` (the service name in docker-compose.yml)
  - *Important*: Do not use `localhost` here, as phpMyAdmin needs to connect to the MySQL container over the Docker network
  
- **Username**: 
  - Regular user: `user` (defined by MYSQL_USER in docker-compose.yml)
  - Admin user: `root` (for full database access)
  
- **Password**:
  - For regular user: `password` (defined by MYSQL_PASSWORD)
  - For root user: `rootpassword` (defined by MYSQL_ROOT_PASSWORD)

### Key Features of phpMyAdmin

- Browse and search your databases
- Create, copy, drop, rename and alter databases, tables, fields and indexes
- Execute SQL statements/queries
- Import data from CSV and SQL files
- Export data to various formats (CSV, SQL, XML, PDF, etc.)
- Manage stored procedures and triggers

### Troubleshooting phpMyAdmin Connection Issues

If you encounter the error "mysqli::real_connect(): (HY000/2002): No such file or directory" or cannot log in:

1. **Verify MySQL container is running**:
   ```bash
   docker ps | grep mental_health_db
   ```

2. **Check MySQL container logs**:
   ```bash
   docker logs mental_health_db
   ```

3. **Ensure correct service name**:
   - In the phpMyAdmin login screen, enter `mysql` as the server name (not `localhost`)
   
4. **Check network connectivity**:
   ```bash
   docker network inspect mental-health-network
   ```
   
5. **Try restarting the containers**:
   ```bash
   docker-compose restart
   ```

6. **Verify the credentials match your configuration**:
   - If you modified the default credentials in your `.env` file, use those instead of the defaults

## Database Initialization

The database is automatically initialized on startup with demo data. The process is handled by:
1. `db-setup.js`: Creates the database if it doesn't exist
2. Sequelize migrations: Set up the database schema
3. `full-demo-setup.js`: Populates the database with demo data

## Login Credentials

After initialization, you can log in with:
- Username: `jsmith`, Password: `password123`
- Username: `mjohnson`, Password: `password123`

## Troubleshooting

- **Port conflicts**: Make sure ports 3000, 4000, 3306, and 8080 are not in use.
- **Database connection issues**: Check that the database service is fully initialized.
- **Docker Compose not found**: Ensure Docker Compose is installed.
- **Docker not running**: Start the Docker daemon before running the application.

## Clean Up

To completely remove the application and its data:

```bash
npm run clean
# or
docker-compose down -v
``` 