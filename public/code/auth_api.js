// ============================================================================
// REST API: Authentication & Authorization
// Senior Node.js Developer Implementation
// ============================================================================
// POST /api/v1/auth/login - Login endpoint dengan JWT token
// Middleware: verifyTokenAndCoop - Multi-tenant isolation
// ============================================================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

// ============================================================================
// POST /api/v1/auth/login
// ============================================================================
router.post('/login', async (req, res, next) => {
  try {
    // Step 1: Validate request body
    const { member_id, password } = req.body;

    if (!member_id || !password) {
      throw new BadRequestError('member_id dan password wajib diisi');
    }

    if (typeof member_id !== 'string' || member_id.trim() === '') {
      throw new BadRequestError('member_id harus berupa string');
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new BadRequestError('password minimal 6 karakter');
    }

    // Step 2: Find user by member_id
    const userQuery = `
      SELECT 
        u.id AS user_id,
        u.member_id,
        u.password_hash,
        u.full_name,
        u.is_verified,
        u.last_login_at
      FROM users u
      WHERE u.member_id = $1
    `;
    
    const userResult = await pool.query(userQuery, [member_id.trim().toUpperCase()]);

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not (security best practice)
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Step 3: Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Step 4: Get cooperative_id and role from memberships
    const membershipQuery = `
      SELECT 
        m.cooperative_id,
        m.role,
        m.status,
        c.name AS cooperative_name,
        c.coop_code,
        c.is_active AS cooperative_is_active
      FROM memberships m
      INNER JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE m.user_id = $1 AND m.status = 'ACTIVE'
      LIMIT 1
    `;
    
    const membershipResult = await pool.query(membershipQuery, [user.user_id]);

    if (membershipResult.rows.length === 0) {
      throw new ForbiddenError('Akun tidak memiliki keanggotaan aktif');
    }

    const membership = membershipResult.rows[0];

    // Step 5: Check if cooperative is active
    if (!membership.cooperative_is_active) {
      throw new ForbiddenError('Koperasi tidak aktif');
    }

    // Step 6: Generate JWT token
    const tokenPayload = {
      user_id: user.user_id,
      member_id: user.member_id,
      cooperative_id: membership.cooperative_id,
      cooperative_name: membership.cooperative_name,
      coop_code: membership.coop_code,
      role: membership.role,
      full_name: user.full_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'koperasi-digital',
      audience: 'koperasi-api',
    });

    // Step 7: Update last_login_at
    const updateQuery = `
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE id = $1
    `;
    await pool.query(updateQuery, [user.user_id]);

    // Step 8: Return response
    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          user_id: user.user_id,
          member_id: user.member_id,
          full_name: user.full_name,
          cooperative_id: membership.cooperative_id,
          cooperative_name: membership.cooperative_name,
          coop_code: membership.coop_code,
          role: membership.role,
        },
        expires_in: JWT_EXPIRES_IN,
      },
    });

  } catch (error) {
    // Pass error to error handler
    next(error);
  }
});

// ============================================================================
// Middleware: verifyTokenAndCoop
// ============================================================================
// Memastikan setiap request memiliki:
// 1. Valid JWT token di header Authorization
// 2. Header x-coop-id yang cocok dengan cooperative_id di JWT
// ============================================================================

const verifyTokenAndCoop = (req, res, next) => {
  try {
    // Step 1: Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header tidak ditemukan');
    }

    // Check format: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Format Authorization header tidak valid. Gunakan: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    if (!token || token.trim() === '') {
      throw new UnauthorizedError('Token tidak ditemukan');
    }

    // Step 2: Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'koperasi-digital',
        audience: 'koperasi-api',
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token sudah kedaluwarsa. Silakan login ulang.');
      }
      if (jwtError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Token tidak valid');
      }
      throw new UnauthorizedError('Verifikasi token gagal');
    }

    // Step 3: Get x-coop-id from header
    const coopIdHeader = req.headers['x-coop-id'];

    if (!coopIdHeader) {
      throw new BadRequestError('Header x-coop-id wajib disertakan');
    }

    if (typeof coopIdHeader !== 'string' || coopIdHeader.trim() === '') {
      throw new BadRequestError('Header x-coop-id tidak valid');
    }

    // Step 4: Validate cooperative_id matches JWT
    const tokenCoopId = decoded.cooperative_id;

    if (tokenCoopId !== coopIdHeader) {
      throw new ForbiddenError(
        'Cooperative ID tidak sesuai dengan token. Akses ditolak untuk isolasi data multi-tenant.'
      );
    }

    // Step 5: Attach user info to request object
    req.user = {
      user_id: decoded.user_id,
      member_id: decoded.member_id,
      cooperative_id: decoded.cooperative_id,
      cooperative_name: decoded.cooperative_name,
      coop_code: decoded.coop_code,
      role: decoded.role,
      full_name: decoded.full_name,
    };

    // Step 6: Continue to next middleware/route
    next();

  } catch (error) {
    // Pass error to error handler
    next(error);
  }
};

// ============================================================================
// Example Protected Routes
// ============================================================================

// Apply middleware to all routes below
router.use(verifyTokenAndCoop);

// GET /api/v1/auth/me - Get current user info
router.get('/me', async (req, res, next) => {
  try {
    // req.user sudah di-set oleh middleware verifyTokenAndCoop
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/members - Get members (isolated by cooperative)
router.get('/members', async (req, res, next) => {
  try {
    // req.user.cooperative_id sudah di-set oleh middleware
    const cooperativeId = req.user.cooperative_id;

    const query = `
      SELECT 
        m.id,
        m.member_number,
        m.role,
        m.status,
        m.join_date,
        u.full_name,
        u.phone,
        u.email
      FROM memberships m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.cooperative_id = $1
      ORDER BY m.join_date DESC
    `;

    const result = await pool.query(query, [cooperativeId]);

    res.status(200).json({
      success: true,
      data: {
        members: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/auth/savings - Create savings transaction (isolated by cooperative)
router.post('/savings', async (req, res, next) => {
  try {
    const { membership_id, type, amount } = req.body;
    const cooperativeId = req.user.cooperative_id;

    // Verify membership belongs to this cooperative
    const verifyQuery = `
      SELECT m.id 
      FROM memberships m
      WHERE m.id = $1 AND m.cooperative_id = $2
    `;
    
    const verifyResult = await pool.query(verifyQuery, [membership_id, cooperativeId]);

    if (verifyResult.rows.length === 0) {
      throw new ForbiddenError('Membership tidak ditemukan di koperasi ini');
    }

    // Process savings transaction...
    // (Implementation details omitted for brevity)

    res.status(201).json({
      success: true,
      message: 'Transaksi simpanan berhasil',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Error Handler Middleware
// ============================================================================

const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Operational errors (expected)
  if (err.isOperational) {
    console.error(`[API Error] ${statusCode}: ${message}`);
  } else {
    // Programming or unknown errors
    console.error('[ERROR]', err);
    message = 'Terjadi kesalahan pada server';
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Data sudah ada';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Data referensi tidak ditemukan';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = 'Database error';
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// ============================================================================
// Export
// ============================================================================

module.exports = {
  router,
  verifyTokenAndCoop,
  errorHandler,
};

// ============================================================================
// Usage Example (app.js)
// ============================================================================

/*
const express = require('express');
const { router, errorHandler } = require('./auth');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1/auth', router);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/
