# 🔗 Webhook Endpoint - AGRID Order Integration

## 📋 Overview

Webhook endpoint untuk menerima notifikasi order dari AGRID Marketplace. Endpoint ini memverifikasi signature HMAC-SHA256, memproses pembayaran Paylater, dan mencatat transaksi dengan database transaction untuk memastikan konsistensi data.

**Endpoint:** `POST /api/v1/webhooks/agrid-order`  
**File:** `public/code/webhook_agrid.js`  
**Component:** `src/components/WebhookEndpoint.tsx`

---

## 🎯 Fitur Utama

### ✅ Signature Verification
- **HMAC-SHA256**: Verifikasi signature dari AGRID
- **Timestamp Tolerance**: 5 menit (mencegah replay attack)
- **Timing-Safe Comparison**: Mencegah timing attack
- **Event ID Tracking**: Idempotency untuk mencegah duplicate processing

### ✅ Database Transaction
- **ACID Compliance**: BEGIN/COMMIT/ROLLBACK
- **FOR UPDATE Lock**: Pessimistic locking untuk data consistency
- **Membership Validation**: Verifikasi membership aktif
- **Paylater Processing**: Kurangi limit atau catat pembayaran

### ✅ Error Handling
- **Custom Error Classes**: WebhookError dengan status codes
- **Transaction Rollback**: Otomatis rollback jika error
- **Logging**: Audit trail di webhook_logs table
- **Idempotent Response**: 200 OK untuk duplicate events

---

## 🔐 Signature Verification

### Headers yang Diperlukan

```http
POST /api/v1/webhooks/agrid-order HTTP/1.1
Content-Type: application/json
x-agrid-signature: a1b2c3d4e5f6...
x-agrid-timestamp: 1704067200
x-agrid-event-id: evt_xxxxx
```

### Verification Logic

```javascript
// 1. Extract headers
const signature = req.headers['x-agrid-signature'];
const timestamp = req.headers['x-agrid-timestamp'];

// 2. Check timestamp tolerance (5 minutes)
const now = Math.floor(Date.now() / 1000);
const webhookTime = parseInt(timestamp, 10);
if (Math.abs(now - webhookTime) > 300) {
  throw new WebhookError('Webhook timestamp expired', 401);
}

// 3. Create signed payload
const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;

// 4. Generate expected signature
const expectedSignature = crypto
  .createHmac('sha256', AGRID_WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('hex');

// 5. Timing-safe comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);

if (!isValid) {
  throw new WebhookError('Invalid webhook signature', 401);
}
```

---

## 📝 Request Payload

```json
{
  "order_id": "ord_agr_2026_001234",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "order_amount": 750000,
  "status": "PAID",
  "items": [
    {
      "product_id": "prod_001",
      "name": "Beras Organik 5kg",
      "quantity": 2,
      "price": 75000
    }
  ],
  "payment_method": "PAYLATER",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | string | Unique order identifier |
| `member_id` | string | Member ID (AGR-2024-000001) |
| `cooperative_id` | UUID | Cooperative UUID |
| `order_amount` | number | Payment amount (must be > 0) |
| `status` | string | Order status (PAID, PENDING, FAILED) |

---

## 🔄 Processing Flow

### Step 1: Receive Webhook
```
AGRID → POST /api/v1/webhooks/agrid-order
```

### Step 2: Verify Signature
```javascript
verifyWebhookSignature(req.body, signature, timestamp);
```

### Step 3: Idempotency Check
```javascript
const existing = await pool.query(
  'SELECT id FROM webhook_logs WHERE event_id = $1',
  [eventId]
);

