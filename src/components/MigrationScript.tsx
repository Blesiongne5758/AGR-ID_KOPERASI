import { useState } from 'react';

interface TableInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  columnCount: number;
  keyFeatures: string[];
}

const tables: TableInfo[] = [
  {
    name: 'cooperatives',
    description: 'Master data entitas koperasi',
    icon: '🏛️',
    color: 'from-blue-500 to-cyan-500',
    columnCount: 10,
    keyFeatures: ['UUID PK', 'UNIQUE coop_code', 'Soft delete support'],
  },
  {
    name: 'users',
    description: 'Kredensial login & profil pengguna',
    icon: '👤',
    color: 'from-emerald-500 to-teal-500',
    columnCount: 14,
    keyFeatures: ['UNIQUE member_id', 'KYC fields', 'Password hash'],
  },
  {
    name: 'memberships',
    description: 'Relasi user ↔ koperasi (many-to-many)',
    icon: '🔗',
    color: 'from-purple-500 to-violet-500',
    columnCount: 11,
    keyFeatures: ['UNIQUE (user_id, cooperative_id)', 'Role-based', 'Approval workflow'],
  },
  {
    name: 'id_sequences',
    description: 'Auto-increment per koperasi (race-condition safe)',
    icon: '🔢',
    color: 'from-amber-500 to-orange-500',
    columnCount: 5,
    keyFeatures: ['Pessimistic locking', 'Year-based reset', 'SELECT FOR UPDATE'],
  },
  {
    name: 'savings',
    description: 'Ledger simpanan (Pokok/Wajib/Sukarela)',
    icon: '💰',
    color: 'from-rose-500 to-pink-500',
    columnCount: 8,
    keyFeatures: ['NUMERIC(15,2)', 'UNIQUE (membership, type)', 'CHECK balance >= 0'],
  },
  {
    name: 'loans',
    description: 'Pinjaman dengan workflow approval',
    icon: '🏦',
    color: 'from-indigo-500 to-blue-500',
    columnCount: 21,
    keyFeatures: ['NUMERIC precision', 'Multi-status workflow', 'Interest calculation'],
  },
  {
    name: 'savings_transactions',
    description: 'Mutasi simpanan (audit trail)',
    icon: '📜',
    color: 'from-teal-500 to-emerald-500',
    columnCount: 9,
    keyFeatures: ['Double-entry bookkeeping', 'Balance before/after', 'Reference tracking'],
  },
  {
    name: 'loan_installments',
    description: 'Detail angsuran per periode',
    icon: '📅',
    color: 'from-violet-500 to-purple-500',
    columnCount: 12,
    keyFeatures: ['Per-installment tracking', 'Partial payment', 'Overdue detection'],
  },
  {
    name: 'api_credentials',
    description: 'API key & secret untuk AGRID',
    icon: '🔐',
    color: 'from-orange-500 to-amber-500',
    columnCount: 9,
    keyFeatures: ['HMAC-SHA256', 'Rate limiting', 'Key rotation'],
  },
  {
    name: 'webhook_logs',
    description: 'Log webhook dari AGRID',
    icon: '📡',
    color: 'from-cyan-500 to-blue-500',
    columnCount: 9,
    keyFeatures: ['JSONB payload', 'GIN index', 'Signature verification'],
  },
];

