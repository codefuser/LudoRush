# Production Deployment Guide

## 1. Prerequisites
- Node.js >= 18.x (tested on Node v20/v24)
- npm >= 9.x

## 2. Deployment Topology
- **Frontend (Client)**: Deployed to static hosting such as **Vercel**, **Cloudflare Pages**, or **Netlify**.
- **Backend (Server)**: Deployed to persistent Node.js runtime supporting WebSockets (e.g. **Railway**, **Render**, **Fly.io**, or Docker container on VPS).
- **Database (Optional)**: Managed PostgreSQL (e.g. **Supabase**, **Neon**).

## 3. Environment Variables

### Backend (`server/.env`):
```env
PORT=4000
NODE_ENV=production
CLIENT_URL=https://your-ludo-rush-client.vercel.app

# Optional Supabase / Postgres integration:
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (`client/.env`):
```env
VITE_SERVER_URL=https://your-ludo-rush-server.up.railway.app
```

## 4. Build Commands
Run from the workspace root:
```bash
# 1. Install all monorepo dependencies
npm install

# 2. Build shared library
npm run build -w shared

# 3. Build server & client
npm run build -w server
npm run build -w client
```

## 5. Running in Production
```bash
# Start server
npm run start -w server
```
For the client, serve the `client/dist` directory using any static web server or CDN.
