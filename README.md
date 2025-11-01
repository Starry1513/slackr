# Slackr - A Slack Clone Application

A full-stack web application that replicates core Slack functionality, built as part of COMP6080 Web Frontend Programming.

## Features

- User authentication and authorization
- Real-time messaging
- Channel creation and management
- User profiles
- Message history
- Responsive UI
- Docker support for easy deployment

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **JWT** for authentication
- **JSON** file-based database
- **Morgan** for logging
- **Swagger UI** for API documentation

### Frontend
- **Vanilla JavaScript**
- **HTML5/CSS3**
- Responsive design

## Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **pnpm**
- **Docker** (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:Starry1513/slackr.git
cd slackr
```

2. Install backend dependencies:
```bash
cd backend
npm install
# or
pnpm install
```

3. Install frontend dependencies (if any):
```bash
cd ../frontend
npm install
# or
pnpm install
```

## Running the Application

### Option 1: Using the Start Script (Recommended)

The easiest way to run both frontend and backend:

```bash
./start
```

This will:
- Start the backend server on `http://localhost:5005`
- Start the frontend server on `http://localhost:3001`
- Clean the database on startup (use `--no-clean` to keep existing data)

**Options:**
```bash
./start --no-clean  # Skip database cleanup
./start --help      # Show help message
```

### Option 2: Using Docker

Build and run with Docker:

```bash
# Using the docker start script
./start-docker.sh

# Or manually
docker build -t slackr .
docker run -p 3001:3001 -p 5005:5005 slackr
```

### Option 3: Manual Setup

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npx serve frontend -p 3001
```

## Project Structure

```
slackr/
├── backend/          # Express backend server
│   ├── src/         # Source files
│   ├── test/        # Test files
│   └── package.json
├── frontend/        # Frontend application
│   ├── src/         # Source files
│   └── index.html
├── start            # Startup script
├── start-docker.sh  # Docker startup script
├── Dockerfile       # Docker configuration
└── README.md
```

## Development

### Backend Development

```bash
cd backend
npm start          # Start with nodemon (auto-reload)
npm test           # Run tests
npm run lint       # Run ESLint
npm run reset      # Reset database
npm run clear      # Clear database
```

### Environment Variables

- `FRONTEND_PORT` - Frontend server port (default: 3001)
- `BACKEND_PORT` - Backend server port (default: 5005)

## API Documentation

Once the backend is running, visit the Swagger UI documentation at:
```
http://localhost:5005/api-docs
```

## Testing

Run the test suite:
```bash
cd backend
npm test
```

## Contributing

This is an academic project for COMP6080 at UNSW.

## Assignment Context

This project is part of COMP6080 25T3 Web Frontend Programming assignment.

## License

This project is for educational purposes only.
