import { useState } from 'react';

const nodejsCode = `// ============================================================================
// REST API: Authentication & Authorization
// Senior Node.js Developer Implementation
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
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;

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

    // Step 2: Find user by member_id
    const userQuery = \`
      SELECT 
        u.id AS user_id,
        u.member_id,
        u.password_hash,
        u.full_name,
        u.is_verified
      FROM users u
      WHERE u.member_id = $1
    \`;
    
    const userResult = await pool.query(userQuery, [member_id.trim().toUpperCase()]);

    if (userResult.rows.length === 0) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Step 3: Validate password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Step 4: Get cooperative_id and role from memberships
    const membershipQuery = \`
      SELECT 
        m.cooperative_id,
        m.role,
        m.status,
        c.name AS cooperative_name,
        c.coop_code
      FROM memberships m
      INNER JOIN cooperatives c ON m.cooperative_id = c.id
      WHERE m.user_id = $1 AND m.status = 'ACTIVE'
      LIMIT 1
    \`;
    
    const membershipResult = await pool.query(membershipQuery, [user.user_id]);

    if (membershipResult.rows.length === 0) {
      throw new ForbiddenError('Akun tidak memiliki keanggotaan aktif');
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
    next(error);
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
      throw new UnauthorizedError('Authorization header tidak valid');
    }

    const token = authHeader.substring(7);

    // Step 2: Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'koperasi-digital',
        audience: 'koperasi-api',
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token sudah kedaluwarsa');
      }
      throw new UnauthorizedError('Token tidak valid');
    }

    // Step 3: Get x-coop-id from header
    const coopIdHeader = req.headers['x-coop-id'];

    if (!coopIdHeader) {
      throw new BadRequestError('Header x-coop-id wajib disertakan');
    }

    // Step 4: Validate cooperative_id matches JWT
    if (decoded.cooperative_id !== coopIdHeader) {
      throw new ForbiddenError(
        'Cooperative ID tidak sesuai dengan token'
      );
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
    next(error);
  }
};

// Apply middleware to protected routes
router.use(verifyTokenAndCoop);

// Protected route example
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});`;

