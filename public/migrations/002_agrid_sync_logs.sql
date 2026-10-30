-- ============================================================================
-- Migration: AGRID Sync Logs Table
-- Purpose: Track sync history between KOPERASI and AGR-ID
-- ============================================================================

-- Table: agrid_sync_logs
-- Stores all sync attempts (success and failed) for audit trail
CREATE TABLE agrid_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('SNAPSHOT', 'PARTIAL')),
    cooperatives_count INT NOT NULL DEFAULT 0,
    members_count INT NOT NULL DEFAULT 0,
    payload JSONB,
    response JSONB,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_agrid_sync_logs_status ON agrid_sync_logs(status);
CREATE INDEX idx_agrid_sync_logs_created ON agrid_sync_logs(created_at DESC);
CREATE INDEX idx_agrid_sync_logs_sync_type ON agrid_sync_logs(sync_type);

-- Comments
COMMENT ON TABLE agrid_sync_logs IS 'Audit trail untuk sinkronisasi data koperasi ke AGR-ID';
COMMENT ON COLUMN agrid_sync_logs.id IS 'Primary key unik';
COMMENT ON COLUMN agrid_sync_logs.sync_type IS 'Jenis sync: SNAPSHOT (full) atau PARTIAL (per koperasi)';
COMMENT ON COLUMN agrid_sync_logs.cooperatives_count IS 'Jumlah koperasi yang disinkronkan';
COMMENT ON COLUMN agrid_sync_logs.members_count IS 'Jumlah anggota yang disinkronkan';
COMMENT ON COLUMN agrid_sync_logs.payload IS 'Payload yang dikirim ke AGR-ID (JSON)';
COMMENT ON COLUMN agrid_sync_logs.response IS 'Response dari AGR-ID (JSON)';
COMMENT ON COLUMN agrid_sync_logs.status IS 'Status sync: SUCCESS, FAILED, atau PENDING';
COMMENT ON COLUMN agrid_sync_logs.error_message IS 'Error message jika sync gagal';
COMMENT ON COLUMN agrid_sync_logs.created_at IS 'Timestamp kapan sync dilakukan';

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample successful sync
INSERT INTO agrid_sync_logs (
    sync_type,
    cooperatives_count,
    members_count,
    payload,
    response,
    status,
    created_at
) VALUES (
    'SNAPSHOT',
    3,
    150,
    '{"snapshot": true, "cooperatives": [...]}',
    '{"ok": true, "cooperatives_synced": 3, "members_synced": 150, "snapshot": true}',
    'SUCCESS',
    NOW() - INTERVAL '1 day'
);

-- Insert sample failed sync
INSERT INTO agrid_sync_logs (
    sync_type,
    cooperatives_count,
    members_count,
    payload,
    status,
    error_message,
    created_at
) VALUES (
    'PARTIAL',
    1,
    25,
    '{"snapshot": false, "cooperatives": [...]}',
    'FAILED',
    'AGR-ID sync failed: 401 - Invalid token',
    NOW() - INTERVAL '2 hours'
);

-- ============================================================================
-- Useful Queries
-- ============================================================================

-- Get recent sync history
-- SELECT * FROM agrid_sync_logs ORDER BY created_at DESC LIMIT 10;

-- Get sync statistics
-- SELECT 
--     DATE(created_at) as date,
--     COUNT(*) as total_syncs,
--     COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
--     COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
--     SUM(cooperatives_count) as total_cooperatives,
--     SUM(members_count) as total_members
-- FROM agrid_sync_logs
-- WHERE created_at > NOW() - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- Get failed syncs
-- SELECT * FROM agrid_sync_logs WHERE status = 'FAILED' ORDER BY created_at DESC;

-- ============================================================================
-- End of Migration
-- ============================================================================
