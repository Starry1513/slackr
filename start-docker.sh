#!/bin/bash

# Stop and remove old container if it exists
docker stop slackr-app 2>/dev/null || true
docker rm slackr-app 2>/dev/null || true

# Build the image
docker build -t slackr .

# Run the Docker container
docker run -p 5005:5005 -p 3001:3001 --name slackr-app slackr

# # To run in detached mode instead:
# docker run -d -p 5005:5005 -p 3001:3001 --name slackr-app slackr

# # To check logs (if running in detached mode):
# docker logs -f slackr-app