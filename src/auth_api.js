const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// ============================================================================
// POST /api/v1/auth/login
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { member_id, password } = req.body;

    // Step 1: Validate input
    if (!member_id || !password) {
      return res.status(400).json({
        success: false,
        message: 'member_id dan password wajib diisi',
      });
    }

    // Step 2: Find user by member_id
    const userQuery = `
      SELECT 
        u.id AS user_id,
        u.member_id,
        u.password_hash,
        u.full_name
      FROM users u
      WHERE u.member_id = $1
    `;
    
    const userResult = await pool.query(userQuery, [member_id]);

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists (security best practice)
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = userResult.rows[0];

    // Step 3: Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Step 4: Get cooperative_id and role from memberships
    const membershipQuery = `
      SELECT 
        m.cooperative_id,
        m.role,
        c.name AS cooperative_name,
        c.coop_code
      FROM memberships m
      INNER JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE m.user_id = $1 AND m.status = 'ACTIVE'
      LIMIT 1
    `;
    
    const membershipResult = await pool.query(membershipQuery, [user.user_id]);

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Akun tidak memiliki keanggotaan aktif',
      });
    }

    const membership = membershipResult.rows[0];

    // Step 5: Generate JWT token
    const tokenPayload = {
      user_id: user.user_id,
      member_id: user.member_id,
      cooperative_id: membership.cooperative_id,
      cooperative_name: membership.cooperative_name,
      coop_code: membership.coop_code,
      role: membership.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'koperasi-digital',
      audience: 'koperasi-api',
    });

    // Step 6: Update last_login_at
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.user_id]
    );

    // Step 7: Return response
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
          role: membership.role,
        },
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ============================================================================
// Middleware: verifyTokenAndCoop
// ============================================================================
const verifyTokenAndCoop = (req, res, next) => {
  try {
    // Step 1: Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header tidak valid',
      });
    }

    const token = authHeader.substring(7);

    // Step 2: Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'koperasi-digital',
        audience: 'koperasi-api',
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah kedaluwarsa',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid',
      });
    }

    // Step 3: Get x-coop-id from header
    const coopIdHeader = req.headers['x-coop-id'];

    if (!coopIdHeader) {
      return res.status(400).json({
        success: false,
        message: 'Header x-coop-id wajib disertakan',
      });
    }

    // Step 4: Validate cooperative_id matches JWT
    if (decoded.cooperative_id !== coopIdHeader) {
      return res.status(403).json({
        success: false,
        message: 'Cooperative ID tidak sesuai dengan token',
      });
    }

    // Step 5: Attach user info to request
    req.user = {
      user_id: decoded.user_id,
      member_id: decoded.member_id,
      cooperative_id: decoded.cooperative_id,
      role: decoded.role,
    };

    next();

  } catch (error) {
    console.error('Middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// ============================================================================
// Example Protected Routes
// ============================================================================

// Apply middleware to protected routes
router.use(verifyTokenAndCoop);

// GET /api/v1/auth/me - Get current user info
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

// GET /api/v1/auth/members - Get members (isolated by cooperative)
router.get('/members', async (req, res) => {
  try {
    const cooperativeId = req.user.cooperative_id;

    const query = `
      SELECT 
        m.id,
        m.member_number,
        m.role,
        m.status,
        u.full_name,
        u.phone,
        u.email
      FROM memberships m
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.cooperative_id = $1
      ORDER BY m.join_date DESC
    `;

    const result = await pool.query(query, [cooperativeId]);

    res.json({
      success: true,
      data: {
        members: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;
