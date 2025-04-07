FROM node:18-alpine

WORKDIR /app

# Install MariaDB client and build tools needed for Argon2
RUN apk add --no-cache mariadb-client python3 make g++ gcc musl-dev linux-headers

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Set environment variables for proper native module builds
ENV npm_config_build_from_source=true
# These are helpful for ARM Mac builds
ENV npm_config_target_arch=arm64

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 4000

# Command to run the application
CMD ["npm", "run", "dev"] 