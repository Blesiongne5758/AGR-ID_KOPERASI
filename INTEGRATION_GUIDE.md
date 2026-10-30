# 🔄 Cara Integrasi Database Koperasi ke AGR-ID

Panduan lengkap step-by-step untuk mengintegrasikan database koperasi ke repository AGR-ID.

## 📋 Gambaran Umum

Integrasi ini memungkinkan data koperasi dan anggota dari database lokal Anda disinkronkan ke AGR-ID Marketplace secara otomatis atau manual.

```
Database Koperasi → Integration Server → AGR-ID API
```

## 🎯 Tujuan Integrasi

1. **Sinkronisasi Data**: Data koperasi dan anggota otomatis tersinkron ke AGR-ID
2. **Verifikasi Anggota**: Anggota koperasi dapat diverifikasi di AGR-ID
3. **Paylater Integration**: Anggota dapat menggunakan Paylater di AGR-ID
4. **Real-time Updates**: Data selalu up-to-date antara sistem

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│              DATABASE KOPERASI (PostgreSQL)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ cooperatives │  │   members    │  │ sync_logs    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              INTEGRATION SERVER (Node.js)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Service    │  │  Scheduler   │  │  API Routes  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            │ POST /api/v1/cooperatives/sync
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AGR-ID API                            │
│              https://agr.id/api/v1                       │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Langkah-Langkah Integrasi

### Step 1: Persiapan Database (5 menit)

#### 1.1 Buat Database PostgreSQL

```bash
# Install PostgreSQL (jika belum)
sudo apt install postgresql

# Buat database
createdb koperasi_db

# Login ke PostgreSQL
psql -U postgres
```

#### 1.2 Jalankan Schema

```sql
-- Di PostgreSQL prompt
\i database/schema.sql

-- Atau dari command line
psql -U postgres -d koperasi_db -f database/schema.sql
```

#### 1.3 Verifikasi Tabel

```sql
-- Cek tabel sudah dibuat
\dt

-- Output yang diharapkan:
-- cooperatives
-- members
-- agrid_sync_logs
```

### Step 2: Konfigurasi Server (5 menit)

#### 2.1 Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd koperasi-agrid-integration

# Install npm packages
npm install
```

#### 2.2 Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

**Isi file .env:**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/koperasi_db

# AGR-ID
AGRID_BASE_URL=https://agr.id
AGRID_API_TOKEN=your_token_from_agrid_dashboard

# Scheduler
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server
PORT=3000
NODE_ENV=development
```

#### 2.3 Dapatkan AGR-ID API Token

1. Login ke Dashboard Admin AGR-ID
2. Navigasi ke **Direktori Koperasi**
3. Klik **Create API Token**
4. Pilih role: `koperasi`
5. Copy token dan paste ke `.env`

### Step 3: Jalankan Server (2 menit)

```bash
# Development mode
npm run dev

# Production mode
npm start
```

**Output yang diharapkan:**
```
[Server] AGR-ID Integration Server running on port 3000
[Scheduler] Initializing AGR-ID sync scheduler...
[Scheduler] Schedule: 0 2 * * *
[Scheduler] AGR-ID sync scheduler initialized successfully
[Server] Ready to accept requests
```

### Step 4: Test Koneksi (2 menit)

#### 4.1 Health Check

```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "service": "AGR-ID Integration Server"
}
```

#### 4.2 Test Manual Sync

```bash
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

**Expected response:**
```json
{
  "success": true,
  "message": "AGR-ID sync completed successfully",
  "data": {
    "cooperatives_synced": 2,
    "members_synced": 3,
    "snapshot": true
  }
}
```

### Step 5: Verifikasi di AGR-ID (2 menit)

1. Login ke Dashboard Admin AGR-ID
2. Navigasi ke **Direktori Koperasi**
3. Cari koperasi Anda (KOP-001, KOP-002)
4. Klik untuk melihat detail
5. Verifikasi anggota sudah muncul

## 📊 Memahami Cara Kerja

### 1. Fetch Data dari Database

```javascript
// Query untuk fetch koperasi + anggota
SELECT 
  c.id, c.code, c.name, c.is_active,
  json_agg(
    json_build_object(
      'id', m.id,
      'number', m.member_number,
      'name', m.name,
      'email', m.email,
      'active', m.is_active
    )
  ) as members
FROM cooperatives c
LEFT JOIN members m ON c.id = m.cooperative_id
WHERE c.is_active = true
GROUP BY c.id
```

### 2. Build Payload

```javascript
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

