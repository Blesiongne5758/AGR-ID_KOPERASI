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
-- 7. TABEL SAVINGS_TRANSACTIONS (Mutasi Simpanan)
-- Detail transaksi simpanan (setor, tarik, bunga) untuk audit trail
-- ============================================================================
CREATE TABLE savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    savings_id UUID NOT NULL REFERENCES savings(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'INTEREST', 'ADJUSTMENT')),
    amount NUMERIC(15,2) NOT NULL,
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- Comments for savings_transactions table
COMMENT ON TABLE savings_transactions IS 'Tabel detail mutasi simpanan untuk audit trail (double-entry bookkeeping)';
COMMENT ON COLUMN savings_transactions.id IS 'Primary key unik (UUID)';
COMMENT ON COLUMN savings_transactions.savings_id IS 'Foreign key ke savings';
COMMENT ON COLUMN savings_transactions.transaction_type IS 'Jenis transaksi: DEPOSIT (setor), WITHDRAWAL (tarik), INTEREST (bunga), ADJUSTMENT (koreksi)';
COMMENT ON COLUMN savings_transactions.amount IS 'Jumlah transaksi dalam Rupiah';
COMMENT ON COLUMN savings_transactions.balance_before IS 'Saldo sebelum transaksi';
COMMENT ON COLUMN savings_transactions.balance_after IS 'Saldo setelah transaksi';
COMMENT ON COLUMN savings_transactions.description IS 'Deskripsi transaksi';
COMMENT ON COLUMN savings_transactions.reference_number IS 'Nomor referensi transaksi';
COMMENT ON COLUMN savings_transactions.performed_by IS 'User ID yang melakukan transaksi';
COMMENT ON COLUMN savings_transactions.created_at IS 'Timestamp transaksi';

-- Indexes for savings_transactions
CREATE INDEX idx_savings_trans_savings_id ON savings_transactions(savings_id);
CREATE INDEX idx_savings_trans_type ON savings_transactions(transaction_type);
CREATE INDEX idx_savings_trans_created ON savings_transactions(created_at DESC);

-- ============================================================================
-- 8. TABEL LOAN_INSTALLMENTS (Angsuran Pinjaman)
-- Detail angsuran pinjaman untuk tracking pembayaran
-- ============================================================================
CREATE TABLE loan_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_amount NUMERIC(15,2) NOT NULL,
    interest_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loan_installment UNIQUE (loan_id, installment_number),
    CONSTRAINT chk_installment_amounts CHECK (principal_amount > 0 AND interest_amount >= 0 AND total_amount > 0)
);

-- Comments for loan_installments table
COMMENT ON TABLE loan_installments IS 'Tabel detail angsuran pinjaman untuk tracking pembayaran per periode';
COMMENT ON COLUMN loan_installments.id IS 'Primary key unik (UUID)';
COMMENT ON COLUMN loan_installments.loan_id IS 'Foreign key ke loans';
COMMENT ON COLUMN loan_installments.installment_number IS 'Nomor angsuran (1, 2, 3, ...)';
COMMENT ON COLUMN loan_installments.due_date IS 'Tanggal jatuh tempo angsuran';
COMMENT ON COLUMN loan_installments.principal_amount IS 'Jumlah pokok angsuran';
COMMENT ON COLUMN loan_installments.interest_amount IS 'Jumlah bunga angsuran';
COMMENT ON COLUMN loan_installments.total_amount IS 'Total angsuran (pokok + bunga)';
COMMENT ON COLUMN loan_installments.paid_amount IS 'Jumlah yang sudah dibayar';
COMMENT ON COLUMN loan_installments.paid_date IS 'Tanggal pembayaran';
COMMENT ON COLUMN loan_installments.status IS 'Status angsuran: PENDING, PAID, OVERDUE, PARTIAL';
COMMENT ON COLUMN loan_installments.notes IS 'Catatan tambahan';
COMMENT ON COLUMN loan_installments.created_at IS 'Timestamp record dibuat';
COMMENT ON COLUMN loan_installments.updated_at IS 'Timestamp terakhir diupdate';

-- Indexes for loan_installments
CREATE INDEX idx_loan_inst_loan_id ON loan_installments(loan_id);
CREATE INDEX idx_loan_inst_due_date ON loan_installments(due_date);
CREATE INDEX idx_loan_inst_status ON loan_installments(status);

-- ============================================================================
-- 9. TABEL API_CREDENTIALS (Kredensial API AGRID)
-- Menyimpan API key & secret untuk integrasi dengan AGRID Marketplace
-- ============================================================================
CREATE TABLE api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    api_secret_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for api_credentials table
COMMENT ON TABLE api_credentials IS 'Tabel kredensial API untuk integrasi dengan AGRID Marketplace';
COMMENT ON COLUMN api_credentials.id IS 'Primary key unik (UUID)';
COMMENT ON COLUMN api_credentials.cooperative_id IS 'Foreign key ke cooperatives';
COMMENT ON COLUMN api_credentials.api_key IS 'API key publik (prefix: agride_live_)';
COMMENT ON COLUMN api_credentials.api_secret_hash IS 'Hash dari API secret (jangan simpan plain text!)';
COMMENT ON COLUMN api_credentials.is_active IS 'Status aktif/nonaktif kredensial';
COMMENT ON COLUMN api_credentials.rate_limit_per_minute IS 'Batas request per menit';
COMMENT ON COLUMN api_credentials.last_used_at IS 'Timestamp terakhir kali API digunakan';
COMMENT ON COLUMN api_credentials.expires_at IS 'Tanggal kadaluarsa kredensial';
COMMENT ON COLUMN api_credentials.created_at IS 'Timestamp kapan kredensial dibuat';
COMMENT ON COLUMN api_credentials.updated_at IS 'Timestamp terakhir kali diupdate';

