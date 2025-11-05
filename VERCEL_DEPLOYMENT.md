# Vercel Deployment Guide

This guide explains how to develop and deploy Slackr to Vercel.

## Quick Start

### 1. Initial Setup

Run the setup script once to configure Vercel:

```bash
./setup-vercel.sh
```

This will:
- Install Vercel CLI (if not already installed)
- Authenticate with Vercel
- Link your project to Vercel
- Install dependencies

### 2. Local Development with Vercel

To develop locally with Vercel's production environment simulation:

```bash
./start-vercel-dev
```

Or directly:
```bash
vercel dev
```

This runs your app at `http://localhost:3000` (default Vercel port).

### 3. Deploy

#### Preview Deployment (recommended for testing)
```bash
./deploy-vercel.sh
```

This creates a unique preview URL that you can share for testing.

#### Production Deployment
```bash
./deploy-vercel.sh --prod
```

This deploys to your production domain.

## Project Structure for Vercel

```
slackr/
├── vercel.json              # Vercel configuration
├── .vercelignore            # Files to ignore during deployment
├── setup-vercel.sh          # Initial setup script
├── deploy-vercel.sh         # Deployment script
├── start-vercel-dev         # Local dev with Vercel
├── backend/
│   └── src/
│       └── server.js        # Express app (runs as serverless)
└── frontend/
    ├── index.html           # Entry point
    └── src/                 # Frontend assets
```

## How It Works

### Backend (Serverless)
- Your Express app (`backend/src/server.js`) runs as a serverless function
- Each request spawns a serverless instance
- Database persistence requires external storage (see Environment Variables)

### Frontend (Static)
- Static files served via Vercel's CDN
- HTML, CSS, JS files automatically optimized

### Routing
The `vercel.json` configuration routes:
- `/api/*` → Backend serverless function
- `/auth/*`, `/user/*`, `/channel/*`, `/message/*` → Backend
- Static assets → Frontend files
- All other routes → `frontend/index.html` (SPA routing)

## Environment Variables

To set environment variables for production:

```bash
vercel env add VARIABLE_NAME
```

Common variables you might need:
- `NODE_ENV` - Already set to "production"
- `DATABASE_URL` - If using external database
- `JWT_SECRET` - For authentication tokens

List all environment variables:
```bash
vercel env ls
```

## Useful Commands

```bash
# View all deployments
vercel ls

# View deployment logs
vercel logs

# Manage domains
vercel domains

# Remove a deployment
vercel rm [deployment-url]

# Open project in Vercel dashboard
vercel inspect

# Pull environment variables locally
vercel env pull
```

## Troubleshooting

### Build Fails
- Check `vercel logs` for error details
- Ensure all dependencies are in `package.json`
- Verify `vercel.json` paths are correct

### Serverless Function Timeout
- Vercel has a 10-second timeout for serverless functions (hobby plan)
- Optimize long-running operations
- Consider upgrading plan for longer timeouts

### Database Issues
- The local `database.json` won't persist on Vercel (serverless is stateless)
- Use external database services:
  - MongoDB Atlas
  - PostgreSQL (Vercel Postgres)
  - Redis (Vercel KV)

### CORS Errors
- Update CORS configuration in `backend/src/server.js`
- Allow your Vercel domain in CORS origins

## Testing Before Production

Always test with preview deployments:

1. Deploy preview: `./deploy-vercel.sh`
2. Test the preview URL thoroughly
3. If everything works: `./deploy-vercel.sh --prod`

## Custom Domain

To add a custom domain:

```bash
vercel domains add yourdomain.com
```

Follow the prompts to configure DNS settings.

## CI/CD with GitHub

Link your GitHub repository to Vercel for automatic deployments:

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Every push to `main` → Production deployment
4. Every PR → Preview deployment with unique URL

## Cost Considerations

Vercel offers:
- **Hobby Plan (Free)**: Good for personal projects
  - Unlimited deployments
  - 100GB bandwidth/month
  - Serverless function execution limits

- **Pro Plan**: For production apps
  - More bandwidth
  - Longer function timeouts
  - Team collaboration features

## Support

For issues:
- Vercel Documentation: https://vercel.com/docs
- Vercel CLI Help: `vercel --help`
- This project: Check the main README.md

---

Happy deploying!
