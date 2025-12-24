# Deployment Guide for Render

## Backend Deployment on Render

### Step 1: Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `bonsuxc/vbs-ticketing`

### Step 2: Configure the Service

**Basic Settings:**
- **Name**: `vbs-admin-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`

**Build & Deploy:**
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`

### Step 3: Environment Variables

Add these in Render's Environment tab:

```
DATABASE_URL=file:./data.db
JWT_SECRET=your-secret-key-here
ADMIN_SESSION_SECRET=your-session-secret-here
ADMIN_FRONTEND_URL=https://your-frontend-url.netlify.app
PORT=4000
```

**Important**: 
- SQLite is used by default (works for development and small production deployments)
- For larger scale, you can optionally use PostgreSQL by changing the provider in `prisma/schema.prisma`

### Step 4: Database Migration

After first deploy, run migrations:

1. Go to your service's Shell tab in Render
2. Run: `npx prisma migrate deploy`

Or add this to your build command:
```
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

## Frontend Deployment on Netlify/Vercel

### Option 1: Netlify

1. Go to [Netlify](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect GitHub repo: `bonsuxc/vbs-ticketing`

**Build settings:**
- **Base directory**: `admin-panel/frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `admin-panel/frontend/dist`

**Environment variables:**
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

### Option 2: Vercel

1. Go to [Vercel](https://vercel.com)
2. "Add New Project" → Import `bonsuxc/vbs-ticketing`

**Build settings:**
- **Root Directory**: `admin-panel/frontend`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`

**Environment variables:**
```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

## Troubleshooting

### Render Build Fails

If you see "package.json not found":
- Check that **Root Directory** is set to `backend` (not `admin-panel/backend`)
- Verify the path in your repository

### Database Connection Issues

- Make sure `DATABASE_URL` is set (SQLite format: `file:./data.db`)
- For persistent storage on Render, use a file path that persists
- Run migrations: `npx prisma migrate deploy`

### Frontend Can't Connect to Backend

- Set `VITE_API_BASE_URL` to your Render backend URL
- Make sure CORS is configured in backend
- Check that `ADMIN_FRONTEND_URL` matches your frontend URL

