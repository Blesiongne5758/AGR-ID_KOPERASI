# 🔄 AGR-ID Sync Job - Implementasi Lengkap

## 📋 Overview

Implementasi lengkap untuk job sinkronisasi data koperasi dari repo KOPERASI ke AGR-ID Marketplace. Job ini membaca data koperasi dan anggota dari database lokal, membentuk payload sesuai spesifikasi AGR-ID, lalu mengirimkannya ke endpoint `POST /api/v1/cooperatives/sync`.

**Endpoint AGR-ID:** `POST /api/v1/cooperatives/sync`  
**Autentikasi:** `Authorization: Bearer <token>`  
**File Implementasi:** `src/services/agridSync.js`

---

## 🎯 Fitur Utama

### ✅ Snapshot Mode
- Full sync semua koperasi dan anggota
- Anggota aktif yang tidak ada di snapshot akan dinonaktifkan di AGR-ID
- Payload format sesuai spesifikasi AGR-ID

### ✅ Scheduled Sync
- Cron job untuk sinkronisasi berkala
- Default: Setiap hari jam 02:00 AM (configurable)
- Timezone: Asia/Jakarta

### ✅ Retry Mechanism
- Exponential backoff (2s, 4s, 8s)
- Maximum 3 retries
- Tidak retry pada 4xx errors (client errors)

### ✅ Comprehensive Logging
- Audit trail di tabel `agrid_sync_logs`
- Track success dan failed syncs
- Payload dan response disimpan untuk debugging

### ✅ Error Handling
- Network error handling
- HTTP error handling
- Database error handling
- Graceful degradation

---

## 📁 File Structure

```
src/
├── services/
│   └── agridSync.js              # Core sync logic
├── routes/
│   └── sync.js                   # API endpoints
├── scheduler/
│   └── agridSyncScheduler.js     # Cron job scheduler
└── components/
    └── AgridSyncJob.tsx          # Visual documentation

public/
└── migrations/
    └── 002_agrid_sync_logs.sql   # Database migration
```

---

## 🔧 Implementation Details

### 1. Core Sync Logic (`agridSync.js`)

#### Fetch Cooperatives with Members
```javascript
async function fetchCooperativesWithMembers() {
  const query = `
    SELECT 
      c.id,
      c.coop_code as code,
      c.name,
      c.is_active as active,
      json_agg(
        json_build_object(
          'id', u.id::text,
          'number', u.member_id,
          'name', u.full_name,
          'email', u.email,
          'active', m.status = 'ACTIVE'
        ) ORDER BY u.member_id
      ) FILTER (WHERE u.id IS NOT NULL) as members
    FROM cooperatives c
    LEFT JOIN memberships m ON c.id = m.cooperative_id
    LEFT JOIN users u ON m.user_id = u.id
    WHERE c.is_active = true
    GROUP BY c.id, c.coop_code, c.name, c.is_active
  `;
  
  const result = await db.query(query);
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    members: row.members || [],
  }));
}
```

#### Build Payload
```javascript
function buildSyncPayload(cooperatives, snapshot = true) {
  return {
    snapshot,
    cooperatives: cooperatives.map(coop => ({
      id: coop.id,
      code: coop.code,
      name: coop.name,
      active: coop.active,
      members: coop.members.map(member => ({
        id: member.id,
        number: member.number,
        name: member.name,
        email: member.email,
        active: member.active,
      })),
    })),
  };
}
```

#### Send with Retry
```javascript
async function sendSyncRequest(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(AGRID_SYNC_ENDPOINT, payload, {
        headers: {
          'Authorization': `Bearer ${AGRID_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      // Don't retry on 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw new Error(`AGR-ID sync failed: ${error.response.status}`);
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('AGR-ID sync failed after retries');
}
```

### 2. API Endpoints (`routes/sync.js`)

#### POST /api/v1/sync/agrid
Trigger full snapshot sync untuk semua koperasi.

```javascript
router.post('/agrid', async (req, res) => {
  try {
    const result = await syncAllCooperatives();
    res.status(200).json({
      success: true,
      message: 'AGR-ID sync completed successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'AGR-ID sync failed',
      error: error.message,
    });
  }
});
```

#### POST /api/v1/sync/agrid/:cooperativeId
Trigger partial sync untuk koperasi spesifik.

#### GET /api/v1/sync/history
Get sync history dari database.

### 3. Scheduler (`agridSyncScheduler.js`)

```javascript
const cron = require('node-cron');
const { syncAllCooperatives } = require('../services/agridSync');

