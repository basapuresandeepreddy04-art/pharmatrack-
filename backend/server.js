require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Serve the built React frontend (single-port unified app) ──
// frontend/dist only exists after `npm run build`. In local dev,
// run the frontend separately on :3000 (its Vite proxy points
// here) — this block is what makes the single Render.com /
// production deployment work on one port.
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('ℹ️  frontend/dist not found — run "npm run build" in /frontend to enable single-port serving.');
}

// ── 404 handler (API routes only reach here) ───────────────────
app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 API docs: http://localhost:${PORT}/api/health`);
  });
};

start();
