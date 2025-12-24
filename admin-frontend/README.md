# Admin Frontend - Ticketing System

A modern, mobile-friendly admin panel for managing tickets built with React + Vite.

## Features

- ✅ Secure admin login
- ✅ Dashboard with statistics (total tickets, revenue, used tickets)
- ✅ Tickets table with search and filters
- ✅ Mark tickets as used/unused
- ✅ Export functionality:
  - Export all names (TXT)
  - Export all phone numbers (TXT)
  - Export full ticket data (CSV)
- ✅ Mobile-responsive design

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Day.js** - Date formatting

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your backend API URL:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## API Integration

The frontend expects the following API endpoints:

### Authentication
- `POST /admin/login` - Login with email and password
  - Request: `{ email: string, password: string }`
  - Response: `{ token: string }`
- `POST /admin/logout` - Logout
- `GET /admin/me` - Get current admin user

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
  - Response: `{ totalTickets: number, totalRevenue: number, ticketsUsed: number }`

### Tickets
- `GET /tickets` - Get all tickets
  - Query params: `search?: string, used?: boolean`
  - Response: `{ tickets: Ticket[] }`
- `GET /tickets/:id` - Get ticket by ID
- `PATCH /tickets/:id` - Update ticket status
  - Request: `{ used: boolean }`
- `GET /tickets/export/names` - Export all names
- `GET /tickets/export/phones` - Export all phone numbers
- `GET /tickets/export/csv` - Export full CSV (returns blob)

### Ticket Data Structure
```typescript
interface Ticket {
  id: string;
  name: string;
  phone: string;
  email: string;
  ticket_type: string;
  reference_code: string;
  used: boolean;
  created_at: string;
}
```

## Backend Requirements

Your backend should:

1. **Handle CORS** - Allow requests from your frontend domain
2. **Authentication** - Use JWT tokens or session-based auth
3. **Protect routes** - Require authentication for admin endpoints
4. **Return proper responses** - Follow the API structure above

### Example Backend Route (Express.js)
```javascript
// Login endpoint
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  // Validate credentials
  // Return token
  res.json({ token: 'your-jwt-token' });
});

// Dashboard stats
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  const totalTickets = await db.tickets.count();
  const totalRevenue = await db.payments.sum('amount');
  const ticketsUsed = await db.tickets.count({ where: { used: true } });
  
  res.json({ totalTickets, totalRevenue, ticketsUsed });
});

// Get tickets
app.get('/api/tickets', requireAuth, async (req, res) => {
  const { search, used } = req.query;
  // Build query with filters
  const tickets = await db.tickets.findMany(/* ... */);
  res.json({ tickets });
});
```

## Deployment

### Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your Git repository

3. Environment variables:
   - Add `VITE_API_BASE_URL` in Netlify dashboard

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Environment variables:
   - Add `VITE_API_BASE_URL` in Vercel dashboard

### GitHub Pages

1. Install `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```

2. Add to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout.tsx   # Main layout with sidebar
│   │   └── ProtectedRoute.tsx
│   ├── pages/          # Page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   └── Tickets.tsx
│   ├── lib/            # Utilities
│   │   └── api.ts      # API client
│   ├── store/          # State management
│   │   └── authStore.ts
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── .env.example        # Environment variables template
└── package.json
```

## Customization

### Change Colors
Edit `tailwind.config.js` to customize the color scheme.

### Add More Export Options
Extend `ticketsAPI` in `src/lib/api.ts` and add buttons in `Tickets.tsx`.

### Modify Dashboard Stats
Update `Dashboard.tsx` to add more stat cards or change the data displayed.

## Troubleshooting

### API Connection Issues
- Check `VITE_API_BASE_URL` in `.env`
- Verify CORS is enabled on your backend
- Check browser console for errors

### Authentication Not Working
- Verify token is being stored in localStorage
- Check backend returns token in correct format
- Ensure `Authorization` header is being sent

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires Node 18+)

## License

MIT
