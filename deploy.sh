#!/bin/bash

# Check if container name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 container-name"
    echo "Example: $0 bookrank-prod"
    exit 1
fi

# Configuration
DROPLET_IP="138.197.107.114"
DROPLET_USER="ryanbrown"
CONTAINER_NAME="$1"  # Use the first command line argument
LOCAL_APP_PATH="."
REMOTE_APP_PATH="~/app"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[*] $1${NC}"
}

print_error() {
    echo -e "${RED}[!] $1${NC}"
    exit 1
}

# 1. Sync files to droplet
print_status "Syncing files to droplet..."
rsync -av --delete \
    --exclude='static' \
    --exclude='node_modules' \
    --exclude='build' \
    ${LOCAL_APP_PATH}/{djangoapp,react-app,gunicorn,nginx,ssl,dockerfile,entrypoint.sh} \
    ${DROPLET_USER}@${DROPLET_IP}:${REMOTE_APP_PATH}/ || print_error "Failed to sync files"

# 2 & 3 & 4. SSH into droplet and execute commands
print_status "Configuring nginx and building/running Docker container..."
ssh ${DROPLET_USER}@${DROPLET_IP} << EOF
    # Update nginx config
    sed -i '2s/^/# /; 7s/^/# /; 3,5s/^#[[:space:]]*//; 8s/^#[[:space:]]*//' ~/app/nginx/bookrank || exit 1

    cd ~/app || exit 1

    # Stop and remove existing container if it exists
    if [ "\$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
        echo "Stopping existing container..."
        docker stop ${CONTAINER_NAME}
        # docker rm ${CONTAINER_NAME}
    fi

    # Build new container
    echo "Building new container image..."
    docker build -t ${CONTAINER_NAME}-image . || exit 1

    # Run new container
    echo "Starting new container..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p 80:80 \
        -p 443:443 \
        ${CONTAINER_NAME}-image || exit 1

    # Verify container is running
    if [ "\$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
        echo "Container successfully started!"
    else
        echo "Container failed to start!"
        exit 1
    fi
EOF

# Check if deployment was successful
if [ $? -eq 0 ]; then
    print_status "Deployment completed successfully!"
else
    print_error "Deployment failed!"
fi