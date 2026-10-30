# 🔐 AGRID Integration Database Schema

## 📋 Overview

Dokumentasi lengkap untuk skema database integrasi AGRID Marketplace yang terdiri dari 2 tabel utama:
1. **agrid_integrations** - Menyimpan kredensial API per koperasi
2. **agrid_webhook_logs** - Log webhook untuk audit dan debugging

---

## 🗄️ Tabel: agrid_integrations

### Deskripsi
Menyimpan kredensial API untuk setiap koperasi yang mengaktifkan integrasi AGRID. Setiap koperasi memiliki satu record integrasi dengan client credentials dan webhook secret.

### Struktur Tabel

| Kolom | Tipe Data | Constraints | Deskripsi |
|-------|-----------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key unik |
| `cooperative_id` | UUID | UNIQUE, NOT NULL, FK → cooperatives(id), ON DELETE CASCADE | ID koperasi (1:1 relationship) |
| `agrid_client_id` | VARCHAR(100) | NOT NULL | Client ID dari AGRID |
| `agrid_client_secret` | VARCHAR(255) | NOT NULL | Client secret (enkripsi di aplikasi) |
| `webhook_secret` | VARCHAR(255) | NOT NULL | Secret untuk verifikasi HMAC webhook |
| `is_active` | BOOLEAN | DEFAULT TRUE | Status aktif integrasi |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan record |

### SQL Definition
```sql
CREATE TABLE agrid_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID UNIQUE NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    agrid_client_id VARCHAR(100) NOT NULL,
    agrid_client_secret VARCHAR(255) NOT NULL,
    webhook_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_agrid_integrations_cooperative ON agrid_integrations(cooperative_id);
CREATE INDEX idx_agrid_integrations_active ON agrid_integrations(is_active) WHERE is_active = TRUE;
```

### Key Features
- ✅ **UNIQUE cooperative_id**: Satu koperasi = satu integrasi
- ✅ **CASCADE DELETE**: Jika koperasi dihapus, integrasi otomatis terhapus
- ✅ **Encrypted Secrets**: Client secret dan webhook secret harus dienkripsi di level aplikasi
- ✅ **Active Flag**: Dapat menonaktifkan integrasi tanpa menghapus data

---

## 📡 Tabel: agrid_webhook_logs

### Deskripsi
Log webhook dari AGRID untuk debugging dan audit trail. Setiap webhook yang diterima dicatat dengan idempotency key untuk mencegah duplicate processing.

### Struktur Tabel

| Kolom | Tipe Data | Constraints | Deskripsi |
|-------|-----------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key unik |
| `agrid_event_id` | VARCHAR(100) | UNIQUE, NOT NULL | Idempotency key dari AGRID |
| `cooperative_id` | UUID | NOT NULL | ID koperasi penerima webhook |
| `event_type` | VARCHAR(50) | NOT NULL | Jenis event (ORDER.PAID, ORDER.CANCELLED, dll) |
| `payload` | JSONB | NOT NULL | Payload lengkap webhook dalam JSON |
| `signature` | VARCHAR(255) | NOT NULL | HMAC signature dari AGRID |
| `processed_at` | TIMESTAMP | - | Waktu webhook berhasil diproses |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | Status: PENDING, SUCCESS, FAILED |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Waktu webhook diterima |

### SQL Definition
```sql
CREATE TABLE agrid_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agrid_event_id VARCHAR(100) UNIQUE NOT NULL,
    cooperative_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_agrid_webhook_logs_event_id ON agrid_webhook_logs(agrid_event_id);
CREATE INDEX idx_agrid_webhook_logs_cooperative ON agrid_webhook_logs(cooperative_id);
CREATE INDEX idx_agrid_webhook_logs_event_type ON agrid_webhook_logs(event_type);
CREATE INDEX idx_agrid_webhook_logs_status ON agrid_webhook_logs(status);
CREATE INDEX idx_agrid_webhook_logs_created ON agrid_webhook_logs(created_at DESC);
CREATE INDEX idx_agrid_webhook_logs_payload ON agrid_webhook_logs USING GIN (payload);
```

### Key Features
- ✅ **UNIQUE agrid_event_id**: Idempotency key mencegah duplicate processing
- ✅ **JSONB Payload**: Flexible storage untuk berbagai jenis payload
- ✅ **GIN Index**: Fast search pada JSON payload
- ✅ **Status Tracking**: PENDING → SUCCESS/FAILED workflow
- ✅ **Audit Trail**: created_at dan processed_at untuk tracking

---

## 🔐 Security Best Practices

### 1. Encrypt Secrets
```javascript
// ENCRYPTION (saat menyimpan)
const encryptedSecret = crypto.encrypt(
  agrid_client_secret,
  process.env.ENCRYPTION_KEY
);

// DECRYPTION (saat menggunakan)
const decryptedSecret = crypto.decrypt(
  encryptedSecret,
  process.env.ENCRYPTION_KEY
);
```

### 2. Verify Webhook Signature
```javascript
const isValid = verifyWebhookSignature(
  payload,
  signature,
  webhook_secret
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

### 3. Idempotency Check
```javascript
// Check apakah event sudah diproses
const existing = await db.query(
  'SELECT id FROM agrid_webhook_logs WHERE agrid_event_id = $1',
  [agrid_event_id]
);

if (existing.rows.length > 0) {
  // Already processed, return success
  return { success: true, message: 'Already processed' };
}
```

### 4. Rotate Keys Periodically
```sql
-- Rotate webhook secret setiap 90 hari
UPDATE agrid_integrations
SET webhook_secret = 'new_encrypted_secret',
    updated_at = NOW()
