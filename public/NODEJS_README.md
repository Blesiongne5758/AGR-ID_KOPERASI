# 🟢 REST API Authentication - Node.js Implementation

## 📋 Overview

Implementasi REST API authentication endpoint menggunakan **Express.js** dengan **JWT token** dan **multi-tenant isolation** untuk sistem koperasi.

**Endpoint:** `POST /api/v1/auth/login`  
**Middleware:** `verifyTokenAndCoop` untuk isolasi data antar koperasi

---

## 🎯 Fitur Utama

### ✅ Authentication Flow
- **bcrypt Password Hashing**: 12 rounds untuk security optimal
- **JWT Token Generation**: Payload berisi user_id, cooperative_id, role
- **Token Expiration**: 24 jam (configurable)
- **Generic Error Messages**: Tidak reveal apakah user exists

### ✅ Multi-Tenant Isolation
- **x-coop-id Header**: Wajib di setiap protected request
- **JWT Validation**: Cooperative ID harus match dengan token
- **Data Isolation**: Query otomatis filter by cooperative_id
- **Access Control**: Mencegah cross-cooperative access

### ✅ Security Best Practices
- Password hashing dengan bcrypt (12 rounds)
- JWT dengan issuer & audience validation
- Context timeout untuk database queries
- Error handling lengkap dengan custom errors
- Input validation & sanitization

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🔧 Implementasi

### 1. Setup Database Connection

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. JWT Configuration

```javascript
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';
const BCRYPT_ROUNDS = 12;
```

### 3. POST /api/v1/auth/login

**Request Body:**
```json
{
  "member_id": "AGR001",
  "password": "secret123"
}
```

**Logic Flow:**
1. Validate request body (member_id & password)
2. Find user by member_id
3. Validate password dengan bcrypt.compare()
4. Get cooperative_id & role dari memberships table
5. Generate JWT token dengan payload lengkap
6. Update last_login_at
7. Return token + user info

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "member_id": "AGR001",
      "full_name": "Ahmad Suryadi",
      "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
      "cooperative_name": "Koperasi AGRID Sejahtera",
      "role": "MEMBER"
    }
  }
}
```

---

## 🛡️ Middleware: verifyTokenAndCoop

### Purpose
Memastikan setiap protected request memiliki:
1. Valid JWT token di header `Authorization: Bearer <token>`
2. Header `x-coop-id` yang cocok dengan `cooperative_id` di JWT

### Implementation

```javascript
const verifyTokenAndCoop = (req, res, next) => {
  try {
    // Step 1: Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header tidak valid');
    }
    const token = authHeader.substring(7);

    // Step 2: Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'koperasi-digital',
      audience: 'koperasi-api',
    });

    // Step 3: Get x-coop-id
    const coopIdHeader = req.headers['x-coop-id'];
    if (!coopIdHeader) {
      throw new BadRequestError('Header x-coop-id wajib disertakan');
    }

    // Step 4: Validate match
    if (decoded.cooperative_id !== coopIdHeader) {
      throw new ForbiddenError('Cooperative ID tidak sesuai dengan token');
    }

    // Step 5: Attach user info
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
```

### Usage

```javascript
// Apply middleware ke protected routes
router.use(verifyTokenAndCoop);

// Protected route
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
});

// Protected route dengan data isolation
router.get('/members', async (req, res) => {
  const cooperativeId = req.user.cooperative_id;
  
  const query = `
    SELECT * FROM memberships
    WHERE cooperative_id = $1
  `;
  
  const result = await pool.query(query, [cooperativeId]);
  
  res.json({
    success: true,
    data: { members: result.rows },
  });
});
```

---

## 📝 JWT Token Structure

### Payload

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "member_id": "AGR001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "cooperative_name": "Koperasi AGRID Sejahtera",
  "coop_code": "AGR",
  "role": "MEMBER",
  "full_name": "Ahmad Suryadi",
  "iat": 1704067200,
  "exp": 1704153600,
  "iss": "koperasi-digital",
  "aud": "koperasi-api"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID | Primary key user |
| `member_id` | String | ID anggota (AGR001) |
| `cooperative_id` | UUID | ID koperasi |
| `cooperative_name` | String | Nama koperasi |
| `coop_code` | String | Kode koperasi (AGR) |
| `role` | String | MEMBER, ADMIN, MANAGER |
| `full_name` | String | Nama lengkap |
| `iat` | Number | Issued at (timestamp) |
| `exp` | Number | Expiration (timestamp) |
| `iss` | String | Issuer |
| `aud` | String | Audience |

---

## 🚀 Contoh Penggunaan

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "AGR001",
    "password": "secret123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "member_id": "AGR001",
      "full_name": "Ahmad Suryadi",
      "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
      "cooperative_name": "Koperasi AGRID Sejahtera",
      "role": "MEMBER"
    }
  }
}
```

