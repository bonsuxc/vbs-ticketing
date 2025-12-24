# 🚨 CRITICAL HANDOFF DOCUMENT - VBS Admin Panel

**If you're reading this, you're taking over this project. Read this entire document before making any changes.**

## 📋 Project Overview

**Project**: VBS (Vacation Bible School) Ticketing Admin Panel  
**Repository**: `bonsuxc/vbs-ticketing` on GitHub  
**Status**: Backend deployed to Render, Frontend ready for deployment  
**Last Updated**: December 2024

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite (default)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **State Management**: Zustand + React Query
- **Authentication**: Session-based with JWT tokens

### Project Structure
```
admin-panel/
├── backend/              # Express API server
│   ├── prisma/           # Database schema & migrations
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, error handling
│   │   ├── services/     # External services (email, etc.)
│   │   └── utils/        # Prisma client, helpers
│   └── package.json
├── frontend/             # React SPA
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # Reusable components
│   │   ├── layouts/      # Layout wrappers
│   │   ├── lib/          # API client, query client
│   │   └── hooks/        # Custom hooks (auth store)
│   └── package.json
└── render.yaml           # Render deployment config
```

## ✅ What's Been Completed

### Backend
- ✅ Prisma schema with all models (AdminUser, Ticket, Payment, ActivityLog, etc.)
- ✅ Authentication middleware (`requireAuth`)
- ✅ Dashboard stats endpoint (`/api/dashboard/stats`)
- ✅ Payments CRUD with search/filter (`/api/payments`)
- ✅ Check-in endpoint (`/api/checkin`)
- ✅ Activity logging (`/api/activity`)
- ✅ CSV export (`/api/export/payments/csv`)
- ✅ Error handling middleware
- ✅ CORS configured for frontend

### Frontend
- ✅ Mobile-first responsive design
- ✅ Dashboard with 4 summary cards (Total Tickets, Paid, Collected, Today)
- ✅ Payments table with search, filters, export
- ✅ Check-in page for ticket validation
- ✅ Activity log page
- ✅ Admin layout with mobile hamburger menu
- ✅ Print CSS for A4 tickets (4/6/8 per page)
- ✅ Protected routes with auth check
- ✅ API client with auto-redirect on 401

### Database Schema
- **Ticket Status**: `UNUSED` → `USED` (no pending states)
- **Payment Status**: Only `PAID` (tickets only exist after payment)
- **Payment Methods**: `MOMO`, `CASH`, `TRANSFER`
- **Activity Logging**: All admin actions are logged

## 🔑 Key Design Decisions

1. **No Pending States**: Tickets only exist after payment is confirmed. This simplifies the system.
2. **Mobile-First**: All UI is designed for phones first, desktop second.
3. **Activity Logging**: Every admin action (delete, check-in, etc.) is logged for audit.
4. **SQLite Default**: Uses SQLite for simplicity. Can be switched to PostgreSQL if needed.
5. **Session-Based Auth**: Uses cookies with JWT tokens, not just JWT in headers.

## 🚀 Deployment Status

### Backend (Render)
- **Status**: Deployed but may need database migration
- **URL**: Check Render dashboard
- **Root Directory**: `backend` (not `admin-panel/backend`)
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Database**: SQLite (default, file-based)

### Frontend (Not Deployed Yet)
- **Recommended**: Netlify or Vercel
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `frontend/dist`
- **Env Var**: `VITE_API_BASE_URL=https://your-backend.onrender.com/api`

## 🔧 Environment Variables

### Backend (.env)
```bash
DATABASE_URL="file:./data.db"  # SQLite database file
JWT_SECRET="generate-strong-secret"
ADMIN_SESSION_SECRET="generate-strong-secret"
ADMIN_FRONTEND_URL="https://your-frontend.netlify.app"
PORT=4000
```

### Frontend (.env)
```bash
VITE_API_BASE_URL="https://your-backend.onrender.com/api"
```

## 📝 Important Files to Know

