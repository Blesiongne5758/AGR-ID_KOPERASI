# 🔄 Panduan Lengkap Integrasi Database Koperasi ke AGR-ID

## 📋 Informasi AGR-ID

| Item | Detail |
|------|--------|
| **Repository** | https://github.com/blesiongne5758/agr-id |
| **URL Base** | https://agr.biz.id |
| **Frontend Hosting** | InfinityFree.com |
| **Database** | Supabase |
| **API Endpoint** | `/api/v1/cooperatives/sync` |

---

## 🎯 Tujuan Integrasi

Menghubungkan database koperasi lokal (PostgreSQL) dengan AGR-ID Marketplace yang menggunakan Supabase, sehingga:

1. ✅ Data koperasi dan anggota tersinkronisasi otomatis
2. ✅ Anggota dapat diverifikasi di AGR-ID
3. ✅ Anggota dapat menggunakan Paylater di AGR-ID
4. ✅ Data selalu up-to-date antara sistem

---

## 🏗️ Arsitektur Integrasi

```
┌─────────────────────────────────────────────────────────┐
│         DATABASE KOPERASI (PostgreSQL Lokal)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ cooperatives │  │   members    │  │ sync_logs    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│         INTEGRATION SERVER (Node.js)                    │
│  1. Fetch data dari database lokal                      │
│  2. Build payload sesuai format AGR-ID                  │
│  3. Kirim ke AGR-ID API dengan Bearer token             │
│  4. Handle response & log hasil                         │
└─────────────────────────────────────────────────────────┘
                            │
                            │ POST /api/v1/cooperatives/sync
                            │ Authorization: Bearer <token>
                            ▼
┌─────────────────────────────────────────────────────────┐
│         AGR-ID API (https://agr.biz.id)                 │
│  - Frontend: InfinityFree.com                           │
│  - Database: Supabase                                   │
│  - Repository: github.com/blesiongne5758/agr-id        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│         SUPABASE DATABASE (AGR-ID)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   koperasi   │  │koperasi_     │  │ akun_        │  │
│  │              │  │  anggota     │  │  koperasi_   │  │
│  │              │  │              │  │  link        │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Langkah-Langkah Integrasi (Step-by-Step)

### Step 1: Persiapkan Database Koperasi (5 menit)

#### 1.1 Buat Database PostgreSQL

```bash
# Install PostgreSQL (jika belum)
sudo apt install postgresql

# Buat database
createdb koperasi_db

# Login ke PostgreSQL
psql -U postgres -d koperasi_db
```

#### 1.2 Buat Tabel yang Diperlukan

```sql
-- Tabel cooperatives
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

-- Tabel members
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

-- Tabel sync logs
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

-- Indexes untuk performa
CREATE INDEX idx_members_cooperative ON members(cooperative_id);
CREATE INDEX idx_members_active ON members(is_active);
CREATE INDEX idx_sync_logs_status ON agrid_sync_logs(status);
CREATE INDEX idx_sync_logs_created ON agrid_sync_logs(created_at DESC);
```

#### 1.3 Insert Sample Data

```sql
-- Insert sample cooperatives
INSERT INTO cooperatives (code, name, address, phone, email) VALUES
('KOP-001', 'Koperasi Tani Sejahtera', 'Jl. Pertanian No. 123, Jakarta', '021-12345678', 'info@kop001.id'),
('KOP-002', 'Koperasi Nelayan Makmur', 'Jl. Pantai No. 45, Surabaya', '031-87654321', 'info@kop002.id');

-- Insert sample members
INSERT INTO members (cooperative_id, member_number, name, email, phone) VALUES
((SELECT id FROM cooperatives WHERE code = 'KOP-001'), 'A-1001', 'Budi Santoso', 'budi@example.com', '081234567890'),
((SELECT id FROM cooperatives WHERE code = 'KOP-001'), 'A-1002', 'Siti Nurhaliza', 'siti@example.com', '081234567891'),
((SELECT id FROM cooperatives WHERE code = 'KOP-002'), 'B-2001', 'Ahmad Suryadi', 'ahmad@example.com', '081234567892');
```

#### 1.4 Verifikasi Tabel

```sql
-- Cek tabel sudah dibuat
\dt

-- Cek data sudah masuk
SELECT * FROM cooperatives;
SELECT * FROM members;
```

### Step 2: Dapatkan API Token dari AGR-ID (3 menit)

1. Buka https://agr.biz.id
2. Login ke Dashboard Admin
3. Navigasi ke **Direktori Koperasi**
4. Klik **Create API Token**
5. Pilih role: `koperasi`
6. **Copy token** dan simpan dengan aman

⚠️ **PENTING:** Simpan token di tempat aman, jangan share ke siapa pun!

### Step 3: Setup Integration Server (5 menit)

#### 3.1 Clone Repository

```bash
git clone <repository-url>
cd koperasi-agrid-integration
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Konfigurasi Environment

```bash
# Copy file .env.example
cp .env.example .env

# Edit file .env
nano .env
```