WHERE cooperative_id = 'uuid-here';
```

---

## 📊 Contoh Penggunaan

### 1. Setup Integrasi untuk Koperasi
```sql
INSERT INTO agrid_integrations (
  cooperative_id, 
  agrid_client_id, 
  agrid_client_secret, 
  webhook_secret
) VALUES (
  'uuid-koperasi-here',
  'agrid_client_xxxxx',
  'encrypted_secret_xxxxx',
  'webhook_secret_xxxxx'
);
```

### 2. Log Webhook yang Diterima
```sql
INSERT INTO agrid_webhook_logs (
  agrid_event_id,
  cooperative_id,
  event_type,
  payload,
  signature,
  status
) VALUES (
  'evt_agr_123456',
  'uuid-koperasi-here',
  'ORDER.PAID',
  '{"order_id": "ord_001", "amount": 750000}',
  'hmac_signature_here',
  'PENDING'
);
```

### 3. Update Status Setelah Processing
```sql
UPDATE agrid_webhook_logs
SET status = 'SUCCESS',
    processed_at = NOW()
WHERE agrid_event_id = 'evt_agr_123456';
```

### 4. Query Webhook Logs untuk Audit
```sql
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total DESC;
```

### 5. Query Payload dengan JSONB
```sql
-- Cari webhook dengan amount > 1 juta
SELECT *
FROM agrid_webhook_logs
WHERE payload->>'amount'::numeric > 1000000;

-- Cari webhook untuk order tertentu
SELECT *
FROM agrid_webhook_logs
WHERE payload->>'order_id' = 'ord_001';
```

---

## 🔄 Workflow Integration

### Flow Webhook Processing
```
1. AGRID kirim webhook → POST /api/v1/webhooks/agrid-order
   ↓
2. Verify signature dengan webhook_secret
   ↓
3. Check idempotency (agrid_event_id)
   ↓
4. INSERT ke agrid_webhook_logs (status: PENDING)
   ↓
5. Process webhook (update loans, savings, dll)
   ↓
6. UPDATE status ke SUCCESS/FAILED
   ↓
7. Return response ke AGRID
```

### Status Transitions
```
PENDING → SUCCESS (berhasil diproses)
PENDING → FAILED (gagal diproses)
```

---

## 🎯 Event Types

### Supported Events
| Event Type | Deskripsi | Action |
|------------|-----------|--------|
| `ORDER.PAID` | Order dibayar oleh anggota | Kurangi limit Paylater |
| `ORDER.CANCELLED` | Order dibatalkan | Restore limit Paylater |
| `ORDER.REFUNDED` | Order di-refund | Restore limit Paylater |
| `PAYMENT.RECEIVED` | Pembayaran angsuran diterima | Update loan balance |
| `MEMBER.REGISTERED` | Anggota baru terdaftar via AGRID | Create membership |

---

## 📈 Monitoring Queries

### Daily Webhook Statistics
```sql
SELECT 
  DATE(created_at) as date,
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  COUNT(*) FILTER (WHERE status = 'PENDING') as pending
FROM agrid_webhook_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC, event_type;
```

### Failed Webhooks (Perlu Retry)
```sql
SELECT 
  agrid_event_id,
  cooperative_id,
  event_type,
  payload,
  created_at
FROM agrid_webhook_logs
WHERE status = 'FAILED'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Processing Time Analysis
```sql
SELECT 
  agrid_event_id,
  event_type,
  created_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_time_seconds
FROM agrid_webhook_logs
WHERE status = 'SUCCESS'
  AND processed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY processing_time_seconds DESC
LIMIT 20;
```

---

## 🛡️ Data Retention Policy

### Recommended Retention
```sql
-- Archive webhook logs older than 90 days
CREATE TABLE agrid_webhook_logs_archive (
  LIKE agrid_webhook_logs INCLUDING ALL
);

-- Move old logs to archive
INSERT INTO agrid_webhook_logs_archive
SELECT * FROM agrid_webhook_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete archived logs
DELETE FROM agrid_webhook_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🔗 Related Components

- **Webhook Endpoint**: `src/components/WebhookEndpoint.tsx`
- **Visual Schema**: `src/components/AgridIntegrationSchema.tsx`
- **Integration Docs**: `public/WEBHOOK_README.md`

---

## 📚 Migration Script

Full migration script tersedia di:
```
public/migrations/001_initial_schema.sql
```

Untuk menjalankan migration:
```bash
psql -U postgres -d koperasi_db -f public/migrations/001_initial_schema.sql
```

---

## ✅ Checklist Implementasi

### Database
- [ ] Create tabel `agrid_integrations`
- [ ] Create tabel `agrid_webhook_logs`
- [ ] Create semua indexes
- [ ] Test constraint UNIQUE
- [ ] Test foreign key CASCADE

### Application
- [ ] Implementasi encryption untuk secrets
- [ ] Implementasi signature verification
- [ ] Implementasi idempotency check
- [ ] Implementasi status tracking
- [ ] Implementasi error handling

### Monitoring
- [ ] Setup logging untuk webhook events
- [ ] Setup alert untuk failed webhooks
- [ ] Setup dashboard untuk statistics
- [ ] Setup retention policy

### Security
- [ ] Rotate secrets setiap 90 hari
- [ ] Audit log access
- [ ] Test signature verification
- [ ] Test idempotency handling

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Integration Engineer  
**License:** MIT
