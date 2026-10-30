-- ============================================================================
-- Database Schema untuk Integrasi AGR-ID
-- Purpose: Menyimpan data koperasi dan anggota untuk sinkronisasi ke AGR-ID
-- ============================================================================

-- 1. Tabel Koperasi
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

-- 2. Tabel Anggota
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

-- 3. Tabel Sync Logs (Audit Trail)
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

-- Comments
COMMENT ON TABLE cooperatives IS 'Data koperasi yang akan disinkronkan ke AGR-ID';
COMMENT ON TABLE members IS 'Data anggota koperasi per koperasi';
COMMENT ON TABLE agrid_sync_logs IS 'Audit trail untuk sinkronisasi ke AGR-ID';

-- Sample Data
INSERT INTO cooperatives (code, name, address, phone, email) VALUES
('KOP-001', 'Koperasi Tani Sejahtera', 'Jl. Pertanian No. 123, Jakarta', '021-12345678', 'info@kop001.id'),
('KOP-002', 'Koperasi Nelayan Makmur', 'Jl. Pantai No. 45, Surabaya', '031-87654321', 'info@kop002.id');

INSERT INTO members (cooperative_id, member_number, name, email, phone) VALUES
((SELECT id FROM cooperatives WHERE code = 'KOP-001'), 'A-1001', 'Budi Santoso', 'budi@example.com', '081234567890'),
((SELECT id FROM cooperatives WHERE code = 'KOP-001'), 'A-1002', 'Siti Nurhaliza', 'siti@example.com', '081234567891'),
((SELECT id FROM cooperatives WHERE code = 'KOP-002'), 'B-2001', 'Ahmad Suryadi', 'ahmad@example.com', '081234567892');
