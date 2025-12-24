# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd admin-frontend
npm install
```

### 2. Configure API URL
Create a `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```
Replace with your actual backend URL.

### 3. Run Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 📋 What You Get

✅ **Login Page** - Secure admin authentication  
✅ **Dashboard** - Statistics overview  
✅ **Tickets Table** - View and manage all tickets  
✅ **Search & Filter** - Find tickets quickly  
✅ **Mark Used/Unused** - Update ticket status  
✅ **Export Features** - Export names, phones, or full CSV  
✅ **Mobile Responsive** - Works on all devices  

## 🔌 Connect to Your Backend

The frontend expects these API endpoints:

- `POST /api/admin/login` - Login
- `GET /api/dashboard/stats` - Dashboard stats
- `GET /api/tickets` - Get tickets
- `PATCH /api/tickets/:id` - Update ticket
- `GET /api/tickets/export/*` - Export endpoints

See `API_INTEGRATION.md` for detailed examples.

## 📦 Build for Production

```bash
npm run build
```

Output will be in the `dist` folder.

## 🚢 Deploy

### Netlify
1. Build: `npm run build`
2. Drag `dist` folder to Netlify
3. Add `VITE_API_BASE_URL` in environment variables

### Vercel
```bash
npm i -g vercel
vercel
```

## 📚 Documentation

- `README.md` - Full documentation
- `API_INTEGRATION.md` - Backend integration guide

## 🆘 Need Help?

Check the browser console for errors. Common issues:

1. **CORS errors** - Enable CORS on your backend
2. **401 errors** - Check authentication token
3. **404 errors** - Verify API URL in `.env`

