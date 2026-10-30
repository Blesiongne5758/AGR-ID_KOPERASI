# 🔄 Integrasi Database Koperasi ke AGR-ID

Panduan lengkap untuk mengintegrasikan database koperasi ke repository [AGR-ID](https://github.com/blesiongne5758/agr-id).

## 📋 Daftar Isi

- [Arsitektur Integrasi](#-arsitektur-integrasi)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Cara Kerja](#-cara-kerja)
- [API Endpoints](#-api-endpoints)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)

## 🏗️ Arsitektur Integrasi

```
┌─────────────────────────────────────────────────────────────┐
│                    KOPERASI DATABASE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ cooperatives │  │   members    │  │ sync_logs    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRATION SERVER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Service    │  │  Scheduler   │  │  API Routes  │      │
│  │  (agridSync) │  │  (node-cron) │  │  (Express)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ POST /api/v1/cooperatives/sync
                            │ Authorization: Bearer <token>
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      AGR-ID API                             │
│              https://agr.id/api/v1/cooperatives/sync        │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Prasyarat

Sebelum memulai, pastikan Anda memiliki:

1. **Node.js** v18 atau lebih tinggi
2. **PostgreSQL** v14 atau lebih tinggi
3. **Database** koperasi yang sudah ada
4. **AGR-ID API Token** dari Dashboard Admin AGR-ID
5. **Akses internet** untuk menghubungi AGR-ID API

### Mendapatkan AGR-ID API Token

1. Login ke Dashboard Admin AGR-ID
2. Navigasi ke **Direktori Koperasi**
3. Buat API token dengan role `koperasi`
4. Simpan token dengan aman (jangan commit ke Git!)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd koperasi-agrid-integration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Buat database PostgreSQL
createdb koperasi_db

# Jalankan migration
npm run db:init
```

Atau manual:
```bash
psql -U username -d koperasi_db -f database/schema.sql
```

### 4. Konfigurasi Environment

```bash
# Copy file .env.example
cp .env.example .env

# Edit file .env dengan konfigurasi Anda
nano .env
```

## ⚙️ Konfigurasi

### Environment Variables

Edit file `.env`:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/koperasi_db

# AGR-ID Configuration
AGRID_BASE_URL=https://agr.id
AGRID_API_TOKEN=your_agrid_api_token_here

# Scheduler Configuration
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Penjelasan Variabel

| Variabel | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost:5432/db` |
| `AGRID_BASE_URL` | Base URL AGR-ID API | `https://agr.id` |
| `AGRID_API_TOKEN` | Token autentikasi AGR-ID | `agrid_koperasi_xxxxx` |
| `AGRID_SYNC_SCHEDULE` | Cron schedule untuk auto-sync | `0 2 * * *` (setiap hari jam 2 pagi) |
| `PORT` | Port server | `3000` |

## 🔧 Cara Kerja

### 1. Struktur Database

```sql
-- Tabel Koperasi
cooperatives (
  id UUID PRIMARY KEY,
  code VARCHAR(50),      -- Kode koperasi (KOP-001)
  name VARCHAR(255),     -- Nama koperasi
  is_active BOOLEAN      -- Status aktif
)

-- Tabel Anggota
members (
  id UUID PRIMARY KEY,
  cooperative_id UUID,   -- FK ke cooperatives
  member_number VARCHAR, -- Nomor anggota (A-1001)
  name VARCHAR(255),     -- Nama anggota
  email VARCHAR(255),    -- Email anggota
  is_active BOOLEAN      -- Status aktif
)

-- Tabel Sync Logs
agrid_sync_logs (
  id UUID PRIMARY KEY,
  sync_type VARCHAR,     -- SNAPSHOT atau PARTIAL
  status VARCHAR,        -- SUCCESS, FAILED, PENDING
  payload JSONB,         -- Data yang dikirim
  response JSONB,        -- Response dari AGR-ID
  error_message TEXT     -- Error jika gagal
)
```

### 2. Flow Sinkronisasi

```
1. Fetch Data dari Database
   └─> SELECT cooperatives + members
   
2. Build Payload
   └─> Format sesuai spesifikasi AGR-ID
   
3. Kirim ke AGR-ID
   └─> POST /api/v1/cooperatives/sync
   └─> Authorization: Bearer <token>
   
4. Handle Response
   └─> Parse response
   └─> Log ke agrid_sync_logs
   
5. Retry (jika gagal)
   └─> Exponential backoff (2s, 4s, 8s)
   └─> Max 3 attempts
```

### 3. Payload Format

**Request:**
```json
{
  "snapshot": true,
  "cooperatives": [
    {
      "id": "uuid-koperasi",
      "code": "KOP-001",
      "name": "Koperasi Tani Sejahtera",
      "active": true,
      "members": [
        {
          "id": "uuid-anggota",
          "number": "A-1001",
          "name": "Budi Santoso",
          "email": "budi@example.com",
          "active": true
        }
      ]
    }
  ]
}
```

**Response (Success):**
```json
{
  "ok": true,
  "cooperatives_synced": 1,
  "members_synced": 5,
  "snapshot": true
}
```

## 📡 API Endpoints

### 1. Trigger Manual Sync

```bash
POST /api/v1/sync/agrid
```

**Contoh dengan cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

**Response:**
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

### 2. Get Sync History

```bash
GET /api/v1/sync/history?limit=10
```

**Contoh dengan cURL:**
```bash
curl http://localhost:3000/api/v1/sync/history?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sync_type": "SNAPSHOT",
      "cooperatives_count": 2,
      "members_count": 10,
      "status": "SUCCESS",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00Z",
  "service": "AGR-ID Integration Server"
}
```

## 📊 Monitoring

### 1. Query Sync Logs

```sql
-- Lihat 10 sync terakhir
SELECT * FROM agrid_sync_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Lihat sync yang gagal
SELECT * FROM agrid_sync_logs 
WHERE status = 'FAILED' 
ORDER BY created_at DESC;

-- Statistik harian
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
```

### 2. Log Server

```bash
# Lihat log real-time
tail -f logs/server.log

# Atau jika menggunakan PM2
pm2 logs
```

## 🚨 Troubleshooting

### Error: "AGR-ID sync failed: 401"

**Penyebab:** Token AGR-ID tidak valid atau expired.

**Solusi:**
1. Periksa apakah `AGRID_API_TOKEN` sudah benar di `.env`
2. Generate token baru dari Dashboard Admin AGR-ID
3. Restart server setelah update token

### Error: "Connection refused"

**Penyebab:** Database PostgreSQL tidak berjalan atau connection string salah.

**Solusi:**
1. Pastikan PostgreSQL running: `sudo systemctl status postgresql`
2. Periksa `DATABASE_URL` di `.env`
3. Test koneksi: `psql $DATABASE_URL`

### Error: "AGR-ID sync failed after 3 attempts"

**Penyebab:** AGR-ID API tidak merespons atau ada masalah jaringan.

**Solusi:**
1. Periksa koneksi internet
2. Test AGR-ID API: `curl https://agr.id/health`
3. Periksa firewall/proxy settings
4. Cek AGR-ID status page

### Sync tidak berjalan otomatis

**Penyebab:** Scheduler tidak ter-initialize atau cron expression salah.

**Solusi:**
1. Periksa log server untuk pesan "[Scheduler] initialized"
2. Verifikasi `AGRID_SYNC_SCHEDULE` di `.env`
3. Test cron expression di [crontab.guru](https://crontab.guru/)

## 🔐 Security Best Practices

### 1. Jangan Commit Token ke Git

Tambahkan ke `.gitignore`:
```
.env
.env.local
.env.production
```

### 2. Gunakan Environment Variables

Jangan hardcode token di code:
```javascript
// ❌ BAD
const token = 'agrid_koperasi_xxxxx';

// ✅ GOOD
const token = process.env.AGRID_API_TOKEN;
```

### 3. Rotate Token Secara Berkala

- Rotate token setiap 90 hari
- Update `.env` dan restart server
- Monitor sync logs setelah rotation

### 4. Batasi Akses API

Gunakan firewall atau IP whitelist:
```javascript
// Contoh dengan express-ipfilter
const ipfilter = require('express-ipfilter').IpFilter;
const ips = ['127.0.0.1', '192.168.1.100'];
app.use(ipfilter(ips, { mode: 'allow' }));
```

## 📚 Referensi

- [AGR-ID Repository](https://github.com/blesiongne5758/agr-id)
- [AGR-ID API Documentation](https://agr.id/docs/api)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-cron Documentation](https://www.npmjs.com/package/node-cron)
- [Cron Expression Tutorial](https://crontab.guru/)

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

## 📄 License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 📞 Support

Untuk pertanyaan atau issue:
- Buka issue di GitHub repository
- Email: support@koperasi.id
- Discord: [Koperasi Community](https://discord.gg/koperasi)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Integration Team
