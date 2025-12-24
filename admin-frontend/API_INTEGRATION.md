# API Integration Guide

This document provides detailed examples for integrating the admin frontend with your existing backend.

## Required Backend Endpoints

### 1. Authentication

#### POST `/api/admin/login`
Login endpoint that returns a JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

**Example Implementation (Express.js):**
```javascript
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Find admin user
  const admin = await db.query(
    'SELECT * FROM admin_users WHERE email = ?',
    [email]
  );
  
  if (!admin || !await bcrypt.compare(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({ token });
});
```

### 2. Dashboard Statistics

#### GET `/api/dashboard/stats`
Returns dashboard statistics.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalTickets": 150,
  "totalRevenue": 75000,
  "ticketsUsed": 45
}
```

**Example Implementation:**
```javascript
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  // Total tickets
  const totalTickets = await db.query(
    'SELECT COUNT(*) as count FROM tickets'
  );
  
  // Total revenue
  const revenue = await db.query(
    'SELECT SUM(amount) as total FROM payments WHERE status = "completed"'
  );
  
  // Used tickets
  const usedTickets = await db.query(
    'SELECT COUNT(*) as count FROM tickets WHERE used = 1'
  );
  
  res.json({
    totalTickets: totalTickets[0].count,
    totalRevenue: revenue[0].total || 0,
    ticketsUsed: usedTickets[0].count
  });
});
```

### 3. Get Tickets

#### GET `/api/tickets`
Get all tickets with optional search and filter.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Search by name, phone, or reference_code
- `used` (optional): Filter by used status (true/false)

**Response:**
```json
{
  "tickets": [
    {
      "id": "1",
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "ticket_type": "VIP",
      "reference_code": "VBS2025-001",
      "used": false,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Example Implementation:**
```javascript
app.get('/api/tickets', requireAuth, async (req, res) => {
  const { search, used } = req.query;
  
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (name LIKE ? OR phone LIKE ? OR reference_code LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  if (used !== undefined) {
    query += ' AND used = ?';
    params.push(used === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const tickets = await db.query(query, params);
  res.json({ tickets });
});
```

### 4. Update Ticket Status

#### PATCH `/api/tickets/:id`
Update ticket used status.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "used": true
}
```

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "1",
    "used": true
  }
}
```

**Example Implementation:**
```javascript
app.patch('/api/tickets/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { used } = req.body;
  
  await db.query(
    'UPDATE tickets SET used = ? WHERE id = ?',
    [used ? 1 : 0, id]
  );
  
  const ticket = await db.query(
    'SELECT * FROM tickets WHERE id = ?',
    [id]
  );
  
  res.json({ success: true, ticket: ticket[0] });
});
```

### 5. Export Endpoints

#### GET `/api/tickets/export/names`
Export all ticket holder names.

**Response:**
```json
[
  { "name": "John Doe" },
  { "name": "Jane Smith" }
]
```

**Example Implementation:**
```javascript
app.get('/api/tickets/export/names', requireAuth, async (req, res) => {
  const tickets = await db.query('SELECT name FROM tickets');
  res.json(tickets.map(t => ({ name: t.name })));
});
```

#### GET `/api/tickets/export/phones`
Export all phone numbers.

**Response:**
```json
[
  { "phone": "+1234567890" },
  { "phone": "+0987654321" }
]
```

#### GET `/api/tickets/export/csv`
Export full ticket data as CSV.

**Response Headers:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="tickets.csv"
```

**Response Body:**
```csv
id,name,phone,email,ticket_type,reference_code,used,created_at
1,John Doe,+1234567890,john@example.com,VIP,VBS2025-001,false,2025-01-15T10:30:00Z
```

**Example Implementation:**
```javascript
app.get('/api/tickets/export/csv', requireAuth, async (req, res) => {
  const tickets = await db.query('SELECT * FROM tickets');
  
  // Convert to CSV
  const headers = ['id', 'name', 'phone', 'email', 'ticket_type', 'reference_code', 'used', 'created_at'];
  const csv = [
    headers.join(','),
    ...tickets.map(t => [
      t.id,
      `"${t.name}"`,
      t.phone,
      t.email,
      t.ticket_type,
      t.reference_code,
      t.used ? 'true' : 'false',
      t.created_at
    ].join(','))
  ].join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
  res.send(csv);
});
```

## Authentication Middleware

Create a middleware to protect routes:

```javascript
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## CORS Configuration

Enable CORS for your frontend domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

## Database Queries Examples

### SQLite
```javascript
const db = require('better-sqlite3')('database.db');

// Get tickets
const tickets = db.prepare('SELECT * FROM tickets').all();

// Update ticket
db.prepare('UPDATE tickets SET used = ? WHERE id = ?').run(used, id);
```

### PostgreSQL
```javascript
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get tickets
const result = await pool.query('SELECT * FROM tickets');
const tickets = result.rows;
```

### MySQL
```javascript
const mysql = require('mysql2/promise');
const pool = mysql.createPool({ /* config */ });

// Get tickets
const [tickets] = await pool.execute('SELECT * FROM tickets');
```

## Error Handling

Always return consistent error responses:

```javascript
// Success
res.json({ data: result });

// Error
res.status(400).json({ error: 'Error message' });
```

## Testing Your API

Use these curl commands to test:

```bash
# Login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get tickets (replace TOKEN with actual token)
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer TOKEN"

# Update ticket
curl -X PATCH http://localhost:3000/api/tickets/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"used":true}'
```

