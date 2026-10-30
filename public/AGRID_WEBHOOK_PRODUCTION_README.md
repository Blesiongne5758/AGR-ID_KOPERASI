# 🔗 AGRID Webhook Production Implementation

## 📋 Overview

Implementasi **production-ready** webhook endpoint untuk menerima notifikasi dari AGRID Marketplace. Kode ini menggunakan pattern **per-cooperative secrets** (webhook_secret diambil dari database per koperasi) dan **log-first pattern** untuk audit trail yang handal.

**File:** `routes/webhooks.agrid.js`  
**Endpoint:** `POST /api/v1/webhooks/agrid`  
**Component:** `src/components/AgridWebhookProduction.tsx`

---

## 🎯 Key Differences from Previous Implementation

### ✅ What's New

| Feature | Previous | Production Ready |
|---------|----------|------------------|
| **Webhook Secret** | Environment variable | Per-cooperative dari DB |
| **Idempotency** | Event ID check | Event ID + return 200 OK |
| **Logging** | After processing | Before processing (PENDING) |
| **Event Types** | Generic | ORDER.PAID, ORDER.CANCELLED |
| **Paylater Field** | remaining_amount | remaining_limit |
| **Transaction Table** | savings_transactions | transactions |
| **Loan Type Field** | type | loan_type |

---

## 🔐 Security Features

### 1. Per-Cooperative Webhook Secret
```javascript
// Ambil webhook_secret dari DB berdasarkan cooperative_id
const integration = await db.query(
    'SELECT webhook_secret FROM agrid_integrations WHERE cooperative_id = $1 AND is_active = true', 
    [coopId]
);

if (integration.rows.length === 0) {
    return res.status(404).json({ error: 'Integrasi tidak aktif' });
}

const secret = integration.rows[0].webhook_secret;
```

**Benefits:**
- ✅ Setiap koperasi punya secret sendiri
- ✅ Dapat rotate secret per koperasi tanpa affect yang lain
- ✅ Dapat disable integrasi per koperasi (is_active = false)

### 2. HMAC SHA256 Verification
```javascript
const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
```

### 3. Timing-Safe Comparison
```javascript
const signatureBuffer = Buffer.from(signature, 'hex');
const expectedBuffer = Buffer.from(expectedSignature, 'hex');

if (signatureBuffer.length !== expectedBuffer.length || 
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid signature' });
}
```

**Why timingSafeEqual?**
- Mencegah timing attack
- Constant-time comparison
- Tidak leak informasi tentang signature

---

## 🔄 5-Step Processing Flow

### Step 1: Verify Signature
```javascript
const integration = await db.query(
    'SELECT webhook_secret FROM agrid_integrations WHERE cooperative_id = $1 AND is_active = true', 
    [coopId]
);

const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid signature' });
}
```

### Step 2: Idempotency Check
```javascript
const existingLog = await db.query(
    'SELECT id FROM agrid_webhook_logs WHERE agrid_event_id = $1', 
    [eventId]
);

if (existingLog.rows.length > 0) {
    return res.status(200).json({ message: 'Event already processed' });
}
```

**Why return 200 OK?**
- AGRID akan retry jika menerima non-200 response
- Return 200 mencegah infinite retry loop
- Idempotent: same result regardless of how many times called

### Step 3: Save Log (PENDING)
```javascript
await db.query(
    `INSERT INTO agrid_webhook_logs 
     (id, agrid_event_id, cooperative_id, event_type, payload, signature, status) 
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')`,
    [crypto.randomUUID(), eventId, coopId, payload.event_type, 
     JSON.stringify(payload), signature]
);
```

**Why log first?**
- Audit trail lengkap
- Jika proses gagal, log tetap ada untuk debugging
- Pattern: "Log before process"

### Step 4: Process Business Logic
```javascript
if (payload.event_type === 'ORDER.PAID') {
    await processPaidOrder(payload);
} else if (payload.event_type === 'ORDER.CANCELLED') {
    await processCancelledOrder(payload);
}
```

### Step 5: Update Status & Return 200
```javascript
await db.query(
    "UPDATE agrid_webhook_logs SET status = 'SUCCESS', processed_at = NOW() WHERE agrid_event_id = $1", 
    [eventId]
);