// Simple JavaScript syntax highlighter
function highlightJS(code: string) {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');

  // Strings
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/("[^"]*")/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports', 'class', 'extends', 'import', 'from'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Built-in objects
  const builtins = ['console', 'process', 'JSON', 'Error', 'Date', 'Math', 'Promise'];
  builtins.forEach(b => {
    const regex = new RegExp(`\\b(${b})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  // Functions
  highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\(/g, '<span class="text-blue-400">$1</span>(');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function NodejsCode() {
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(nodejsCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = nodejsCode.split('\n');
  const displayLines = showFullCode ? lines : lines.slice(0, 100);

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.998 24c-.321 0-.641-.084-.922-.247l-2.936-1.737c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.065-.037.15-.023.218.017l2.256 1.339c.082.045.197.045.272 0l8.795-5.076c.082-.047.134-.141.134-.238V6.921c0-.099-.053-.192-.137-.24l-8.791-5.072c-.081-.047-.189-.047-.271 0L3.075 6.68c-.084.05-.14.144-.14.244v10.15c0 .095.055.19.137.236l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787c0-.142.114-.253.256-.253h1.115c.139 0 .255.112.255.253v10.021c0 1.745-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.551l-2.307-1.328A1.85 1.85 0 0 1 1.5 17.07V6.921c0-.678.36-1.31.945-1.65L11.24.198c.56-.315 1.21-.315 1.77 0l8.795 5.073c.585.34.945.972.945 1.65v10.15c0 .678-.36 1.31-.945 1.65l-8.795 5.073c-.28.163-.598.247-.917.247z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">REST API Authentication — Node.js</h2>
          <p className="text-sm text-slate-400 mt-1">Senior Node.js Developer • Express.js • JWT • Multi-Tenant Isolation</p>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🔐', title: 'bcrypt Password', desc: 'Hashing dengan 12 rounds', color: 'from-green-500 to-emerald-500' },
          { icon: '🎫', title: 'JWT Token', desc: 'Payload: user_id, coop_id, role', color: 'from-blue-500 to-cyan-500' },
          { icon: '🛡️', title: 'Multi-Tenant', desc: 'x-coop-id header validation', color: 'from-purple-500 to-violet-500' },
          { icon: '⚡', title: 'Express.js', desc: 'Production-ready middleware', color: 'from-amber-500 to-orange-500' },
        ].map(feature => (
          <div key={feature.title} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.color}`} />
            <span className="text-xl block mb-2">{feature.icon}</span>
            <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
            <p className="text-xs text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* API Flow */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🔄</span> Alur Authentication
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: 1, label: 'Request Login', desc: 'POST /api/v1/auth/login', icon: '📤', detail: 'Body: { member_id, password }' },
            { step: 2, label: 'Validasi', desc: 'Cari user & verify password', icon: '✅', detail: 'bcrypt.compare() + DB query' },
            { step: 3, label: 'Generate JWT', desc: 'Token dengan payload lengkap', icon: '🎫', detail: 'user_id, coop_id, role' },
            { step: 4, label: 'Response', desc: 'Return token + user info', icon: '📥', detail: '200 OK + JSON response' },
          ].map(item => (
            <div key={item.step} className="relative p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs font-bold text-green-400">
                {item.step}
              </div>
              <span className="text-2xl block mb-2">{item.icon}</span>
              <h4 className="text-sm font-semibold text-white mb-1">{item.label}</h4>
              <p className="text-xs text-slate-400 mb-2">{item.desc}</p>
              <p className="text-[10px] text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">auth_api.js</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">Node.js 20+</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 hover:bg-green-500/30 transition-colors"
            >
              {showFullCode ? '▼ Collapse' : `▶ Show Full (${lines.length} lines)`}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
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

        {!showFullCode && lines.length > 100 && (
          <div className="border-t border-white/10 p-4 text-center">
            <button
              onClick={() => setShowFullCode(true)}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
            >
              Lihat {lines.length - 100} baris lainnya
            </button>
          </div>
        )}
      </div>

      {/* Middleware Flow */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🛡️</span> Middleware: verifyTokenAndCoop
        </h3>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Extract Token', desc: 'Get token dari Authorization: Bearer <token>', icon: '🔍' },
            { step: 2, label: 'Verify JWT', desc: 'jwt.verify() dengan secret & issuer/audience', icon: '✅' },
            { step: 3, label: 'Get x-coop-id', desc: 'Extract cooperative_id dari header', icon: '📋' },
            { step: 4, label: 'Validate Match', desc: 'Compare token.cooperative_id === header.x-coop-id', icon: '🔒' },
            { step: 5, label: 'Attach User', desc: 'Set req.user dengan decoded token data', icon: '👤' },
            { step: 6, label: 'Continue', desc: 'next() untuk lanjut ke route handler', icon: '▶️' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-xs font-bold flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{item.label}</span>
                  <span>{item.icon}</span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JWT Payload Structure */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <span className="text-xs text-slate-500 font-mono">JWT Token Payload</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">JSON</span>
        </div>
        <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
          <code>{`{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "member_id": "AGR001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "cooperative_name": "AGR.BIZ.ID - KOPERASI DIGITAL",
  "coop_code": "AGR",
  "role": "MEMBER",
  "full_name": "Ahmad Suryadi",
  "iat": 1704067200,
  "exp": 1704153600,
  "iss": "koperasi-digital",
  "aud": "koperasi-api"
}`}</code>
        </pre>
      </div>

      {/* Usage Example */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <span className="text-xs text-slate-500 font-mono">Contoh Request</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">cURL</span>
        </div>
        <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
          <code>{`# Login
curl -X POST http://localhost:3000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "member_id": "AGR001",
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
      "member_id": "AGR001",
      "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
      "role": "MEMBER"
    }
  }
}`}</code>
        </pre>
      </div>

      {/* Security Features */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>🔒</span> Security Features
          </h3>
          <div className="space-y-3">
            {[
              { label: 'bcrypt Hashing', desc: '12 rounds untuk password security' },
              { label: 'JWT Expiration', desc: 'Token expired setelah 24 jam' },
              { label: 'Issuer/Audience', desc: 'Validasi issuer & audience token' },
              { label: 'Generic Error', desc: 'Tidak reveal apakah user exists' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <span className="text-green-400 text-xs mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span>🏢</span> Multi-Tenant Isolation
          </h3>
          <div className="space-y-3">
            {[
              { label: 'x-coop-id Header', desc: 'Wajib di setiap protected request' },
              { label: 'JWT Validation', desc: 'Coop ID harus match dengan token' },
              { label: 'Data Isolation', desc: 'Query otomatis filter by cooperative_id' },
              { label: 'Access Control', desc: 'Mencegah cross-cooperative access' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <span className="text-purple-400 text-xs mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚠️</span> Error Responses
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { code: '400', status: 'Bad Request', desc: 'Missing member_id/password atau x-coop-id' },
            { code: '401', status: 'Unauthorized', desc: 'Invalid credentials atau token expired' },
            { code: '403', status: 'Forbidden', desc: 'Coop ID tidak match atau akun tidak aktif' },
            { code: '404', status: 'Not Found', desc: 'User atau membership tidak ditemukan' },
          ].map(item => (
            <div key={item.code} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-400">{item.code}</span>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
              <p className="text-[10px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
