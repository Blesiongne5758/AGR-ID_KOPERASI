/**
 * AGR-ID Integration Server
 * Entry point untuk aplikasi backend integrasi AGR-ID
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const syncRoutes = require('./routes/sync');
const { initScheduler } = require('./scheduler/agridSyncScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AGR-ID Integration Server',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AGR-ID Integration Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/v1/sync/agrid': 'Trigger full sync ke AGR-ID',
      'GET /api/v1/sync/history': 'Get sync history',
      'GET /health': 'Health check',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] AGR-ID Integration Server running on port ${PORT}`);
  
  // Initialize scheduler
  initScheduler();
  
  console.log('[Server] Ready to accept requests');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  const { stopScheduler } = require('./scheduler/agridSyncScheduler');
  stopScheduler();
  process.exit(0);
});

module.exports = app;
