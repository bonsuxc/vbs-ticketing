# VBS Ticketing Admin Panel

A mobile-first, production-ready admin panel for managing VBS (Vacation Bible School) ticketing system.

## Features

- ✅ Mobile-first responsive design
- ✅ Dashboard with real-time statistics
- ✅ Payment management with search and filters
- ✅ Ticket check-in system
- ✅ Activity logging
- ✅ CSV export functionality
- ✅ A4 printable tickets (4, 6, or 8 per page)
- ✅ Role-based authentication

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM with SQLite (easily switchable to Postgres)
- JWT authentication
- bcrypt for password hashing

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd admin-panel/backend
npm install
cp env.example .env
# Edit .env with your configuration
npx prisma migrate dev
npm run seed  # Optional: load sample data
npm run dev
```

### Frontend Setup

```bash
cd admin-panel/frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
PORT=4000
ADMIN_FRONTEND_URL="http://localhost:5173"
```

### Frontend (.env)
```
VITE_API_BASE_URL="http://localhost:4000/api"
```

## Default Admin Credentials

- **Super Admin**: `superadmin@vbs.com` / `SuperAdmin123!`
- **Ticket Manager**: `manager@vbs.com` / `TicketManager123!`

## Deployment

### Render (Backend)
1. Connect your GitHub repo
2. Set build command: `cd admin-panel/backend && npm install && npx prisma migrate deploy && npm run build`
3. Set start command: `cd admin-panel/backend && npm start`
4. Add environment variables

### Netlify/Vercel (Frontend)
1. Connect your GitHub repo
2. Set build command: `cd admin-panel/frontend && npm install && npm run build`
3. Set publish directory: `admin-panel/frontend/dist`
4. Add environment variables

## License

MIT

