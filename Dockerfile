FROM node:18-alpine

# Install Python for serving frontend static files
RUN apk add --no-cache python3

# Set working directory
WORKDIR /app

# Copy backend package files
COPY ass3-backend/package*.json ./ass3-backend/

# Install backend dependencies
WORKDIR /app/ass3-backend
RUN npm install

# Copy backend source code
COPY ass3-backend/ ./

# Copy frontend files
WORKDIR /app
COPY frontend/ ./frontend/

# Expose ports
EXPOSE 5005 3001

# Create startup script to run both services
RUN echo '#!/bin/sh' > /app/start-services.sh && \
    echo 'cd /app/ass3-backend && node -r esm src/server.js &' >> /app/start-services.sh && \
    echo 'BACKEND_PID=$!' >> /app/start-services.sh && \
    echo 'cd /app/frontend && python3 -m http.server 3001 &' >> /app/start-services.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start-services.sh && \
    echo 'wait $BACKEND_PID $FRONTEND_PID' >> /app/start-services.sh && \
    chmod +x /app/start-services.sh

# Start both services
CMD ["/app/start-services.sh"]
