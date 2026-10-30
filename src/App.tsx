import { useState } from 'react';
import { Copy, Check, Code2, Shield, Lock, Key } from 'lucide-react';

const nodejsCode = `const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
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
    const userQuery = \`
      SELECT 
        u.id AS user_id,
        u.member_id,
        u.password_hash,
        u.full_name
      FROM users u
      WHERE u.member_id = $1
    \`;
    
    const userResult = await pool.query(userQuery, [member_id]);

    if (userResult.rows.length === 0) {
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
    const membershipQuery = \`
      SELECT 
        m.cooperative_id,
        m.role,
        c.name AS cooperative_name,
        c.coop_code
      FROM memberships m
      INNER JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE m.user_id = $1 AND m.status = 'ACTIVE'
      LIMIT 1
    \`;
    
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

// Apply middleware to protected routes
router.use(verifyTokenAndCoop);

// Protected route example
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = router;`;

function highlightJS(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  // Strings
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(nodejsCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = nodejsCode.split('\n');
  const displayLines = showCode ? lines : lines.slice(0, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/20">
              <Code2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            REST API Authentication
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Node.js + Express.js Implementation dengan JWT & Multi-Tenant Isolation
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <code className="text-green-400 text-sm">
              POST /api/v1/auth/login
            </code>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Lock, title: 'bcrypt Password', desc: 'Hashing dengan 12 rounds', color: 'text-green-400', bg: 'bg-green-500/10' },
            { icon: Key, title: 'JWT Token', desc: 'Payload: user_id, coop_id, role', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Shield, title: 'Multi-Tenant', desc: 'x-coop-id header validation', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Code2, title: 'Express.js', desc: 'Production-ready middleware', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* JWT Payload Structure */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🎫 JWT Token Payload</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">Token Structure</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "cooperative_name": "Koperasi AGRID Sejahtera",
  "coop_code": "AGR",
  "role": "MEMBER",
  "iat": 1704067200,
  "exp": 1704153600,
  "iss": "koperasi-digital",
  "aud": "koperasi-api"
}`}</code>
            </pre>
          </div>
        </div>

        {/* Usage Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🚀 Usage Example</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">cURL Request</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`# Login
curl -X POST http://localhost:3000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "member_id": "AGR-2024-000001",
    "password": "secret123"
  }'

# Response:
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}

# Protected Route (dengan middleware)
curl -X GET http://localhost:3000/api/v1/auth/me \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \\
  -H "x-coop-id: 987fcdeb-51a2-43d7-9012-3456789abcde"

# Response:
{
  "success": true,
  "data": {
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "member_id": "AGR-2024-000001",
      "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
      "role": "MEMBER"
    }
  }
}`}</code>
            </pre>
          </div>
        </div>

        {/* Code Display */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-green-400" />
            Implementation Code
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">auth_api.js</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 hover:bg-green-500/30 transition-colors"
                >
                  {showCode ? '▼ Collapse' : `▶ Show Full (${lines.length} lines)`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <pre className="p-4 text-xs font-mono leading-relaxed">
                <code>
                  {displayLines.map((line, i) => (
                    <div key={i} className="flex hover:bg-white/5 transition-colors">
                      <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">{i + 1}</span>
                      <span
                        className="flex-1"
                        dangerouslySetInnerHTML={{ __html: highlightJS(line) }}
                      />
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {!showCode && lines.length > 100 && (
              <div className="border-t border-white/10 p-4 text-center">
                <button
                  onClick={() => setShowCode(true)}
                  className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
                >
                  Lihat {lines.length - 100} baris lainnya
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
