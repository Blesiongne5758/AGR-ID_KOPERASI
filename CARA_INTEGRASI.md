# 🔄 Cara Integrasi Database dengan AGR-ID Repository

## 📋 Informasi AGR-ID

| Item | Detail |
|------|--------|
| **Repository** | https://github.com/blesiongne5758/agr-id |
| **URL Base** | https://agr.biz.id |
| **Frontend Hosting** | InfinityFree.com |
| **Database** | Supabase |
| **API Endpoint** | `/api/v1/cooperatives/sync` |

---

## 🎯 Langkah-Langkah Integrasi

### Step 1: Persiapkan Database Koperasi

Pastikan database PostgreSQL Anda memiliki tabel berikut:

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
    sync_type VARCHAR(20) NOT NULL,
    cooperatives_count INT DEFAULT 0,
    members_count INT DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    payload JSONB,
    response JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Dapatkan API Token dari AGR-ID

1. Buka https://agr.biz.id
2. Login ke Dashboard Admin
3. Navigasi ke **Direktori Koperasi**
4. Klik **Create API Token**
5. Pilih role: `koperasi`
6. Copy token dan simpan dengan aman

### Step 3: Konfigurasi Environment

Edit file `.env`:

```bash
# Database Koperasi
DATABASE_URL=postgresql://user:pass@localhost:5432/koperasi_db

# AGR-ID Configuration
AGRID_BASE_URL=https://agr.biz.id
AGRID_API_TOKEN=your_token_from_agrid_dashboard
AGRID_REPO_URL=https://github.com/blesiongne5758/agr-id

# Scheduler
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server
PORT=3000
NODE_ENV=production
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Jalankan Server

```bash
npm start
```

### Step 6: Test Integrasi

```bash
# Health check
curl https://agr.biz.id/health

# Trigger manual sync
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

---

## 🔍 Memahami Cara Kerja

### 1. Fetch Data dari Database Koperasi

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
POST https://agr.biz.id/api/v1/cooperatives/sync
Headers:
  Authorization: Bearer <your-token>
  Content-Type: application/json

Body: [payload di atas]
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

### 5. Verifikasi Anggota

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
  status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Monitoring Sync

### Query Sync Logs

```sql
-- Lihat 10 sync terakhir
SELECT 
  sync_type,
  cooperatives_count,
  members_count,
  status,
  created_at
FROM agrid_sync_logs
ORDER BY created_at DESC
LIMIT 10;

-- Lihat sync yang gagal
SELECT 
  error_message,
  created_at
FROM agrid_sync_logs
WHERE status = 'FAILED'
ORDER BY created_at DESC;

-- Statistik harian
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_sync_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🔐 Keamanan

### Data yang Dikirim
- ✅ ID koperasi dan anggota
- ✅ Nomor anggota
- ✅ Nama lengkap
- ✅ Email
- ✅ Status aktif

### Data yang TIDAK Dikirim
- ❌ Password
- ❌ Data sensitif lainnya
- ❌ Informasi keuangan

### Best Practices
- Simpan API token di environment variable
- Jangan commit token ke Git
- Gunakan HTTPS untuk semua komunikasi
- Rotate token setiap 90 hari
- Monitor sync logs secara berkala

---

## 🐛 Troubleshooting

### Error: "401 Unauthorized"
**Penyebab:** Token tidak valid

**Solusi:**
1. Periksa `AGRID_API_TOKEN` di `.env`
2. Generate token baru dari Dashboard AGR-ID
3. Restart server

### Error: "Connection refused"
**Penyebab:** AGR-ID API tidak accessible

**Solusi:**
1. Check URL: `https://agr.biz.id`
2. Test: `curl https://agr.biz.id/health`
3. Periksa firewall settings

### Error: "Data tidak cocok"
**Penyebab:** Nomor anggota atau nama tidak match

**Solusi:**
1. Verifikasi data di database lokal
2. Pastikan nomor anggota sesuai
3. Check apakah anggota sudah terdaftar

### Sync tidak berjalan otomatis
**Penyebab:** Scheduler tidak ter-initialize

**Solusi:**
1. Check log server
2. Verifikasi `AGRID_SYNC_SCHEDULE`
3. Restart server

---

## 📚 Referensi

### Repository AGR-ID
- **GitHub:** https://github.com/blesiongne5758/agr-id
- **URL:** https://agr.biz.id
- **Migration:** `0009_cooperative_membership.sql`

### Dokumentasi
- [AGRID_CONFIG.md](./AGRID_CONFIG.md) - Konfigurasi detail
- [README.md](./README.md) - Dokumentasi utama
- [API.md](./API.md) - API documentation
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Step-by-step guide

---

## ✅ Checklist Integrasi

- [ ] Database PostgreSQL sudah setup
- [ ] Tabel cooperatives, members, agrid_sync_logs sudah dibuat
- [ ] API token dari AGR-ID sudah didapat
- [ ] File `.env` sudah dikonfigurasi
- [ ] Server berjalan tanpa error
- [ ] Manual sync berhasil
- [ ] Data muncul di AGR-ID
- [ ] Scheduler berjalan otomatis

---

## 🎯 Next Steps

Setelah integrasi berhasil:

1. **Monitor Sync Logs**
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM agrid_sync_logs ORDER BY created_at DESC LIMIT 5;"
   ```

2. **Setup Production**
   - Deploy ke server production
   - Configure SSL/HTTPS
   - Setup monitoring

3. **Integrate with Your App**
   - Tambahkan form input koperasi & anggota
   - Build dashboard admin
   - Implementasi webhook untuk real-time updates

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**AGR-ID Repository:** https://github.com/blesiongne5758/agr-id  
**AGR-ID URL:** https://agr.biz.id