### 3. Kirim ke AGR-ID

```javascript
POST https://agr.id/api/v1/cooperatives/sync
Headers:
  Authorization: Bearer <your-token>
  Content-Type: application/json

Body: [payload di atas]
```

### 4. Handle Response

```javascript
// Success response dari AGR-ID
{
  "ok": true,
  "cooperatives_synced": 2,
  "members_synced": 3,
  "snapshot": true
}
```

### 5. Log ke Database

```sql
INSERT INTO agrid_sync_logs (
  sync_type, cooperatives_count, members_count,
  status, payload, response
) VALUES (
  'SNAPSHOT', 2, 3, 'SUCCESS',
  '{...}', '{...}'
)
```

## 🔄 Automated Sync

### Setup Cron Job

Server sudah memiliki scheduler bawaan yang berjalan otomatis sesuai konfigurasi:

```bash
# Default: Setiap hari jam 02:00 AM
AGRID_SYNC_SCHEDULE=0 2 * * *
```

### Custom Schedule

```bash
# Setiap 6 jam
AGRID_SYNC_SCHEDULE=0 */6 * * *

# Setiap hari jam 08:00
AGRID_SYNC_SCHEDULE=0 8 * * *

# Setiap Senin jam 09:00
AGRID_SYNC_SCHEDULE=0 9 * * 1
```

### Manual Trigger

```bash
# Trigger via API
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

## 📝 Monitoring Sync

### 1. Cek Sync Logs

```bash
# Lihat 10 sync terakhir
psql -U postgres -d koperasi_db -c "
SELECT 
  sync_type,
  cooperatives_count,
  members_count,
  status,
  created_at
FROM agrid_sync_logs
ORDER BY created_at DESC
LIMIT 10;
"
```

### 2. Cek Sync yang Gagal

```bash
psql -U postgres -d koperasi_db -c "
SELECT 
  error_message,
  created_at
FROM agrid_sync_logs
WHERE status = 'FAILED'
ORDER BY created_at DESC;
"
```

### 3. Statistik Harian

```bash
psql -U postgres -d koperasi_db -c "
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_sync_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
"
```

## 🐛 Troubleshooting

### Error: "Connection refused"

**Penyebab:** Database PostgreSQL tidak running

**Solusi:**
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Check status
sudo systemctl status postgresql
```

### Error: "401 Unauthorized"

**Penyebab:** AGRID_API_TOKEN tidak valid

**Solusi:**
1. Periksa token di `.env`
2. Generate token baru dari Dashboard AGR-ID
3. Restart server

### Error: "AGR-ID sync failed after 3 attempts"

**Penyebab:** AGR-ID API tidak accessible

**Solusi:**
1. Check koneksi internet
2. Test AGR-ID API: `curl https://agr.id/health`
3. Periksa firewall settings

### Sync tidak berjalan otomatis

**Penyebab:** Scheduler tidak ter-initialize

**Solusi:**
1. Check log server untuk pesan "[Scheduler] initialized"
2. Restart server
3. Verifikasi `AGRID_SYNC_SCHEDULE` di `.env`

## 🔐 Security Checklist

- [ ] AGRID_API_TOKEN disimpan di `.env` (bukan di code)
- [ ] `.env` ditambahkan ke `.gitignore`
- [ ] Database password kuat
- [ ] HTTPS enabled untuk production
- [ ] Firewall configured
- [ ] Token rotation setiap 90 hari

## 📚 Dokumentasi Lengkap

- **README.md** - Dokumentasi utama
- **QUICKSTART.md** - Quick start guide
- **API.md** - API documentation
- **ARCHITECTURE.md** - System architecture
- **DEPLOYMENT.md** - Deployment guide
- **CONTRIBUTING.md** - Contribution guidelines

## 🎯 Next Steps

Setelah integrasi berhasil:

1. **Setup Production**
   - Deploy ke server production
   - Configure SSL/HTTPS
   - Setup monitoring

2. **Integrate with Your App**
   - Tambahkan form input koperasi & anggota
   - Build dashboard admin
   - Implementasi webhook untuk real-time updates

3. **Monitor & Maintain**
   - Monitor sync logs secara berkala
   - Backup database secara rutin
   - Update dependencies

## 📞 Support

Jika mengalami masalah:

1. Check [README.md](./README.md)
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting)
3. Buka issue di GitHub
4. Hubungi support: support@koperasi.id

---

**Selamat! Integrasi database koperasi ke AGR-ID sudah siap digunakan! 🎉**

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Integration Team
