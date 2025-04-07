#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}Mental Health Practitioner Aide - Setup Script${NC}"
echo -e "${BLUE}===============================================${NC}"
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    echo -e "Please install Docker first:"
    echo -e "  - Mac: ${BLUE}https://docs.docker.com/desktop/install/mac-install/${NC}"
    echo -e "  - Windows: ${BLUE}https://docs.docker.com/desktop/install/windows-install/${NC}"
    echo -e "  - Linux: ${BLUE}https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running.${NC}"
    echo -e "Please start Docker Desktop (Mac/Windows) or the Docker service (Linux) and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose is not installed.${NC}"
    echo
    
    # Check operating system
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo -e "For macOS, you can install Docker Compose using Homebrew:"
        echo -e "${BLUE}brew install docker-compose${NC}"
        echo
        read -p "Would you like to install Docker Compose using Homebrew now? (y/n): " install_choice
        if [[ $install_choice == "y" || $install_choice == "Y" ]]; then
            echo "Installing Docker Compose..."
            brew install docker-compose
            if [ $? -ne 0 ]; then
                echo -e "${RED}Failed to install Docker Compose.${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}Skipping Docker Compose installation. Please install it manually.${NC}"
            exit 1
        fi
    else
        # Linux or other OS
        echo -e "To install Docker Compose on Linux, run the following commands:"
        echo -e "${BLUE}sudo curl -SL https://github.com/docker/compose/releases/download/v2.34.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose${NC}"
        echo -e "${BLUE}sudo chmod +x /usr/local/bin/docker-compose${NC}"
        echo
        echo -e "For more details, visit: ${BLUE}https://docs.docker.com/compose/install/linux/${NC}"
        echo
        echo -e "Once installed, run this setup script again."
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database Configuration
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=mental_health_db
DB_HOST=mysql
DB_DIALECT=mysql

# Backend Configuration
NODE_ENV=development
PORT=4000
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h

# Frontend Configuration
REACT_APP_API_URL=http://localhost:4000

# Docker Configuration (used by docker-compose)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=mental_health_db
MYSQL_USER=user
MYSQL_PASSWORD=password
EOL
    echo -e "${GREEN}Created .env file with default configuration.${NC}"
else
    echo -e "${YELLOW}Using existing .env file.${NC}"
fi

# Build and start the application
echo
echo -e "${BLUE}Building and starting the application...${NC}"
echo "This may take a few minutes to download Docker images and build containers."
echo

docker-compose build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build containers. See error above.${NC}"
    exit 1
fi

docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start containers. See error above.${NC}"
    exit 1
fi

echo
echo -e "${GREEN}Setup complete!${NC}"
echo -e "Your Mental Health Practitioner Aide application is now running."
echo
echo -e "Access the application at: ${BLUE}http://localhost:3000${NC}"
echo -e "Backend API is available at: ${BLUE}http://localhost:4000${NC}"
echo -e "PhpMyAdmin is available at: ${BLUE}http://localhost:8080${NC}"
echo
echo -e "${YELLOW}Demo Login Credentials:${NC}"
echo -e "Username: ${BLUE}jsmith${NC}"
echo -e "Password: ${BLUE}password123${NC}"
echo
echo -e "To stop the application: ${BLUE}npm run stop${NC} or ${BLUE}docker-compose down${NC}"
echo -e "To view logs: ${BLUE}docker-compose logs -f${NC}"
echo
echo -e "${GREEN}Happy coding!${NC}" 