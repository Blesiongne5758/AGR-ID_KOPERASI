# 📡 API Documentation

Dokumentasi lengkap API untuk integrasi AGR-ID.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Semua endpoint memerlukan API token yang disimpan di environment variable `AGRID_API_TOKEN`.

Token ini digunakan untuk autentikasi ke AGR-ID API, bukan untuk autentikasi ke server integrasi ini.

---

## Endpoints

### 1. Trigger Manual Sync

Sinkronisasi manual semua data koperasi ke AGR-ID.

**Endpoint:**
```
POST /api/v1/sync/agrid
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```
Tidak ada request body
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "AGR-ID sync completed successfully",
  "data": {
    "cooperatives_synced": 2,
    "members_synced": 10,
    "snapshot": true
  }
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "message": "AGR-ID sync failed",
  "error": "AGR-ID sync failed: 401 - Invalid token"
}
```

**Contoh cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

**Contoh JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/sync/agrid', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
console.log(data);
```

---

### 2. Get Sync History

Mendapatkan riwayat sinkronisasi dari database.

**Endpoint:**
```
GET /api/v1/sync/history
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Jumlah record yang diambil (max: 100) |

**Headers:**
```
Content-Type: application/json
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sync_type": "SNAPSHOT",
      "cooperatives_count": 2,
      "members_count": 10,
      "status": "SUCCESS",
      "error_message": null,
      "created_at": "2026-01-15T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "sync_type": "SNAPSHOT",
      "cooperatives_count": 2,
      "members_count": 10,
      "status": "FAILED",
      "error_message": "AGR-ID sync failed: 401",
      "created_at": "2026-01-14T10:30:00.000Z"
    }
  ]
}
```

**Contoh cURL:**
```bash
# Default limit (10)
curl http://localhost:3000/api/v1/sync/history

# Custom limit
curl http://localhost:3000/api/v1/sync/history?limit=20
```

**Contoh JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/api/v1/sync/history?limit=20');
const data = await response.json();
console.log(data);
```

---

### 3. Health Check

Mengecek status server.

**Endpoint:**
```
GET /health
```

**Response (Success - 200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "service": "AGR-ID Integration Server"
}
```

**Contoh cURL:**
```bash
curl http://localhost:3000/health
```

---

### 4. Root Endpoint

Informasi dasar server.

**Endpoint:**
```
GET /
```

**Response (Success - 200):**
```json
{
  "message": "AGR-ID Integration Server",
  "version": "1.0.0",
  "endpoints": {
    "POST /api/v1/sync/agrid": "Trigger full sync ke AGR-ID",
    "GET /api/v1/sync/history": "Get sync history",
    "GET /health": "Health check"
  }
}
```

---

## Error Responses

### Format Error

Semua error response mengikuti format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

### Common Errors

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "AGR-ID sync failed",
  "error": "AGR-ID sync failed: 401 - Invalid token"
}
```

**Penyebab:**
- AGRID_API_TOKEN tidak valid
- Token expired
- Token tidak memiliki permission yang cukup

**Solusi:**
- Periksa AGRID_API_TOKEN di .env
- Generate token baru dari Dashboard AGR-ID
- Restart server setelah update token

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "AGR-ID sync failed",
  "error": "Connection refused"
}
```

**Penyebab:**
- Database tidak running
- AGR-ID API tidak accessible
- Network error

**Solusi:**
- Periksa koneksi database
- Periksa koneksi internet
- Cek log server untuk detail error

---

## Rate Limiting

Server ini tidak memiliki rate limiting bawaan. Untuk production, disarankan menggunakan:

### 1. Nginx Rate Limiting

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20;
            proxy_pass http://localhost:3000;
        }
    }
}
```

### 2. Express Rate Limit

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

---

## Testing

### Manual Testing dengan cURL

```bash
# Health check
curl http://localhost:3000/health

# Trigger sync
curl -X POST http://localhost:3000/api/v1/sync/agrid

# Get history
curl http://localhost:3000/api/v1/sync/history?limit=5
```

### Automated Testing dengan Jest

```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  test('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  test('POST /api/v1/sync/agrid should trigger sync', async () => {
    const res = await request(app).post('/api/v1/sync/agrid');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
  });

  test('GET /api/v1/sync/history should return history', async () => {
    const res = await request(app).get('/api/v1/sync/history');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
class AgridIntegrationClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async triggerSync() {
    const response = await fetch(`${this.baseUrl}/api/v1/sync/agrid`, {
      method: 'POST',
    });
    return response.json();
  }

  async getHistory(limit = 10) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/sync/history?limit=${limit}`
    );
    return response.json();
  }

  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Usage
const client = new AgridIntegrationClient('http://localhost:3000');
const result = await client.triggerSync();
console.log(result);
```

### Python

```python
import requests

class AgridIntegrationClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def trigger_sync(self):
        response = requests.post(f'{self.base_url}/api/v1/sync/agrid')
        return response.json()

    def get_history(self, limit=10):
        response = requests.get(
            f'{self.base_url}/api/v1/sync/history',
            params={'limit': limit}
        )
        return response.json()

    def health_check(self):
        response = requests.get(f'{self.base_url}/health')
        return response.json()

# Usage
client = AgridIntegrationClient('http://localhost:3000')
result = client.trigger_sync()
print(result)
```

### PHP

```php
<?php

class AgridIntegrationClient {
    private $baseUrl;

    public function __construct($baseUrl) {
        $this->baseUrl = $baseUrl;
    }

    public function triggerSync() {
        $ch = curl_init($this->baseUrl . '/api/v1/sync/agrid');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }

    public function getHistory($limit = 10) {
        $ch = curl_init($this->baseUrl . '/api/v1/sync/history?limit=' . $limit);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true);
    }
}

// Usage
$client = new AgridIntegrationClient('http://localhost:3000');
$result = $client->triggerSync();
print_r($result);

?>
```

---

## Webhooks (Future)

Untuk real-time updates, AGR-ID dapat mengirim webhook ke server integrasi:

### Webhook Endpoint

```
POST /api/v1/webhooks/agrid
```

**Payload:**
```json
{
  "event": "member.registered",
  "data": {
    "member_id": "uuid",
    "cooperative_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2026-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received"
}
```

---

## Changelog

### v1.0.0 (2026-01-15)
- Initial release
- POST /api/v1/sync/agrid
- GET /api/v1/sync/history
- GET /health
- GET /

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** API Team