return res.status(200).json({ message: 'Webhook received and processed' });
```

---

## 💳 processPaidOrder — Transaction Flow

### Query Membership & Paylater
```sql
SELECT m.id as membership_id, 
       l.id as loan_id, 
       l.remaining_limit 
FROM memberships m 
LEFT JOIN loans l ON m.id = l.membership_id 
  AND l.loan_type = 'PAYLATER' 
  AND l.status = 'ACTIVE'
WHERE m.user_id = (
  SELECT id FROM users WHERE member_id = $1
) AND m.cooperative_id = $2
```

### Validation Checks
1. ✅ Member exists
2. ✅ Paylater loan is ACTIVE
3. ✅ remaining_limit >= order_amount

### Transaction (ACID)
```javascript
const client = await db.connect();
try {
    await client.query('BEGIN');
    
    // 1. Kurangi Paylater limit
    await client.query(
        'UPDATE loans SET remaining_limit = remaining_limit - $1 WHERE id = $2', 
        [order_amount, loan.loan_id]
    );
    
    // 2. Catat di ledger
    await client.query(
        `INSERT INTO transactions 
         (membership_id, loan_id, type, amount, reference_id, description) 
         VALUES ($1, $2, 'PAYLATER_PURCHASE', $3, $4, 'Pembelian di AGRID Marketplace')`,
        [loan.membership_id, loan.loan_id, order_amount, agrid_order_id]
    );

    await client.query('COMMIT');
} catch (e) {
    await client.query('ROLLBACK');
    throw e;
} finally {
    client.release();
}
```

---

## 📝 Request/Response Examples

### Request (from AGRID)
```http
POST /api/v1/webhooks/agrid
Headers:
  x-agrid-signature: a1b2c3d4e5f6...
  Content-Type: application/json

Body:
{
  "event_id": "evt_agr_123456",
  "event_type": "ORDER.PAID",
  "cooperative_id": "uuid-coop",
  "member_id": "AGR-2024-000001",
  "order_amount": 750000,
  "agrid_order_id": "ord_agr_001"
}
```

### Response (to AGRID)

#### Success (200 OK)
```json
{
  "message": "Webhook received and processed"
}
```

#### Already Processed (200 OK - idempotent)
```json
{
  "message": "Event already processed"
}
```

#### Invalid Signature (401)
```json
{
  "error": "Invalid signature"
}
```

#### Integration Not Active (404)
```json
{
  "error": "Integrasi tidak aktif"
}
```

#### Server Error (500)
```json
{
  "error": "Internal Server Error"
}
```

---

## 🗄️ Database Dependencies

### Tables Used

| Table | Purpose |
|-------|---------|
| `agrid_integrations` | webhook_secret per koperasi |
| `agrid_webhook_logs` | Audit trail webhook |
| `memberships` | Data keanggotaan |
| `loans` | Paylater remaining_limit |
| `transactions` | Ledger untuk transaksi |

### Schema Requirements

#### agrid_integrations
```sql
CREATE TABLE agrid_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID UNIQUE NOT NULL REFERENCES cooperatives(id),
    webhook_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### agrid_webhook_logs
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

#### loans (Paylater fields)
```sql
-- Relevant fields for Paylater
loan_type VARCHAR(20) -- 'PAYLATER'
status VARCHAR(20) -- 'ACTIVE'
remaining_limit NUMERIC(15,2)
```

#### transactions
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id),
    loan_id UUID REFERENCES loans(id),
    type VARCHAR(50) NOT NULL, -- 'PAYLATER_PURCHASE'
    amount NUMERIC(15,2) NOT NULL,
    reference_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing

### Test with cURL

