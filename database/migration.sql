-- ============================================================================
-- MIGRATION SCRIPT: Sistem Manajemen Koperasi Multi-Tenant
-- Database: PostgreSQL 14+
-- Author: Senior Database Engineer
-- Date: 2026-01-15
-- Version: 1.0.0
-- ============================================================================

-- Drop existing tables (for clean migration)
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS savings CASCADE;
DROP TABLE IF EXISTS id_sequences CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cooperatives CASCADE;

-- ============================================================================
-- 1. TABEL COOPERATIVES (Koperasi)
-- Menyimpan data entitas koperasi yang terdaftar dalam sistem
-- ============================================================================
CREATE TABLE cooperatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    coop_code VARCHAR(20) UNIQUE NOT NULL,
    legal_entity_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for cooperatives table
COMMENT ON TABLE cooperatives IS 'Tabel master untuk entitas koperasi yang terdaftar dalam sistem multi-tenant';
COMMENT ON COLUMN cooperatives.id IS 'Primary key unik (UUID) untuk setiap koperasi';
COMMENT ON COLUMN cooperatives.name IS 'Nama lengkap koperasi (wajib diisi)';
COMMENT ON COLUMN cooperatives.coop_code IS 'Kode unik koperasi (3-4 huruf), contoh: AGR, KPM, SPR';
COMMENT ON COLUMN cooperatives.legal_entity_number IS 'Nomor badan hukum koperasi dari Kementerian Koperasi';
COMMENT ON COLUMN cooperatives.address IS 'Alamat lengkap kantor koperasi';
COMMENT ON COLUMN cooperatives.phone IS 'Nomor telepon kontak koperasi';
COMMENT ON COLUMN cooperatives.email IS 'Email kontak koperasi';
COMMENT ON COLUMN cooperatives.is_active IS 'Status aktif/nonaktif koperasi';
COMMENT ON COLUMN cooperatives.created_at IS 'Timestamp kapan koperasi terdaftar';
COMMENT ON COLUMN cooperatives.updated_at IS 'Timestamp terakhir kali data diupdate';

-- Indexes for cooperatives
CREATE INDEX idx_cooperatives_coop_code ON cooperatives(coop_code);
CREATE INDEX idx_cooperatives_is_active ON cooperatives(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 2. TABEL USERS (Pengguna Global)
-- Menyimpan kredensial login dan data profil pengguna (multi-tenant aware)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    ktp_number VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    address TEXT,
    profile_photo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for users table
COMMENT ON TABLE users IS 'Tabel global untuk semua pengguna sistem (anggota, admin, manager)';
COMMENT ON COLUMN users.id IS 'Primary key unik (UUID) untuk setiap pengguna';
COMMENT ON COLUMN users.member_id IS 'ID Unik Anggota (Primary Login Key), format: [coop_code][sequence], contoh: AGR001';
COMMENT ON COLUMN users.password_hash IS 'Hash password menggunakan bcrypt/argon2 (jangan simpan plain text!)';
COMMENT ON COLUMN users.full_name IS 'Nama lengkap pengguna sesuai KTP';
COMMENT ON COLUMN users.email IS 'Email pengguna (opsional, untuk notifikasi)';
COMMENT ON COLUMN users.phone IS 'Nomor telepon unik (untuk OTP & notifikasi WhatsApp)';
COMMENT ON COLUMN users.ktp_number IS 'Nomor KTP untuk verifikasi identitas';
COMMENT ON COLUMN users.birth_date IS 'Tanggal lahir pengguna';
COMMENT ON COLUMN users.gender IS 'Jenis kelamin: MALE/FEMALE';
COMMENT ON COLUMN users.address IS 'Alamat lengkap pengguna';
COMMENT ON COLUMN users.profile_photo_url IS 'URL foto profil (disimpan di object storage)';
COMMENT ON COLUMN users.is_verified IS 'Status verifikasi identitas (KYC)';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp terakhir kali user login';
COMMENT ON COLUMN users.created_at IS 'Timestamp kapan akun dibuat';
COMMENT ON COLUMN users.updated_at IS 'Timestamp terakhir kali data diupdate';

-- Indexes for users
CREATE INDEX idx_users_member_id ON users(member_id);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- ============================================================================
-- 3. TABEL MEMBERSHIPS (Keanggotaan)
-- Menghubungkan user ke koperasi dengan peran tertentu (many-to-many)
-- ============================================================================
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN', 'MANAGER', 'CHAIRMAN')),
    member_number VARCHAR(30),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_cooperative UNIQUE (user_id, cooperative_id)
);