const SYNC_SCHEDULE = process.env.AGRID_SYNC_SCHEDULE || '0 2 * * *';

function initScheduler() {
  // Full snapshot sync - Daily at 02:00 AM
  cron.schedule(SYNC_SCHEDULE, async () => {
    console.log('[Scheduler] Starting scheduled full sync...');
    
    try {
      const result = await syncAllCooperatives();
      console.log('[Scheduler] Sync completed successfully');
    } catch (error) {
      console.error('[Scheduler] Sync failed:', error.message);
      // TODO: Send alert notification
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta',
  });
}
```

### 4. Database Migration (`002_agrid_sync_logs.sql`)

```sql
CREATE TABLE agrid_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('SNAPSHOT', 'PARTIAL')),
    cooperatives_count INT NOT NULL DEFAULT 0,
    members_count INT NOT NULL DEFAULT 0,
    payload JSONB,
    response JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_agrid_sync_logs_status ON agrid_sync_logs(status);
CREATE INDEX idx_agrid_sync_logs_created ON agrid_sync_logs(created_at DESC);
CREATE INDEX idx_agrid_sync_logs_sync_type ON agrid_sync_logs(sync_type);
```

---

## 📝 Payload Structure

### Request Payload
```json
{
  "snapshot": true,
  "cooperatives": [
    {
      "id": "koperasi-001",
      "code": "KOP-001",
      "name": "Koperasi Tani Sejahtera",
      "active": true,
      "members": [
        {
          "id": "anggota-001",
          "number": "A-1001",
          "name": "Nama sesuai buku anggota",
          "email": "anggota@example.id",
          "active": true
        }
      ]
    }
  ]
}
```

### Response (Success)
```json
{
  "ok": true,
  "cooperatives_synced": 1,
  "members_synced": 1,
  "snapshot": true
}
```

---

## 🔐 Security

### API Token
- Token disimpan di secret manager / environment variable
- Jangan commit token ke Git
- Rotate token secara berkala (90 hari)
- Token hanya untuk role `koperasi`

### Data Privacy
- Data dikirim melalui HTTPS
- Tidak dicatat ke log (except payload di database)
- Hanya data yang diperlukan untuk sinkronisasi

---

## 🧪 Testing

### Manual Sync
```bash
# Trigger full sync
curl -X POST http://localhost:3000/api/v1/sync/agrid

# Trigger partial sync
curl -X POST http://localhost:3000/api/v1/sync/agrid/{cooperativeId}

# Get sync history
curl http://localhost:3000/api/v1/sync/history?limit=10
```

### Visual Testing
Akses Admin Dashboard → Tab "Sync AGR-ID" → Click "Trigger Full Sync"

---

## 📊 Monitoring

### Query Sync Statistics
```sql
-- Recent sync history
SELECT * FROM agrid_sync_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Daily statistics
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_syncs,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
    COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
    SUM(cooperatives_count) as total_cooperatives,
    SUM(members_count) as total_members
FROM agrid_sync_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Failed syncs
SELECT * FROM agrid_sync_logs 
WHERE status = 'FAILED' 
ORDER BY created_at DESC;
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Setup database migration `002_agrid_sync_logs.sql`
- [ ] Set environment variables:
  - `AGRID_BASE_URL`
  - `AGRID_API_TOKEN`
  - `AGRID_SYNC_SCHEDULE` (optional)
- [ ] Test manual sync via API
- [ ] Test scheduler initialization
- [ ] Verify logging to database

### Post-Deployment
- [ ] Monitor first scheduled sync
- [ ] Check sync logs for errors
- [ ] Verify data di AGR-ID
- [ ] Setup alerting untuk failed syncs
- [ ] Document API token rotation schedule

### Ongoing Maintenance
- [ ] Monitor sync success rate
- [ ] Review failed syncs weekly
- [ ] Rotate API token setiap 90 hari
- [ ] Archive old sync logs (90+ days)
- [ ] Update documentation

---

## 📚 Related Files

- **Service**: `src/services/agridSync.js`
- **Routes**: `src/routes/sync.js`
- **Scheduler**: `src/scheduler/agridSyncScheduler.js`
- **Migration**: `public/migrations/002_agrid_sync_logs.sql`
- **Visual**: `src/components/AgridSyncJob.tsx`

---

## 🎓 Learning Resources

- [AGR-ID API Documentation](https://agr.id/docs/api)
- [Cron Expression](https://crontab.guru/)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Integration Engineer  
**License:** MIT