```bash
# Generate signature
TIMESTAMP=$(date +%s)
PAYLOAD='{"event_id":"evt_test_001","event_type":"ORDER.PAID","cooperative_id":"uuid-coop","member_id":"AGR-2024-000001","order_amount":750000,"agrid_order_id":"ord_test_001"}'
SECRET="your-webhook-secret-from-db"
SIGNATURE=$(echo -n "${PAYLOAD}" | openssl dgst -sha256 -hmac "${SECRET}" | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:3000/api/v1/webhooks/agrid \
  -H "Content-Type: application/json" \
  -H "x-agrid-signature: ${SIGNATURE}" \
  -d "${PAYLOAD}"
```

### Test Idempotency
```bash
# Send same request twice
curl -X POST ... # First time: 200 OK "Webhook received and processed"
curl -X POST ... # Second time: 200 OK "Event already processed"
```

### Test Invalid Signature
```bash
curl -X POST http://localhost:3000/api/v1/webhooks/agrid \
  -H "Content-Type: application/json" \
  -H "x-agrid-signature: invalid_signature" \
  -d "${PAYLOAD}"
# Response: 401 { "error": "Invalid signature" }
```

---

## 🔒 Security Best Practices

### ✅ Implemented
- ✅ Per-cooperative webhook_secret
- ✅ HMAC SHA256 verification
- ✅ Timing-safe comparison
- ✅ Idempotency via event_id
- ✅ Transaction for ledger updates
- ✅ Log-first pattern for audit trail
- ✅ Input validation
- ✅ Error handling

### 🛡️ Additional Recommendations
- 🔐 Encrypt webhook_secret di database (AES-256)
- 🔄 Rotate secrets setiap 90 hari
- 📊 Monitor failed webhooks
- 🚨 Alert untuk suspicious activity
- 📝 Log all webhook attempts
- 🔒 Use HTTPS only
- ⏱️ Set timeout untuk webhook processing

---

## 📊 Monitoring Queries

### Failed Webhooks
```sql
SELECT 
    agrid_event_id,
    cooperative_id,
    event_type,
    payload,
    created_at
FROM agrid_webhook_logs
WHERE status = 'PENDING'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Daily Statistics
```sql
SELECT 
    DATE(created_at) as date,
    event_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending
FROM agrid_webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), event_type
ORDER BY date DESC;
```

### Processing Time
```sql
SELECT 
    agrid_event_id,
    event_type,
    EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_time_seconds
FROM agrid_webhook_logs
WHERE status = 'SUCCESS'
  AND processed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY processing_time_seconds DESC;
```

---

## 🚀 Production Checklist

### Pre-Deployment
- [ ] Setup agrid_integrations table
- [ ] Setup agrid_webhook_logs table
- [ ] Setup transactions table
- [ ] Insert webhook_secret per cooperative
- [ ] Test signature verification
- [ ] Test idempotency handling
- [ ] Test transaction rollback

### Post-Deployment
- [ ] Register webhook URL di AGRID
- [ ] Test dengan live webhook
- [ ] Monitor agrid_webhook_logs
- [ ] Setup alert untuk failed webhooks
- [ ] Document webhook URL untuk tim

### Ongoing
- [ ] Rotate webhook secrets (90 days)
- [ ] Review failed webhooks weekly
- [ ] Monitor processing time
- [ ] Archive old webhook logs (90+ days)

---

## 📚 Related Files

- **Code**: `routes/webhooks.agrid.js`
- **Component**: `src/components/AgridWebhookProduction.tsx`
- **Schema**: `src/components/AgridIntegrationSchema.tsx`
- **Schema Docs**: `public/AGRID_INTEGRATION_SCHEMA_README.md`

---

## 🎓 Learning Resources

- [HMAC SHA256](https://en.wikipedia.org/wiki/HMAC)
- [Timing Attack](https://en.wikipedia.org/wiki/Timing_attack)
- [Idempotency](https://restfulapi.net/idempotent-rest-apis/)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

---

**Version:** 2.0.0 (Production Ready)  
**Last Updated:** 2026-01-15  
**Author:** Integration Engineer  
**License:** MIT