-- Comments for memberships table
COMMENT ON TABLE memberships IS 'Tabel relasi many-to-many antara users dan cooperatives dengan peran spesifik';
COMMENT ON COLUMN memberships.id IS 'Primary key unik (UUID) untuk setiap keanggotaan';
COMMENT ON COLUMN memberships.user_id IS 'Foreign key ke tabel users (cascade delete)';
COMMENT ON COLUMN memberships.cooperative_id IS 'Foreign key ke tabel cooperatives (cascade delete)';
COMMENT ON COLUMN memberships.role IS 'Peran pengguna: MEMBER (anggota), ADMIN (administrator), MANAGER (pengelola), CHAIRMAN (ketua)';
COMMENT ON COLUMN memberships.member_number IS 'Nomor anggota internal koperasi (opsional)';
COMMENT ON COLUMN memberships.join_date IS 'Tanggal bergabung dengan koperasi';
COMMENT ON COLUMN memberships.status IS 'Status keanggotaan: ACTIVE, INACTIVE, SUSPENDED, PENDING';
COMMENT ON COLUMN memberships.approved_by IS 'User ID yang menyetujui keanggotaan (untuk PENDING)';
COMMENT ON COLUMN memberships.approved_at IS 'Timestamp kapan keanggotaan disetujui';
COMMENT ON COLUMN memberships.created_at IS 'Timestamp kapan record dibuat';
COMMENT ON COLUMN memberships.updated_at IS 'Timestamp terakhir kali diupdate';

-- Indexes for memberships
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_cooperative_id ON memberships(cooperative_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_role ON memberships(role);
CREATE INDEX idx_memberships_user_coop ON memberships(user_id, cooperative_id);

-- ============================================================================
-- 4. TABEL ID_SEQUENCES (Antrian ID per Koperasi)
-- Tracking auto-increment untuk generate ID unik per koperasi (mencegah race condition)
-- ============================================================================
CREATE TABLE id_sequences (
    cooperative_id UUID PRIMARY KEY REFERENCES cooperatives(id) ON DELETE CASCADE,
    current_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    current_sequence INT NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for id_sequences table
COMMENT ON TABLE id_sequences IS 'Tabel untuk tracking sequence ID per koperasi (mencegah race condition dengan pessimistic locking)';
COMMENT ON COLUMN id_sequences.cooperative_id IS 'Primary key & foreign key ke cooperatives (1 koperasi = 1 sequence)';
COMMENT ON COLUMN id_sequences.current_year IS 'Tahun berjalan untuk penomoran (reset setiap tahun baru)';
COMMENT ON COLUMN id_sequences.current_sequence IS 'Nomor urut terakhir yang digunakan (increment dengan SELECT FOR UPDATE)';
COMMENT ON COLUMN id_sequences.last_reset_at IS 'Timestamp terakhir kali sequence direset (awal tahun)';
COMMENT ON COLUMN id_sequences.updated_at IS 'Timestamp terakhir kali sequence diupdate';

-- Index for id_sequences
CREATE INDEX idx_id_sequences_year ON id_sequences(current_year);

-- ============================================================================
-- 5. TABEL SAVINGS (Simpanan)
-- Ledger untuk mencatat saldo simpanan anggota (Pokok, Wajib, Sukarela)
-- ============================================================================
CREATE TABLE savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('POKOK', 'WAJIB', 'SUKARELA')),
    balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'IDR',
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_membership_type UNIQUE (membership_id, type),
    CONSTRAINT chk_balance_positive CHECK (balance >= 0)
);

-- Comments for savings table
COMMENT ON TABLE savings IS 'Tabel ledger untuk saldo simpanan anggota (3 jenis: Pokok, Wajib, Sukarela)';
COMMENT ON COLUMN savings.id IS 'Primary key unik (UUID) untuk setiap record simpanan';
COMMENT ON COLUMN savings.membership_id IS 'Foreign key ke memberships (1 anggota bisa punya 3 jenis simpanan)';
COMMENT ON COLUMN savings.type IS 'Jenis simpanan: POKOK (wajib sekali), WAJIB (bulanan), SUKARELA (fleksibel)';
COMMENT ON COLUMN savings.balance IS 'Saldo saat ini dalam Rupiah (presisi 2 desimal)';
COMMENT ON COLUMN savings.currency IS 'Kode mata uang (default: IDR)';
COMMENT ON COLUMN savings.last_transaction_at IS 'Timestamp transaksi terakhir';
COMMENT ON COLUMN savings.created_at IS 'Timestamp kapan record simpanan dibuat';
COMMENT ON COLUMN savings.updated_at IS 'Timestamp terakhir kali saldo diupdate';

-- Indexes for savings
CREATE INDEX idx_savings_membership_id ON savings(membership_id);
CREATE INDEX idx_savings_type ON savings(type);
CREATE INDEX idx_savings_balance ON savings(balance);