### 2. Access Protected Route

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "x-coop-id: 987fcdeb-51a2-43d7-9012-3456789abcde"
```

**Response:**
```json
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
}
```

### 3. Get Members (Data Isolation)

```bash
curl -X GET http://localhost:3000/api/v1/auth/members \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "x-coop-id: 987fcdeb-51a2-43d7-9012-3456789abcde"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "...",
        "member_number": "AGR001",
        "full_name": "Ahmad Suryadi",
        "role": "MEMBER",
        "status": "ACTIVE"
      },
      {
        "id": "...",
        "member_number": "AGR002",
        "full_name": "Siti Nurhaliza",
        "role": "MEMBER",
        "status": "ACTIVE"
      }
    ],
    "total": 2
  }
}
```

---

## 🔒 Security Features

### 1. Password Hashing
```javascript
const BCRYPT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
const isValid = await bcrypt.compare(password, passwordHash);
```

### 2. JWT Validation
```javascript
const decoded = jwt.verify(token, JWT_SECRET, {
  issuer: 'koperasi-digital',
  audience: 'koperasi-api',
});
```

### 3. Generic Error Messages
```javascript
// ❌ Bad: Reveals if user exists
if (!user) throw new Error('User not found');

// ✅ Good: Generic message
if (!user) throw new UnauthorizedError('Invalid credentials');
```

### 4. Multi-Tenant Isolation
```javascript
// Middleware validates x-coop-id matches JWT
if (decoded.cooperative_id !== req.headers['x-coop-id']) {
  throw new ForbiddenError('Cooperative ID tidak sesuai');
}

// Query automatically filters by cooperative_id
const query = `SELECT * FROM members WHERE cooperative_id = $1`;
```

---

## ⚠️ Error Handling

### Custom Error Classes

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
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
```

### Error Responses

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Missing member_id/password atau x-coop-id |
| 401 | Unauthorized | Invalid credentials atau token expired |
| 403 | Forbidden | Coop ID tidak match atau akun tidak aktif |
| 404 | Not Found | User atau membership tidak ditemukan |
| 500 | Internal Error | Server error |

---

## 🧪 Testing

### Unit Test Example

```javascript
const request = require('supertest');
const app = require('../app');

describe('POST /api/v1/auth/login', () => {
  it('should return token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        member_id: 'AGR001',
        password: 'secret123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.member_id).toBe('AGR001');
  });

  it('should return 401 for invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        member_id: 'AGR001',
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        member_id: 'AGR001',
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('Middleware: verifyTokenAndCoop', () => {
  it('should allow request with valid token and matching x-coop-id', async () => {
    const token = generateTestToken();
    
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-coop-id', '987fcdeb-51a2-43d7-9012-3456789abcde');

    expect(res.statusCode).toBe(200);
  });

  it('should reject request with mismatched x-coop-id', async () => {
    const token = generateTestToken();
    
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('x-coop-id', 'different-coop-id');

    expect(res.statusCode).toBe(403);
  });
});
```

---

## 📚 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/koperasi_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production
```

---

## 🎓 Best Practices

### ✅ DO
- Gunakan bcrypt dengan minimal 10 rounds
- Set JWT expiration (jangan infinite)
- Validasi issuer & audience di JWT
- Gunakan generic error messages
- Implementasi multi-tenant isolation
- Log semua authentication attempts
- Use HTTPS in production

### ❌ DON'T
- Jangan simpan password plain text
- Jangan expose JWT secret di client
- Jangan skip x-coop-id validation
- Jangan return sensitive data di error
- Jangan use weak JWT secret
- Jangan forget to rotate secrets

---

## 📊 Performance Tips

### 1. Connection Pooling
```javascript
const pool = new Pool({
  max: 20,  // Sesuaikan dengan workload
  idleTimeoutMillis: 30000,
});
```

### 2. Cache JWT Verification
```javascript
// Untuk high-traffic, cache decoded token
const cache = new Map();

function verifyToken(token) {
  if (cache.has(token)) {
    return cache.get(token);
  }
  
  const decoded = jwt.verify(token, JWT_SECRET);
  cache.set(token, decoded);
  
  // Cleanup cache setiap 5 menit
  setTimeout(() => cache.delete(token), 300000);
  
  return decoded;
}
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts',
});

router.post('/login', loginLimiter, async (req, res) => {
  // ...
});
```

---

## 📁 File Structure

```
project/
├── src/
│   ├── routes/
│   │   └── auth.js          # Authentication routes
│   ├── middleware/
│   │   └── verifyToken.js   # JWT middleware
│   ├── utils/
│   │   └── errors.js        # Custom error classes
│   ├── db/
│   │   └── pool.js          # Database connection
│   └── app.js               # Express app
├── .env                     # Environment variables
├── package.json
└── README.md
```

---

## 🔗 Related Files

- **Code**: `public/code/auth_api.js`
- **Visual Component**: `src/components/NodejsCode.tsx`
- **Database Schema**: `public/migrations/001_initial_schema.sql`

---

## 📞 Support

Untuk pertanyaan atau issue:
- Review kode di `public/code/auth_api.js`
- Check Express.js documentation
- Test di local environment sebelum production

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Senior Node.js Developer  
**License:** MIT
