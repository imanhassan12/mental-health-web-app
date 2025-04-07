#!/bin/bash

# Script to update passwords from bcrypt to argon2 inside the Docker container

# Make the script executable
chmod +x update-argon2-passwords.js

# Execute the script inside the Docker container
echo "Running password update script in Docker container..."
cd ..
docker exec -it mental_health_backend node /app/update-argon2-passwords.js

echo "Done!" 