-- ============================================================================
-- 6. TABEL LOANS (Pinjaman)
-- Tracking pinjaman anggota dengan berbagai jenis (Modal Usaha, Darurat, Paylater)
-- ============================================================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    loan_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('MODAL_USAHA', 'DARURAT', 'PAYLATER', 'MIKRO')),
    principal_amount NUMERIC(15,2) NOT NULL,
    remaining_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    interest_type VARCHAR(10) DEFAULT 'FLAT' CHECK (interest_type IN ('FLAT', 'EFFECTIVE', 'ANNUITY')),
    total_installments INT NOT NULL,
    paid_installments INT NOT NULL DEFAULT 0,
    installment_amount NUMERIC(15,2) NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_date DATE,
    disbursement_date DATE,
    due_date DATE NOT NULL,
    next_payment_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED', 'OVERDUE', 'CANCELLED')),
    collateral_description TEXT,
    purpose TEXT,
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_remaining_valid CHECK (remaining_amount >= 0 AND remaining_amount <= principal_amount),
    CONSTRAINT chk_installments_valid CHECK (total_installments > 0 AND paid_installments >= 0 AND paid_installments <= total_installments)
);

-- Comments for loans table
COMMENT ON TABLE loans IS 'Tabel untuk tracking pinjaman anggota dengan berbagai jenis dan workflow approval';
COMMENT ON COLUMN loans.id IS 'Primary key unik (UUID) untuk setiap pinjaman';
COMMENT ON COLUMN loans.membership_id IS 'Foreign key ke memberships (peminjam)';
COMMENT ON COLUMN loans.loan_number IS 'Nomor pinjaman unik (format: [coop_code]/[year]/[sequence])';
COMMENT ON COLUMN loans.type IS 'Jenis pinjaman: MODAL_USAHA, DARURAT, PAYLATER (belanja di AGRID), MIKRO';
COMMENT ON COLUMN loans.principal_amount IS 'Jumlah pokok pinjaman dalam Rupiah';
COMMENT ON COLUMN loans.remaining_amount IS 'Sisa pinjaman yang belum dilunasi';
COMMENT ON COLUMN loans.interest_rate IS 'Suku bunga per bulan (persentase, contoh: 1.50 = 1.5%)';
COMMENT ON COLUMN loans.interest_type IS 'Metode perhitungan bunga: FLAT, EFFECTIVE, ANNUITY';
COMMENT ON COLUMN loans.total_installments IS 'Total jumlah angsuran';
COMMENT ON COLUMN loans.paid_installments IS 'Jumlah angsuran yang sudah dibayar';
COMMENT ON COLUMN loans.installment_amount IS 'Jumlah angsuran per bulan (pokok + bunga)';
COMMENT ON COLUMN loans.applied_date IS 'Tanggal pengajuan pinjaman';
COMMENT ON COLUMN loans.approved_date IS 'Tanggal pinjaman disetujui';
COMMENT ON COLUMN loans.disbursement_date IS 'Tanggal pencairan dana';
COMMENT ON COLUMN loans.due_date IS 'Tanggal jatuh tempo terakhir';
COMMENT ON COLUMN loans.next_payment_date IS 'Tanggal jatuh tempo angsuran berikutnya';
COMMENT ON COLUMN loans.status IS 'Status pinjaman: PENDING, VERIFIED, APPROVED, DISBURSED, COMPLETED, OVERDUE, CANCELLED';
COMMENT ON COLUMN loans.collateral_description IS 'Deskripsi jaminan (jika ada)';
COMMENT ON COLUMN loans.purpose IS 'Tujuan penggunaan pinjaman';
COMMENT ON COLUMN loans.approved_by IS 'User ID yang menyetujui pinjaman';
COMMENT ON COLUMN loans.notes IS 'Catatan tambahan untuk pinjaman';
COMMENT ON COLUMN loans.created_at IS 'Timestamp kapan record dibuat';
COMMENT ON COLUMN loans.updated_at IS 'Timestamp terakhir kali diupdate';

-- Indexes for loans
CREATE INDEX idx_loans_membership_id ON loans(membership_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_type ON loans(type);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date) WHERE status IN ('DISBURSED', 'OVERDUE');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_cooperatives_updated_at BEFORE UPDATE ON cooperatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_id_sequences_updated_at BEFORE UPDATE ON id_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample cooperative
INSERT INTO cooperatives (name, coop_code, legal_entity_number, address, phone, email)
VALUES (
    'Koperasi AGRID Sejahtera',
    'AGR',
    'BH-123/2024',
    'Jl. Pertanian No. 123, Jakarta',
    '021-12345678',
    'info@agrid-koperasi.co.id'
);

-- Initialize ID sequence for the cooperative
INSERT INTO id_sequences (cooperative_id, current_year, current_sequence)
SELECT id, EXTRACT(YEAR FROM CURRENT_DATE), 0
FROM cooperatives WHERE coop_code = 'AGR';

-- ============================================================================
-- END OF MIGRATION SCRIPT
-- ============================================================================
