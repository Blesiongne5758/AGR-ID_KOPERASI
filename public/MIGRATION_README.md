# 📊 PostgreSQL Migration Script - Sistem Koperasi Multi-Tenant

## 📋 Ringkasan Eksekutif

Script migrasi PostgreSQL lengkap untuk sistem manajemen koperasi multi-tenant dengan **10 tabel**, **100+ kolom**, **30+ indexes**, dan **3 functions** yang dioptimalkan untuk performa tinggi dan integritas data.

---

## 🎯 Fitur Utama

### ✅ Multi-Tenant Architecture
- Setiap koperasi memiliki data terisolasi
- Support untuk ribuan koperasi dalam satu database
- Unique constraints per koperasi

### ✅ Race Condition Prevention
- `id_sequences` dengan pessimistic locking (`SELECT FOR UPDATE`)
- Generate ID unik per koperasi tanpa konflik
- Auto-reset sequence setiap tahun baru

### ✅ Financial Data Integrity
- Semua kolom keuangan menggunakan `NUMERIC(15,2)`
- CHECK constraints untuk validasi data
- Double-entry bookkeeping dengan `savings_transactions`

### ✅ Performance Optimized
- 30+ indexes (B-tree, GIN, partial indexes)
- Partial indexes untuk query spesifik
- GIN index untuk JSONB payload

### ✅ Audit Trail
- `updated_at` otomatis dengan triggers
- Transaction history lengkap
- Webhook logs untuk integrasi

---

## 📐 Struktur Tabel

### 1. **cooperatives** (Master Koperasi)
```sql
- id: UUID (PK)
- name: VARCHAR(150)
- coop_code: VARCHAR(20) [UNIQUE]
- legal_entity_number: VARCHAR(50)
- address, phone, email
- is_active: BOOLEAN
- created_at, updated_at
```
**Fitur:** Unique coop_code, soft delete support

---

### 2. **users** (Pengguna Global)
```sql
- id: UUID (PK)
- member_id: VARCHAR(30) [UNIQUE] ← Primary Login Key
- password_hash: VARCHAR(255)
- full_name, email, phone [UNIQUE]
- ktp_number, birth_date, gender
- is_verified: BOOLEAN (KYC)
- last_login_at
```
**Fitur:** Unique member_id, KYC fields, password hash

---

### 3. **memberships** (Keanggotaan)
```sql
- id: UUID (PK)
- user_id: UUID (FK → users)
- cooperative_id: UUID (FK → cooperatives)
- role: MEMBER | ADMIN | MANAGER | CHAIRMAN
- status: ACTIVE | INACTIVE | SUSPENDED | PENDING
- approved_by, approved_at
- UNIQUE (user_id, cooperative_id)
```
**Fitur:** Many-to-many relation, role-based access, approval workflow

---

### 4. **id_sequences** (Antrian ID)
```sql
- cooperative_id: UUID (PK, FK)
- current_year: INT
- current_sequence: INT
- last_reset_at: TIMESTAMP
```
**Fitur:** Pessimistic locking, year-based reset, race-condition safe

---

### 5. **savings** (Simpanan)
```sql
- id: UUID (PK)
- membership_id: UUID (FK)
- type: POKOK | WAJIB | SUKARELA
- balance: NUMERIC(15,2)
- UNIQUE (membership_id, type)
- CHECK (balance >= 0)
```
**Fitur:** 3 jenis simpanan per anggota, balance validation

---

### 6. **loans** (Pinjaman)
```sql
- id: UUID (PK)
- membership_id: UUID (FK)
- loan_number: VARCHAR(30) [UNIQUE]
- type: MODAL_USAHA | DARURAT | PAYLATER | MIKRO
- principal_amount, remaining_amount: NUMERIC(15,2)
- interest_rate: NUMERIC(5,2)
- interest_type: FLAT | EFFECTIVE | ANNUITY
- total_installments, paid_installments: INT
- status: PENDING → VERIFIED → APPROVED → DISBURSED → COMPLETED
- CHECK constraints untuk validasi
```
**Fitur:** Multi-type loans, workflow approval, interest calculation

---

### 7. **savings_transactions** (Mutasi Simpanan)
```sql
- id: UUID (PK)
- savings_id: UUID (FK)
- transaction_type: DEPOSIT | WITHDRAWAL | INTEREST | ADJUSTMENT
- amount, balance_before, balance_after: NUMERIC(15,2)
- reference_number, performed_by
```
**Fitur:** Double-entry bookkeeping, audit trail, balance tracking

---

### 8. **loan_installments** (Angsuran)
```sql
- id: UUID (PK)
- loan_id: UUID (FK)
- installment_number: INT
- due_date: DATE
- principal_amount, interest_amount, total_amount: NUMERIC(15,2)
- paid_amount: NUMERIC(15,2)
- status: PENDING | PAID | OVERDUE | PARTIAL
- UNIQUE (loan_id, installment_number)
```
**Fitur:** Per-installment tracking, partial payment support

---

### 9. **api_credentials** (Kredensial API AGRID)
```sql
- id: UUID (PK)
- cooperative_id: UUID (FK)
- api_key: VARCHAR(100) [UNIQUE]
- api_secret_hash: VARCHAR(255)
- rate_limit_per_minute: INT
- expires_at: TIMESTAMP
```
**Fitur:** HMAC-SHA256 authentication, rate limiting, key rotation

---