### Backend
- `prisma/schema.prisma` - Database schema (DON'T modify without migration)
- `src/server.ts` - Main Express app entry point
- `src/middleware/auth.ts` - Authentication middleware
- `src/controllers/*.ts` - Business logic for each feature
- `src/routes/*.ts` - API route definitions

### Frontend
- `src/main.tsx` - App entry, routing setup
- `src/layouts/AdminLayout.tsx` - Main layout with mobile menu
- `src/lib/api.ts` - Axios client configuration
- `src/hooks/useAuthStore.ts` - Auth state management (Zustand)
- `src/index.css` - Includes print styles for A4 tickets

## 🐛 Known Issues / TODOs

1. **Database Migration**: After first Render deploy, run `npx prisma migrate deploy` in Render shell
2. **Auth Implementation**: Login/logout endpoints exist but may need implementation (check `src/routes/auth.routes.ts`)
3. **Seed Data**: Seed script exists but may need admin user creation
4. **Frontend Deployment**: Not deployed yet - needs Netlify/Vercel setup
5. **Email Notifications**: Nodemailer installed but not implemented
6. **Print Tickets**: Component exists but not integrated into Payments page yet

## 🧪 Testing Locally

### Backend
```bash
cd admin-panel/backend
npm install
cp env.example .env
# Edit .env with local values
npx prisma migrate dev
npm run dev  # Runs on http://localhost:4000
```

### Frontend
```bash
cd admin-panel/frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

## 🔄 Common Tasks

### Add a New API Endpoint
1. Create controller in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Import route in `backend/src/server.ts`
4. Add frontend API call in `frontend/src/lib/api.ts` (if needed)
5. Create frontend page/component if needed

### Update Database Schema
1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Commit the migration files
4. On Render: `npx prisma migrate deploy`

### Deploy Changes
1. Commit changes: `git add . && git commit -m "message"`
2. Push: `git push origin main`
3. Render auto-deploys on push
4. Frontend: Rebuild on Netlify/Vercel

## 📚 Key Dependencies

### Backend
- `express` - Web framework
- `prisma` + `@prisma/client` - ORM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens
- `zod` - Validation
- `dayjs` - Date handling

### Frontend
- `react` + `react-dom` - UI framework
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `axios` - HTTP client
- `tailwindcss` - Styling
- `qrcode` - QR code generation

## 🆘 If Something Breaks

1. **Build fails on Render**: Check Root Directory is `backend`, not `admin-panel/backend`
2. **Database errors**: Ensure `DATABASE_URL` is set correctly (SQLite: `file:./data.db`), run migrations
3. **Auth not working**: Check `ADMIN_SESSION_SECRET` and `JWT_SECRET` are set
4. **Frontend can't connect**: Verify `VITE_API_BASE_URL` matches backend URL
5. **CORS errors**: Check `ADMIN_FRONTEND_URL` in backend matches frontend URL

## 🎯 Next Steps (If Continuing Development)

1. Implement auth login/logout endpoints fully
2. Deploy frontend to Netlify/Vercel
3. Add email notifications for ticket confirmations
4. Integrate PrintTickets component into Payments page
5. Add ticket type filtering in Payments
6. Add date range picker for Payments filters
7. Create admin user management page
8. Add event management UI
9. Add ticket generation from admin panel
10. Add bulk operations (delete multiple, export filtered)

## 📞 Contact / Context

- **Original Developer**: AI Assistant (Claude/Cursor)
- **Project Purpose**: Church VBS ticketing system for managing paid tickets
- **Key Requirement**: Mobile-first, no pending states, tickets only after payment
- **Deployment**: Render (backend) + Netlify/Vercel (frontend)

## ⚠️ CRITICAL NOTES

1. **Never modify Prisma schema without creating a migration**
2. **Always test database changes locally before deploying**
3. **Keep mobile-first design in mind for all UI changes**
4. **Activity logging is mandatory - log all admin actions**
5. **Tickets only exist after payment - no pending states allowed**
6. **SQLite is the default database - works for most use cases**

---

**Good luck! The codebase is well-structured and documented. You should be able to continue seamlessly.**