if (existing.rows.length > 0) {
  return res.json({ success: true, message: 'Already processed' });
}
```

### Step 4: Begin Transaction
```javascript
await client.query('BEGIN');
```

### Step 5: Find Membership (FOR UPDATE)
```sql
SELECT m.id, m.user_id, m.cooperative_id
FROM memberships m
INNER JOIN users u ON m.user_id = u.id
WHERE u.member_id = $1 AND m.cooperative_id = $2
FOR UPDATE
```

### Step 6: Process Payment
```javascript
if (status === 'PAID') {
  // Find active Paylater loan
  const loan = await client.query(`
    SELECT id, remaining_amount FROM loans
    WHERE membership_id = $1 AND type = 'PAYLATER'
    AND status IN ('DISBURSED', 'OVERDUE')
    FOR UPDATE
  `, [membershipId]);

  if (loan.rows.length > 0) {
    // Reduce Paylater limit
    const newRemaining = loan.rows[0].remaining_amount - order_amount;
    await client.query(
      'UPDATE loans SET remaining_amount = $1 WHERE id = $2',
      [newRemaining, loanId]
    );

    // Record transaction
    await client.query(`
      INSERT INTO savings_transactions (
        savings_id, transaction_type, amount,
        description, reference_number
      ) VALUES ($1, 'LOAN_PAYMENT', $2, $3, $4)
    `, [savingsId, orderAmount, description, orderId]);
  }
}
```

### Step 7: Commit Transaction
```javascript
await client.query('COMMIT');
```

### Step 8: Return Response
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "webhook_id": 123,
    "membership_id": "uuid-here",
    "order_id": "ord_agr_2026_001234",
    "amount_processed": 750000,
    "processing_time_ms": 45
  }
}
```

---

## 🗄️ Database Transaction Details

### Tables Involved

1. **webhook_logs** - Audit trail untuk semua webhook
2. **memberships** - Verifikasi membership aktif
3. **loans** - Update Paylater limit
4. **savings_transactions** - Catat pembayaran

### Transaction Flow

```
BEGIN
  ↓
SELECT membership ... FOR UPDATE (lock row)
  ↓
SELECT loan ... FOR UPDATE (lock row)
  ↓
UPDATE loans SET remaining_amount = ...
  ↓
INSERT INTO savings_transactions ...
  ↓
UPDATE webhook_logs SET status = 'COMPLETED'
  ↓
COMMIT (atau ROLLBACK jika error)
```

### Error Handling

```javascript
try {
  await client.query('BEGIN');
  
  // ... processing logic ...
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 🧪 Testing

### Test dengan cURL

```bash
# Generate signature (untuk testing)
TIMESTAMP=$(date +%s)
PAYLOAD='{"order_id":"test_001","member_id":"AGR-2024-000001","cooperative_id":"uuid","order_amount":750000,"status":"PAID"}'
SIGNATURE=$(echo -n "${TIMESTAMP}.${PAYLOAD}" | openssl dgst -sha256 -hmac "your-webhook-secret" | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:3000/api/v1/webhooks/agrid-order \
  -H "Content-Type: application/json" \
  -H "x-agrid-signature: ${SIGNATURE}" \
  -H "x-agrid-timestamp: ${TIMESTAMP}" \
  -H "x-agrid-event-id: evt_test_001" \
  -d "${PAYLOAD}"
```

### Test dengan Node.js

```javascript
const crypto = require('crypto');
const axios = require('axios');

const webhookSecret = 'your-webhook-secret';
const timestamp = Math.floor(Date.now() / 1000).toString();
const payload = {
  order_id: 'test_001',
  member_id: 'AGR-2024-000001',
  cooperative_id: 'uuid-here',
  order_amount: 750000,
  status: 'PAID',
};

const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload)
  .digest('hex');

axios.post('http://localhost:3000/api/v1/webhooks/agrid-order', payload, {
  headers: {
    'x-agrid-signature': signature,
    'x-agrid-timestamp': timestamp,
    'x-agrid-event-id': 'evt_test_001',
  },
});
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid webhook signature"
}
```

**Causes:**
- Missing signature header
- Invalid HMAC signature
- Timestamp expired (> 5 minutes)

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields in payload"
}
```

**Causes:**
- Missing member_id, cooperative_id, order_amount, atau status
- Invalid order_amount (<= 0)