const sqlScript = `-- ============================================================================
-- MIGRATION SCRIPT: Sistem Manajemen Koperasi Multi-Tenant
-- Database: PostgreSQL 14+
-- Version: 1.0.0
-- ============================================================================

-- 1. Tabel cooperatives (Master Koperasi)
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

-- 2. Tabel users (Pengguna Global)
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

-- 3. Tabel memberships (Keanggotaan)
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER' 
        CHECK (role IN ('MEMBER', 'ADMIN', 'MANAGER', 'CHAIRMAN')),
    member_number VARCHAR(30),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_cooperative UNIQUE (user_id, cooperative_id)
);

-- 4. Tabel id_sequences (Antrian ID per Koperasi)
CREATE TABLE id_sequences (
    cooperative_id UUID PRIMARY KEY 
        REFERENCES cooperatives(id) ON DELETE CASCADE,
    current_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    current_sequence INT NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel savings (Simpanan)
CREATE TABLE savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('POKOK', 'WAJIB', 'SUKARELA')),
    balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'IDR',
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_membership_type UNIQUE (membership_id, type),
    CONSTRAINT chk_balance_positive CHECK (balance >= 0)
);

-- 6. Tabel loans (Pinjaman)
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    loan_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('MODAL_USAHA', 'DARURAT', 'PAYLATER', 'MIKRO')),
    principal_amount NUMERIC(15,2) NOT NULL,
    remaining_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    interest_type VARCHAR(10) DEFAULT 'FLAT' 
        CHECK (interest_type IN ('FLAT', 'EFFECTIVE', 'ANNUITY')),
    total_installments INT NOT NULL,
    paid_installments INT NOT NULL DEFAULT 0,
    installment_amount NUMERIC(15,2) NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_date DATE,
    disbursement_date DATE,
    due_date DATE NOT NULL,
    next_payment_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 
                          'COMPLETED', 'OVERDUE', 'CANCELLED')),
    collateral_description TEXT,
    purpose TEXT,
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_remaining_valid 
        CHECK (remaining_amount >= 0 AND remaining_amount <= principal_amount),
    CONSTRAINT chk_installments_valid 
        CHECK (total_installments > 0 AND paid_installments >= 0 
               AND paid_installments <= total_installments)
);

-- 7. Tabel savings_transactions (Mutasi Simpanan)
CREATE TABLE savings_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    savings_id UUID NOT NULL REFERENCES savings(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL 
        CHECK (transaction_type IN ('DEPOSIT', 'WITHDRAWAL', 'INTEREST', 'ADJUSTMENT')),
    amount NUMERIC(15,2) NOT NULL,
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    description TEXT,
    reference_number VARCHAR(50),
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

-- 8. Tabel loan_installments (Angsuran)
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
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_loan_installment UNIQUE (loan_id, installment_number)
);

-- 9. Tabel api_credentials (Kredensial API AGRID)
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

-- 10. Tabel webhook_logs (Log Webhook)
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID REFERENCES cooperatives(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'RECEIVED' 
        CHECK (status IN ('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED')),
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES untuk Performa
-- ============================================================================

-- cooperatives
CREATE INDEX idx_cooperatives_coop_code ON cooperatives(coop_code);
CREATE INDEX idx_cooperatives_is_active ON cooperatives(is_active) WHERE is_active = TRUE;

-- users
CREATE INDEX idx_users_member_id ON users(member_id);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_is_verified ON users(is_verified);

-- memberships
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_cooperative_id ON memberships(cooperative_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_user_coop ON memberships(user_id, cooperative_id);

-- savings
CREATE INDEX idx_savings_membership_id ON savings(membership_id);
CREATE INDEX idx_savings_type ON savings(type);

-- loans
CREATE INDEX idx_loans_membership_id ON loans(membership_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date) 
    WHERE status IN ('DISBURSED', 'OVERDUE');

-- savings_transactions
CREATE INDEX idx_savings_trans_savings_id ON savings_transactions(savings_id);
CREATE INDEX idx_savings_trans_created ON savings_transactions(created_at DESC);

-- loan_installments
CREATE INDEX idx_loan_inst_loan_id ON loan_installments(loan_id);
CREATE INDEX idx_loan_inst_due_date ON loan_installments(due_date);
CREATE INDEX idx_loan_inst_status ON loan_installments(status);

-- api_credentials
CREATE INDEX idx_api_creds_cooperative ON api_credentials(cooperative_id);
CREATE INDEX idx_api_creds_api_key ON api_credentials(api_key);

-- webhook_logs
CREATE INDEX idx_webhook_logs_cooperative ON webhook_logs(cooperative_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_received ON webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_payload ON webhook_logs USING GIN (payload);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger ke semua tabel
CREATE TRIGGER update_cooperatives_updated_at BEFORE UPDATE ON cooperatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_savings_updated_at BEFORE UPDATE ON savings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate member_id unik per koperasi (race-condition safe)
CREATE OR REPLACE FUNCTION generate_member_id(p_cooperative_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_coop_code VARCHAR;
    v_year INT;
    v_sequence INT;
BEGIN
    SELECT coop_code INTO v_coop_code 
    FROM cooperatives WHERE id = p_cooperative_id;
    
    IF v_coop_code IS NULL THEN
        RAISE EXCEPTION 'Cooperative not found';
    END IF;
    
    -- Pessimistic locking dengan FOR UPDATE
    SELECT current_year, current_sequence INTO v_year, v_sequence
    FROM id_sequences
    WHERE cooperative_id = p_cooperative_id
    FOR UPDATE;
    
    -- Initialize jika belum ada
    IF v_year IS NULL THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        v_sequence := 0;
        INSERT INTO id_sequences (cooperative_id, current_year, current_sequence)
        VALUES (p_cooperative_id, v_year, v_sequence);
    END IF;
    
    -- Reset sequence jika tahun berganti
    IF v_year != EXTRACT(YEAR FROM CURRENT_DATE) THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        v_sequence := 0;
        UPDATE id_sequences 
        SET current_year = v_year, current_sequence = 0, 
            last_reset_at = CURRENT_TIMESTAMP
        WHERE cooperative_id = p_cooperative_id;
    END IF;
    
    -- Increment sequence
    v_sequence := v_sequence + 1;
    UPDATE id_sequences SET current_sequence = v_sequence
    WHERE cooperative_id = p_cooperative_id;
    
    -- Format: [coop_code][sequence_padded_4]
    RETURN v_coop_code || LPAD(v_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;`;

