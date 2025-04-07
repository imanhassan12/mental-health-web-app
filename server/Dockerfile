FROM node:18-alpine

WORKDIR /app

# Install MariaDB client and build tools for bcrypt
RUN apk add --no-cache mariadb-client python3 make g++

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies with proper flags for bcrypt compilation
RUN npm install --build-from-source bcrypt && npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 4000

# Command to run the application
CMD ["npm", "run", "dev"] 