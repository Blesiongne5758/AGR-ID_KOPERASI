# 🏗️ Arsitektur Integrasi AGR-ID

Dokumentasi teknis arsitektur sistem integrasi database koperasi ke AGR-ID.

## 📊 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browser    │  │  Postman     │  │  Cron Job    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express.js Server                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Routes   │  │ Middleware │  │   Logger   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Service Layer                           │  │
│  │  ┌────────────────────────────────────────────────┐     │  │
│  │  │           agridSync.js                         │     │  │
│  │  │  • fetchCooperativesWithMembers()              │     │  │
│  │  │  • buildSyncPayload()                          │     │  │
│  │  │  • sendSyncRequest()                           │     │  │
│  │  │  • logSyncResult()                             │     │  │
│  │  │  • syncAllCooperatives()                       │     │  │
│  │  └────────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Scheduler Layer                          │  │
│  │  ┌────────────────────────────────────────────────┐     │  │
│  │  │        agridSyncScheduler.js                   │     │  │
│  │  │  • initScheduler()                             │     │  │
│  │  │  • Cron job (node-cron)                        │     │  │
│  │  │  • Timezone: Asia/Jakarta                      │     │  │
│  │  └────────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 PostgreSQL Database                       │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ cooperatives │  │   members    │  │ sync_logs    │  │  │
│  │  │              │  │              │  │              │  │  │
│  │  │ • id         │  │ • id         │  │ • id         │  │  │
│  │  │ • code       │  │ • coop_id    │  │ • type       │  │  │
│  │  │ • name       │  │ • number     │  │ • status     │  │  │
│  │  │ • active     │  │ • name       │  │ • payload    │  │  │
│  │  └──────────────┘  │ • email      │  │ • response   │  │  │
│  │                    │ • active     │  │ • error      │  │  │
│  │                    └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS POST
                            │ Authorization: Bearer <token>
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    AGR-ID API                             │  │
│  │                                                           │  │
│  │  Endpoint: POST /api/v1/cooperatives/sync                │  │
│  │                                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │  Validate    │  │   Process    │  │   Respond    │  │  │
│  │  │   Token      │  │    Data      │  │              │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │                                                           │  │
│  │  Response:                                                │  │
│  │  {                                                        │  │
│  │    "ok": true,                                           │  │
│  │    "cooperatives_synced": 2,                             │  │
│  │    "members_synced": 10,                                 │  │
│  │    "snapshot": true                                      │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Manual Sync Flow

```
User
  │
  │ POST /api/v1/sync/agrid
  ▼
Express Router
  │
  │ Call syncAllCooperatives()
  ▼
Service Layer
  │
  ├─> fetchCooperativesWithMembers()
  │     │
  │     │ SELECT cooperatives + members
  │     ▼
  │   PostgreSQL
  │     │
  │     │ Return data
  │     ▼
  │   Service Layer
  │
  ├─> buildSyncPayload()
  │     │
  │     │ Format data
  │     ▼
  │   JSON Payload
  │
  ├─> sendSyncRequest()
  │     │
  │     │ POST to AGR-ID
  │     ▼
  │   AGR-ID API
  │     │
  │     │ Process & respond
  │     ▼
  │   Service Layer
  │
  └─> logSyncResult()
        │
        │ INSERT to sync_logs
        ▼
      PostgreSQL
        │
        │ Return success
        ▼
      User
```

### 2. Scheduled Sync Flow

```
Cron Scheduler (node-cron)
  │
  │ Trigger setiap hari jam 02:00
  ▼
syncAllCooperatives()
  │
  │ (sama dengan manual sync flow)
  ▼
[Proses Sync]
  │
  ├─> Success → Log SUCCESS
  │
  └─> Failed → Retry (max 3x)
        │
        ├─> Success → Log SUCCESS
        │
        └─> Failed → Log FAILED + Alert
```

## 🗄️ Database Schema

### Tabel: cooperatives

```sql
CREATE TABLE cooperatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Menyimpan data koperasi yang akan disinkronkan ke AGR-ID.

**Indexes:**
- `code` (UNIQUE) - Untuk pencarian cepat berdasarkan kode

### Tabel: members

```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    member_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cooperative_id, member_number)
);
```

**Purpose:** Menyimpan data anggota per koperasi.

**Indexes:**
- `cooperative_id` - Untuk query anggota per koperasi
- `is_active` - Untuk filter anggota aktif
- `UNIQUE(cooperative_id, member_number)` - Mencegah duplikasi

### Tabel: agrid_sync_logs

```sql
CREATE TABLE agrid_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('SNAPSHOT', 'PARTIAL')),
    cooperatives_count INT DEFAULT 0,
    members_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    payload JSONB,
    response JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose:** Audit trail untuk semua sinkronisasi ke AGR-ID.