### 10. **webhook_logs** (Log Webhook)
```sql
- id: UUID (PK)
- cooperative_id: UUID (FK)
- event_type: VARCHAR(50)
- payload: JSONB
- signature: VARCHAR(255)
- status: RECEIVED | PROCESSING | COMPLETED | FAILED
- GIN index on payload
```
**Fitur:** JSONB storage, GIN index for fast search, signature verification

---

## 🔧 Functions & Triggers

### 1. `update_updated_at_column()`
Auto-update `updated_at` timestamp pada setiap UPDATE operation.

**Applied to:** cooperatives, users, memberships, savings, loans, loan_installments, api_credentials

---

### 2. `generate_member_id(cooperative_id UUID)`
Generate unique member_id per koperasi dengan format: `[coop_code][sequence_4_digits]`

**Example:** `AGR0001`, `AGR0002`, `KPM0001`

**Features:**
- Pessimistic locking dengan `SELECT FOR UPDATE`
- Auto-reset sequence setiap tahun baru
- Race-condition safe

---

### 3. `generate_loan_number(cooperative_id UUID)`
Generate unique loan_number dengan format: `[coop_code]/[year]/[sequence_4_digits]`

**Example:** `AGR/2026/0001`, `AGR/2026/0002`

---

## 📊 Indexes untuk Performa

### Partial Indexes (Optimized Queries)
```sql
-- Hanya index baris aktif
CREATE INDEX idx_cooperatives_is_active ON cooperatives(is_active) 
WHERE is_active = TRUE;

-- Hanya index pinjaman aktif
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date) 
WHERE status IN ('DISBURSED', 'OVERDUE');
```

### GIN Index (JSONB Search)
```sql
-- Fast search pada webhook payload
CREATE INDEX idx_webhook_logs_payload ON webhook_logs USING GIN (payload);
```

### Composite Indexes
```sql
-- Optimized untuk query multi-kolom
CREATE INDEX idx_memberships_user_coop ON memberships(user_id, cooperative_id);
```

---

## 🚀 Cara Menggunakan

### 1. Install PostgreSQL 14+
```bash
# Ubuntu/Debian
sudo apt install postgresql-14

# macOS (Homebrew)
brew install postgresql@14
```

### 2. Create Database
```bash
createdb koperasi_db
```

### 3. Run Migration Script
```bash
psql -U postgres -d koperasi_db -f 001_initial_schema.sql
```

### 4. Verify Tables
```sql
\dt  -- List all tables
\d cooperatives  -- Show table structure
```

---

## 🔐 Security Features

### ✅ Password Hashing
- Gunakan bcrypt atau argon2 untuk `password_hash`
- Jangan pernah simpan plain text password

### ✅ API Secret Hashing
- `api_secret_hash` menyimpan hash dari API secret
- Original secret hanya ditampilkan sekali saat generate

### ✅ Row-Level Security (RLS)
- Dapat diimplementasikan untuk multi-tenant isolation
- Setiap query otomatis filter berdasarkan `cooperative_id`

### ✅ CHECK Constraints
- Validasi data di level database
- Mencegah invalid data masuk

---

## 📈 Performance Tips

### 1. Connection Pooling
Gunakan PgBouncer untuk manage connections:
```bash
# Install PgBouncer
sudo apt install pgbouncer
```

### 2. Partitioning (Future)
Untuk tabel besar, pertimbangkan partitioning by year:
```sql
CREATE TABLE savings_2026 PARTITION OF savings
FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

### 3. Materialized Views
Untuk report yang sering diakses:
```sql
CREATE MATERIALIZED VIEW mv_monthly_savings AS
SELECT date_trunc('month', created_at) as month, 
       SUM(balance) as total_savings
FROM savings
GROUP BY 1;
```

---

## 🧪 Sample Data

Script sudah include sample data untuk testing:
- 1 koperasi: "Koperasi AGRID Sejahtera" (code: AGR)
- Initialized id_sequences untuk cooperative tersebut

---

## 📝 Best Practices

### ✅ DO
- Gunakan UUID untuk primary key (globally unique)
- Gunakan NUMERIC untuk data keuangan (exact precision)
- Tambahkan COMMENT pada setiap kolom (dokumentasi)
- Gunakan transactions untuk multi-table operations
- Backup database secara rutin

### ❌ DON'T
- Jangan simpan password plain text
- Jangan gunakan FLOAT untuk data keuangan
- Jangan skip indexes pada kolom yang sering di-query
- Jangan forget to test migration di staging environment

---

## 🔄 Migration Strategy

### Version Control
```
migrations/
├── 001_initial_schema.sql
├── 002_add_audit_logs.sql
├── 003_create_reports_table.sql
└── ...
```

### Rollback Plan
Setiap migration harus punya rollback script:
```sql
-- Rollback 001_initial_schema.sql
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS api_credentials CASCADE;
-- ... dst
```

---

## 📚 Dokumentasi Lengkap

File SQL lengkap tersedia di:
- **File:** `public/migrations/001_initial_schema.sql`
- **Size:** ~15KB
- **Lines:** 500+
- **Comments:** Setiap kolom memiliki COMMENT

---

## 🎓 Learning Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [UUID vs Serial](https://blog.codinghorror.com/primary-keys-ids-versus-guids/)
- [NUMERIC vs FLOAT](https://dev.mysql.com/doc/refman/8.0/en/fixed-point-types.html)
- [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)

---

## 📞 Support

Untuk pertanyaan atau issue:
- Check dokumentasi di website
- Review SQL comments di file migration
- Test di local environment sebelum production

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Senior Database Engineer  
**License:** MIT