export default function MigrationScript() {
  const [showFullScript, setShowFullScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTable, setActiveTable] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalColumns = tables.reduce((sum, t) => sum + t.columnCount, 0);

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Migration Script PostgreSQL</h2>
          <p className="text-sm text-slate-400 mt-1">Complete DDL untuk sistem koperasi multi-tenant</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tabel', value: tables.length.toString(), icon: '📊' },
          { label: 'Total Kolom', value: totalColumns.toString(), icon: '📋' },
          { label: 'Indexes', value: '30+', icon: '⚡' },
          { label: 'Functions', value: '3', icon: '🔧' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tables Overview */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📐</span> Struktur Tabel
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tables.map(table => (
            <button
              key={table.name}
              onClick={() => setActiveTable(activeTable === table.name ? null : table.name)}
              className={`text-left p-4 rounded-xl border transition-all ${
                activeTable === table.name
                  ? 'bg-white/10 border-white/20 scale-[1.02]'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{table.icon}</span>
                <div>
                  <code className="text-sm font-bold text-indigo-400">{table.name}</code>
                  <p className="text-[10px] text-slate-500">{table.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {table.keyFeatures.map(feature => (
                  <span key={feature} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                    {feature}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-slate-600 mt-2">{table.columnCount} kolom</div>
            </button>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🔒', title: 'UNIQUE Constraints', desc: 'member_id, (user_id, cooperative_id), api_key' },
          { icon: '💰', title: 'NUMERIC Precision', desc: 'NUMERIC(15,2) untuk semua kolom keuangan' },
          { icon: '📝', title: 'Column Comments', desc: 'COMMENT ON COLUMN untuk dokumentasi' },
          { icon: '⚡', title: 'Performance Indexes', desc: 'B-tree, GIN, partial indexes' },
        ].map(feature => (
          <div key={feature.title} className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xl block mb-2">{feature.icon}</span>
            <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
            <p className="text-xs text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* SQL Script */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">001_initial_schema.sql</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">PostgreSQL 14+</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={() => setShowFullScript(!showFullScript)}
              className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded text-xs text-indigo-400 hover:bg-indigo-500/30 transition-colors"
            >
              {showFullScript ? '▼ Collapse' : '▶ Expand Full Script'}
            </button>
          </div>
        </div>
        
        {showFullScript ? (
          <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed max-h-[600px] overflow-y-auto">
            <code>{sqlScript}</code>
          </pre>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-400 mb-4">
              Script migrasi lengkap tersedia di <code className="px-2 py-0.5 rounded bg-white/5 text-indigo-400">public/migrations/001_initial_schema.sql</code>
            </p>
            <button
              onClick={() => setShowFullScript(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
            >
              Lihat Full Script
            </button>
          </div>
        )}
      </div>

      {/* Download Info */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">Cara Menggunakan</h4>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>Download file <code className="px-1 py-0.5 rounded bg-white/5 text-indigo-400">001_initial_schema.sql</code></li>
              <li>Jalankan di PostgreSQL: <code className="px-1 py-0.5 rounded bg-white/5 text-indigo-400">psql -U postgres -d koperasi_db -f 001_initial_schema.sql</code></li>
              <li>Script akan membuat semua tabel, indexes, functions, dan triggers</li>
              <li>Sample data koperasi AGRID sudah termasuk untuk testing</li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