**Indexes:**
- `status` - Untuk query sync berdasarkan status
- `created_at DESC` - Untuk query sync terbaru

## 🔐 Security Architecture

### 1. Authentication Flow

```
Client
  │
  │ Request dengan Bearer Token
  ▼
Express Middleware
  │
  │ Validate token
  ▼
  ├─> Valid → Continue
  │
  └─> Invalid → 401 Unauthorized
```

### 2. Data Protection

```
Sensitive Data
  │
  ├─> API Token
  │     │
  │     └─> Stored in .env (not in code)
  │     └─> Added to .gitignore
  │
  ├─> Database Credentials
  │     │
  │     └─> Stored in DATABASE_URL
  │     └─> Use connection pooling
  │
  └─> Member Data
        │
        └─> Sent via HTTPS only
        └─> Minimal data exposure
```

### 3. Network Security

```
Internet
  │
  │ HTTPS (TLS 1.2+)
  ▼
Firewall
  │
  │ Port 443 (HTTPS)
  ▼
Load Balancer (Optional)
  │
  ▼
Application Server
  │
  │ Internal Network
  ▼
Database Server
```

## ⚡ Performance Considerations

### 1. Database Optimization

```sql
-- Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

-- Use indexes
CREATE INDEX idx_members_cooperative ON members(cooperative_id);
CREATE INDEX idx_sync_logs_created ON agrid_sync_logs(created_at DESC);

-- Use prepared statements
const result = await pool.query('SELECT * FROM members WHERE cooperative_id = $1', [coopId]);
```

### 2. API Optimization

```javascript
// Use retry with exponential backoff
async function sendSyncRequest(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios.post(url, payload, config);
    } catch (error) {
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000);
      }
    }
  }
}

// Use timeout
const response = await axios.post(url, payload, {
  timeout: 30000, // 30 seconds
});
```

### 3. Scheduler Optimization

```javascript
// Use cron with timezone
cron.schedule('0 2 * * *', syncFunction, {
  scheduled: true,
  timezone: 'Asia/Jakarta',
});
```

## 📊 Monitoring Architecture

```
Application
  │
  ├─> Logs
  │     │
  │     └─> Console logs
  │     └─> File logs (optional)
  │
  ├─> Metrics
  │     │
  │     └─> Sync success rate
  │     └─> Sync duration
  │     └─> Error count
  │
  └─> Alerts
        │
        └─> Failed syncs
        └─> High error rate
        └─> Long sync duration
```

## 🚀 Deployment Architecture

### Development

```
Local Machine
  │
  ├─> Node.js Server (port 3000)
  ├─> PostgreSQL (port 5432)
  └─> .env file
```

### Production

```
Internet
  │
  ▼
Load Balancer (nginx)
  │
  ├─> SSL/TLS Termination
  ├─> Rate Limiting
  └─> Request Routing
  │
  ▼
Application Server (PM2)
  │
  ├─> Node.js Cluster (4 instances)
  ├─> Auto-restart on crash
  └─> Log management
  │
  ▼
Database Server (PostgreSQL)
  │
  ├─> Primary-Replica Setup
  ├─> Automated Backups
  └─> Connection Pooling
```

## 🔄 Integration Patterns

### 1. Snapshot Pattern

```javascript
// Full sync - replace all data
{
  "snapshot": true,
  "cooperatives": [...]
}
```

**Use Case:** Initial sync, data reconciliation

### 2. Partial Update Pattern

```javascript
// Partial sync - update specific data
{
  "snapshot": false,
  "cooperatives": [
    {
      "id": "uuid",
      "members": [
        { "id": "uuid", "active": false }
      ]
    }
  ]
}
```

**Use Case:** Update specific member status

### 3. Webhook Pattern (Future)

```javascript
// Real-time sync on data change
app.post('/webhook/member-updated', async (req, res) => {
  const member = req.body;
  await syncMemberToAgrid(member);
});
```

**Use Case:** Real-time synchronization

## 📚 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript runtime |
| Framework | Express.js 4.x | Web framework |
| Database | PostgreSQL 14+ | Relational database |
| HTTP Client | Axios 1.x | HTTP requests |
| Scheduler | node-cron 3.x | Cron jobs |
| Environment | dotenv 16.x | Environment variables |

## 🎯 Design Principles

1. **Separation of Concerns**
   - Routes handle HTTP
   - Services handle business logic
   - Database handles data persistence

2. **Fail-Safe**
   - Retry mechanism for transient failures
   - Comprehensive error handling
   - Audit trail for debugging

3. **Scalability**
   - Connection pooling
   - Async/await for non-blocking I/O
   - Horizontal scaling ready

4. **Security**
   - Environment variables for secrets
   - HTTPS only
   - Minimal data exposure

5. **Maintainability**
   - Clear code structure
   - Comprehensive documentation
   - Logging and monitoring

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Architecture Team