**Isi file .env:**
```bash
# Database Koperasi Lokal
DATABASE_URL=postgresql://postgres:password@localhost:5432/koperasi_db

# AGR-ID Configuration
AGRID_BASE_URL=https://agr.biz.id
AGRID_API_TOKEN=your_token_from_agrid_dashboard
AGRID_REPO_URL=https://github.com/blesiongne5758/agr-id

# Scheduler
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server
PORT=3000
NODE_ENV=development
```

### Step 4: Jalankan Server (2 menit)

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

### Step 5: Test Integrasi (3 menit)

#### 5.1 Health Check

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

#### 5.2 Trigger Manual Sync

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

### Step 6: Verifikasi Data di AGR-ID (2 menit)

1. Login ke Dashboard Admin AGR-ID di https://agr.biz.id
2. Navigasi ke **Direktori Koperasi**
3. Cari koperasi Anda (KOP-001, KOP-002)
4. Klik untuk melihat detail
5. Verifikasi anggota sudah muncul

---

## 🔍 Memahami Cara Kerja

### 1. Fetch Data dari Database Koperasi

```javascript
// Query untuk fetch koperasi + anggota
const query = `
  SELECT 
    c.id, c.code, c.name, c.is_active,
    json_agg(
      json_build_object(
        'id', m.id::text,
        'number', m.member_number,
        'name', m.name,
        'email', m.email,
        'active', m.is_active
      ) ORDER BY m.member_number
    ) FILTER (WHERE m.id IS NOT NULL) as members
  FROM cooperatives c
  LEFT JOIN members m ON c.id = m.cooperative_id
  WHERE c.is_active = true
  GROUP BY c.id, c.code, c.name, c.is_active
`;
```

### 2. Build Payload untuk AGR-ID

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

### 3. Kirim ke AGR-ID API

```javascript
const response = await axios.post(
  'https://agr.biz.id/api/v1/cooperatives/sync',
  payload,
  {
    headers: {
      'Authorization': `Bearer ${AGRID_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### 4. AGR-ID Memproses Data

AGR-ID menerima data dan menyimpan ke Supabase:

```sql
-- Insert ke tabel koperasi
INSERT INTO koperasi (id, code, name, is_active)
VALUES ('uuid', 'KOP-001', 'Koperasi Tani Sejahtera', true);

-- Insert ke tabel koperasi_anggota
INSERT INTO koperasi_anggota (koperasi_id, member_number, name, email, is_active)
VALUES ('uuid-koperasi', 'A-1001', 'Budi Santoso', 'budi@example.com', true);
```

### 5. Verifikasi Anggota di AGR-ID

Ketika pengguna login di AGR-ID:

1. Pengguna memilih koperasi
2. Masukkan nomor anggota dan nama
3. Sistem mencocokkan dengan data di `koperasi_anggota`
4. Jika cocok → status `verified`
5. Jika tidak cocok → masuk antrian verifikasi admin

---

## 🗄️ Struktur Database Supabase (AGR-ID)

### Tabel: koperasi
```sql
CREATE TABLE koperasi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel: koperasi_anggota
```sql
CREATE TABLE koperasi_anggota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  koperasi_id UUID REFERENCES koperasi(id) ON DELETE CASCADE,
  member_number VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(koperasi_id, member_number)
);
```

### Tabel: akun_koperasi_link
```sql
CREATE TABLE akun_koperasi_link (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  koperasi_anggota_id UUID REFERENCES koperasi_anggota(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔄 Automated Sync

### Setup Cron Job

Server sudah memiliki scheduler bawaan yang berjalan otomatis:

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

---

## 📊 Monitoring Sync

### 1. Cek Sync Logs

```bash
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

---

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
2. Test AGR-ID API: `curl https://agr.biz.id/health`
3. Periksa firewall settings

### Sync tidak berjalan otomatis

**Penyebab:** Scheduler tidak ter-initialize

**Solusi:**
1. Check log server untuk pesan "[Scheduler] initialized"
2. Restart server
3. Verifikasi `AGRID_SYNC_SCHEDULE` di `.env`

---

## 🔐 Security Checklist

- [ ] AGRID_API_TOKEN disimpan di `.env` (bukan di code)
- [ ] `.env` ditambahkan ke `.gitignore`
- [ ] Database password kuat
- [ ] HTTPS enabled untuk production
- [ ] Firewall configured
- [ ] Token rotation setiap 90 hari

---

## 📚 Dokumentasi Lengkap

- **[CARA_INTEGRASI.md](./CARA_INTEGRASI.md)** - Step-by-step integration
- **[AGRID_CONFIG.md](./AGRID_CONFIG.md)** - Konfigurasi AGR-ID detail
- **[GITHUB_PAT_GUIDE.md](./GITHUB_PAT_GUIDE.md)** - Cara akses repository
- **[README.md](./README.md)** - Dokumentasi utama
- **[API.md](./API.md)** - API documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

---

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

---

## 📞 Support

Jika mengalami masalah:

1. Check [CARA_INTEGRASI.md](./CARA_INTEGRASI.md)
2. Check [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting)
3. Buka issue di GitHub
4. Hubungi admin AGR-ID melalui dashboard

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**AGR-ID Repository:** https://github.com/blesiongne5758/agr-id  
**AGR-ID URL:** https://agr.biz.id