-- Indexes for api_credentials
CREATE INDEX idx_api_creds_cooperative ON api_credentials(cooperative_id);
CREATE INDEX idx_api_creds_api_key ON api_credentials(api_key);
CREATE INDEX idx_api_creds_is_active ON api_credentials(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 10. TABEL WEBHOOK_LOGS (Log Webhook)
-- Menyimpan log webhook yang diterima dari AGRID untuk audit & debugging
-- ============================================================================
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID REFERENCES cooperatives(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments for webhook_logs table
COMMENT ON TABLE webhook_logs IS 'Tabel log webhook yang diterima dari AGRID Marketplace untuk audit & debugging';
COMMENT ON COLUMN webhook_logs.id IS 'Primary key unik (UUID)';
COMMENT ON COLUMN webhook_logs.cooperative_id IS 'Foreign key ke cooperatives (nullable jika belum teridentifikasi)';
COMMENT ON COLUMN webhook_logs.event_type IS 'Jenis event: order.created, paylater.used, payment.completed, dll';
COMMENT ON COLUMN webhook_logs.payload IS 'Payload JSON lengkap dari webhook';
COMMENT ON COLUMN webhook_logs.signature IS 'HMAC signature dari AGRID untuk verifikasi';
COMMENT ON COLUMN webhook_logs.is_verified IS 'Status verifikasi signature';
COMMENT ON COLUMN webhook_logs.processed_at IS 'Timestamp kapan webhook diproses';
COMMENT ON COLUMN webhook_logs.status IS 'Status pemrosesan: RECEIVED, PROCESSING, COMPLETED, FAILED';
COMMENT ON COLUMN webhook_logs.error_message IS 'Pesan error jika pemrosesan gagal';
COMMENT ON COLUMN webhook_logs.received_at IS 'Timestamp kapan webhook diterima';

-- Indexes for webhook_logs
CREATE INDEX idx_webhook_logs_cooperative ON webhook_logs(cooperative_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_received ON webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_payload ON webhook_logs USING GIN (payload);

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

CREATE TRIGGER update_loan_installments_updated_at BEFORE UPDATE ON loan_installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_credentials_updated_at BEFORE UPDATE ON api_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate unique member_id per cooperative
CREATE OR REPLACE FUNCTION generate_member_id(p_cooperative_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_coop_code VARCHAR;
    v_year INT;
    v_sequence INT;
    v_member_id VARCHAR;
BEGIN
    -- Get cooperative code
    SELECT coop_code INTO v_coop_code FROM cooperatives WHERE id = p_cooperative_id;
    
    IF v_coop_code IS NULL THEN
        RAISE EXCEPTION 'Cooperative not found';
    END IF;
    
    -- Get current year and sequence with pessimistic locking
    SELECT current_year, current_sequence INTO v_year, v_sequence
    FROM id_sequences
    WHERE cooperative_id = p_cooperative_id
    FOR UPDATE;
    
    -- Initialize if not exists
    IF v_year IS NULL THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        v_sequence := 0;
        
        INSERT INTO id_sequences (cooperative_id, current_year, current_sequence)
        VALUES (p_cooperative_id, v_year, v_sequence);
    END IF;
    
    -- Reset sequence if year changed
    IF v_year != EXTRACT(YEAR FROM CURRENT_DATE) THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        v_sequence := 0;
        
        UPDATE id_sequences
        SET current_year = v_year, current_sequence = 0, last_reset_at = CURRENT_TIMESTAMP
        WHERE cooperative_id = p_cooperative_id;
    END IF;
    
    -- Increment sequence
    v_sequence := v_sequence + 1;
    
    UPDATE id_sequences
    SET current_sequence = v_sequence
    WHERE cooperative_id = p_cooperative_id;
    
    -- Generate member_id: [coop_code][year_last_2_digits][sequence_padded_4]
    v_member_id := v_coop_code || LPAD(v_sequence::TEXT, 4, '0');
    
    RETURN v_member_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate loan_number
CREATE OR REPLACE FUNCTION generate_loan_number(p_cooperative_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_coop_code VARCHAR;
    v_year INT;
    v_count INT;
    v_loan_number VARCHAR;
BEGIN
    SELECT coop_code INTO v_coop_code FROM cooperatives WHERE id = p_cooperative_id;
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Count loans for this cooperative this year
    SELECT COUNT(*) INTO v_count
    FROM loans l
    JOIN memberships m ON l.membership_id = m.id
    WHERE m.cooperative_id = p_cooperative_id
    AND EXTRACT(YEAR FROM l.applied_date) = v_year;
    
    -- Format: [coop_code]/[year]/[sequence_padded_4]
    v_loan_number := v_coop_code || '/' || v_year || '/' || LPAD((v_count + 1)::TEXT, 4, '0');
    
    RETURN v_loan_number;
END;
$$ LANGUAGE plpgsql;

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
