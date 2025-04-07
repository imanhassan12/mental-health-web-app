FROM node:18-alpine

WORKDIR /app

# Install MariaDB client for database operations
RUN apk add --no-cache mariadb-client 

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 4000

# Command to run the application
CMD ["npm", "run", "dev"] 