### 404 Not Found
```json
{
  "success": false,
  "message": "Membership not found or inactive"
}
```

**Causes:**
- member_id tidak ditemukan
- cooperative_id tidak match
- Membership status bukan 'ACTIVE'

### 409 Conflict
```json
{
  "success": false,
  "message": "Payment amount exceeds remaining loan balance"
}
```

**Causes:**
- order_amount > remaining_amount di Paylater loan

### 200 Already Processed
```json
{
  "success": true,
  "message": "Webhook already processed",
  "data": {
    "webhook_id": 123
  }
}
```

**Causes:**
- Event ID sudah diproses sebelumnya (idempotent response)

---

## 🔒 Security Best Practices

### ✅ Implemented
- **HMAC-SHA256**: Signature verification
- **Timestamp Tolerance**: Mencegah replay attack
- **Timing-Safe Comparison**: Mencegah timing attack
- **Idempotency**: Mencegah duplicate processing
- **FOR UPDATE Lock**: Mencegah race condition
- **Transaction Rollback**: ACID compliance
- **Audit Logging**: webhook_logs table

### 🛡️ Additional Recommendations
- **Rate Limiting**: Batasi webhook per IP
- **IP Whitelist**: Hanya terima dari IP AGRID
- **HTTPS Only**: Enforce TLS 1.2+
- **Secret Rotation**: Rotate webhook secret berkala
- **Monitoring**: Alert untuk failed webhooks

---

## 📊 Monitoring & Logging

### Webhook Logs Table

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) UNIQUE,
  event_type VARCHAR(50),
  payload JSONB,
  signature VARCHAR(255),
  is_verified BOOLEAN,
  status VARCHAR(20), -- RECEIVED, PROCESSING, COMPLETED, FAILED
  error_message TEXT,
  cooperative_id UUID,
  received_at TIMESTAMP,
  processed_at TIMESTAMP
);
```

### Query Examples

```sql
-- Failed webhooks (last 24 hours)
SELECT * FROM webhook_logs
WHERE status = 'FAILED'
  AND received_at > NOW() - INTERVAL '24 hours'
ORDER BY received_at DESC;

-- Webhook processing time
SELECT 
  event_id,
  received_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - received_at)) AS processing_time_seconds
FROM webhook_logs
WHERE status = 'COMPLETED'
ORDER BY received_at DESC
LIMIT 10;

-- Daily webhook count
SELECT 
  DATE(received_at) AS date,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') AS success,
  COUNT(*) FILTER (WHERE status = 'FAILED') AS failed
FROM webhook_logs
GROUP BY DATE(received_at)
ORDER BY date DESC;
```

---

## 🚀 Production Checklist

### ✅ Pre-Deployment
- [ ] Set AGRID_WEBHOOK_SECRET environment variable
- [ ] Configure database connection pool
- [ ] Set up webhook_logs table
- [ ] Test signature verification
- [ ] Test idempotency handling
- [ ] Test error scenarios

### ✅ Post-Deployment
- [ ] Register webhook URL di AGRID dashboard
- [ ] Test dengan live webhook
- [ ] Monitor webhook_logs untuk errors
- [ ] Set up alerts untuk failed webhooks
- [ ] Document webhook URL untuk tim

### ✅ Ongoing Maintenance
- [ ] Rotate webhook secret setiap 90 hari
- [ ] Review failed webhooks weekly
- [ ] Monitor processing time
- [ ] Update timestamp tolerance jika perlu
- [ ] Backup webhook_logs table

---

## 📚 Related Files

- **Code**: `public/code/webhook_agrid.js`
- **Component**: `src/components/WebhookEndpoint.tsx`
- **Database**: `public/migrations/001_initial_schema.sql`
- **Integration**: `public/code/auth_api.js`

---

## 🎓 Learning Resources

- [HMAC-SHA256](https://en.wikipedia.org/wiki/HMAC)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [SELECT FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Webhook Best Practices](https://webhook.site/blog/webhook-best-practices.html)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Integration Engineer  
**License:** MIT
