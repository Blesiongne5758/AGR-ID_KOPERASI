import { useState } from 'react';
import { Database, Table, Key, Link2, Hash, ChevronRight, Copy, Check, Code2, Shield } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  constraints: string[];
  description: string;
}

interface TableSchema {
  id: string;
  name: string;
  number: number;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  columns: Column[];
}

const tables: TableSchema[] = [
  {
    id: 'cooperatives',
    name: 'cooperatives',
    number: 1,
    description: 'Tabel Koperasi — Menyimpan data entitas koperasi yang terdaftar dalam sistem.',
    icon: '🏛️',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary key unik untuk setiap koperasi' },
      { name: 'name', type: 'VARCHAR(150)', constraints: ['NOT NULL'], description: 'Nama lengkap koperasi' },
      { name: 'coop_code', type: 'VARCHAR(20)', constraints: ['UNIQUE', 'NOT NULL'], description: "Kode unik koperasi (misal: 'AGR', 'KOPMAJU')" },
      { name: 'legal_entity_number', type: 'VARCHAR(50)', constraints: [], description: 'Nomor badan hukum koperasi' },
      { name: 'address', type: 'TEXT', constraints: [], description: 'Alamat lengkap kantor koperasi' },
      { name: 'phone', type: 'VARCHAR(20)', constraints: [], description: 'Nomor telepon kontak' },
      { name: 'email', type: 'VARCHAR(100)', constraints: [], description: 'Email kontak koperasi' },
      { name: 'is_active', type: 'BOOLEAN', constraints: ['DEFAULT TRUE'], description: 'Status aktif/nonaktif' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pendaftaran' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update terakhir' },
    ],
  },
  {
    id: 'users',
    name: 'users',
    number: 2,
    description: 'Tabel Pengguna Global — Menyimpan kredensial login dan data profil pengguna.',
    icon: '👤',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary key unik untuk setiap pengguna' },
      { name: 'member_id', type: 'VARCHAR(30)', constraints: ['UNIQUE', 'NOT NULL'], description: 'ID Unik Anggota (Primary Login Key)' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: ['NOT NULL'], description: 'Hash password (bcrypt/argon2)' },
      { name: 'full_name', type: 'VARCHAR(150)', constraints: ['NOT NULL'], description: 'Nama lengkap pengguna' },
      { name: 'email', type: 'VARCHAR(100)', constraints: [], description: 'Email pengguna' },
      { name: 'phone', type: 'VARCHAR(20)', constraints: ['UNIQUE'], description: 'Nomor telepon unik' },
      { name: 'ktp_number', type: 'VARCHAR(20)', constraints: [], description: 'Nomor KTP untuk verifikasi' },
      { name: 'birth_date', type: 'DATE', constraints: [], description: 'Tanggal lahir' },
      { name: 'gender', type: 'VARCHAR(10)', constraints: [], description: 'Jenis kelamin: MALE/FEMALE' },
      { name: 'address', type: 'TEXT', constraints: [], description: 'Alamat lengkap' },
      { name: 'is_verified', type: 'BOOLEAN', constraints: ['DEFAULT FALSE'], description: 'Status verifikasi KYC' },
      { name: 'last_login_at', type: 'TIMESTAMP', constraints: [], description: 'Waktu login terakhir' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pembuatan akun' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update terakhir' },
    ],
  },
  {
    id: 'memberships',
    name: 'memberships',
    number: 3,
    description: 'Tabel Keanggotaan — Menghubungkan user ke koperasi dengan peran tertentu.',
    icon: '🔗',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-violet-500',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary key keanggotaan' },
      { name: 'user_id', type: 'UUID', constraints: ['FK → users.id', 'ON DELETE CASCADE'], description: 'Referensi ke tabel users' },
      { name: 'cooperative_id', type: 'UUID', constraints: ['FK → cooperatives.id', 'ON DELETE CASCADE'], description: 'Referensi ke tabel cooperatives' },
      { name: 'role', type: 'VARCHAR(20)', constraints: ["DEFAULT 'MEMBER'"], description: "Peran: 'MEMBER', 'ADMIN', 'MANAGER', 'CHAIRMAN'" },
      { name: 'member_number', type: 'VARCHAR(30)', constraints: [], description: 'Nomor anggota internal' },
      { name: 'join_date', type: 'DATE', constraints: ['DEFAULT CURRENT_DATE'], description: 'Tanggal bergabung' },
      { name: 'status', type: 'VARCHAR(20)', constraints: ["DEFAULT 'ACTIVE'"], description: "Status: 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'" },
      { name: 'approved_by', type: 'UUID', constraints: ['FK → users.id'], description: 'User yang menyetujui' },
      { name: 'approved_at', type: 'TIMESTAMP', constraints: [], description: 'Waktu persetujuan' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pembuatan' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update' },
    ],
  },
  {
    id: 'id_sequences',
    name: 'id_sequences',
    number: 4,
    description: 'Tabel Antrian ID — Mencegah race condition saat generate ID transaksi.',
    icon: '🔢',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
    columns: [
      { name: 'cooperative_id', type: 'UUID', constraints: ['PRIMARY KEY', 'FK → cooperatives.id', 'ON DELETE CASCADE'], description: 'Primary key & referensi ke koperasi' },
      { name: 'current_year', type: 'INT', constraints: ['NOT NULL'], description: 'Tahun berjalan untuk penomoran' },
      { name: 'current_sequence', type: 'INT', constraints: ['NOT NULL', 'DEFAULT 0'], description: 'Nomor urut terakhir (Pessimistic Locking)' },
      { name: 'last_reset_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu reset terakhir' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update terakhir' },
    ],
  },
  {
    id: 'savings',
    name: 'savings',
    number: 5,
    description: 'Tabel Simpanan — Ledger untuk mencatat saldo simpanan anggota.',
    icon: '💰',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary key simpanan' },
      { name: 'membership_id', type: 'UUID', constraints: ['FK → memberships.id', 'ON DELETE CASCADE'], description: 'Referensi ke keanggotaan' },
      { name: 'type', type: 'VARCHAR(20)', constraints: ['NOT NULL'], description: "Jenis: 'POKOK', 'WAJIB', 'SUKARELA'" },
      { name: 'balance', type: 'NUMERIC(15,2)', constraints: ['NOT NULL', 'DEFAULT 0.00'], description: 'Saldo simpanan' },
      { name: 'currency', type: 'VARCHAR(3)', constraints: ["DEFAULT 'IDR'"], description: 'Kode mata uang' },
      { name: 'last_transaction_at', type: 'TIMESTAMP', constraints: [], description: 'Waktu transaksi terakhir' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pembuatan' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update' },
    ],
  },
  {
    id: 'loans',
    name: 'loans',
    number: 6,
    description: 'Tabel Pinjaman — Tracking pinjaman anggota dengan berbagai jenis.',
    icon: '🏦',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-blue-500',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'], description: 'Primary key pinjaman' },
      { name: 'membership_id', type: 'UUID', constraints: ['FK → memberships.id', 'ON DELETE CASCADE'], description: 'Referensi ke peminjam' },
      { name: 'loan_number', type: 'VARCHAR(30)', constraints: ['UNIQUE', 'NOT NULL'], description: 'Nomor pinjaman unik' },
      { name: 'type', type: 'VARCHAR(20)', constraints: ['NOT NULL'], description: "Jenis: 'MODAL_USAHA', 'DARURAT', 'PAYLATER', 'MIKRO'" },
      { name: 'principal_amount', type: 'NUMERIC(15,2)', constraints: ['NOT NULL'], description: 'Jumlah pokok pinjaman' },
      { name: 'remaining_amount', type: 'NUMERIC(15,2)', constraints: ['NOT NULL'], description: 'Sisa pinjaman' },
      { name: 'interest_rate', type: 'NUMERIC(5,2)', constraints: ['NOT NULL', 'DEFAULT 0.00'], description: 'Suku bunga per bulan (%)' },
      { name: 'interest_type', type: 'VARCHAR(10)', constraints: ["DEFAULT 'FLAT'"], description: "Metode: 'FLAT', 'EFFECTIVE', 'ANNUITY'" },
      { name: 'total_installments', type: 'INT', constraints: ['NOT NULL'], description: 'Total jumlah angsuran' },
      { name: 'paid_installments', type: 'INT', constraints: ['NOT NULL', 'DEFAULT 0'], description: 'Angsuran yang sudah dibayar' },
      { name: 'installment_amount', type: 'NUMERIC(15,2)', constraints: ['NOT NULL'], description: 'Jumlah angsuran per bulan' },
      { name: 'applied_date', type: 'DATE', constraints: ['NOT NULL', 'DEFAULT CURRENT_DATE'], description: 'Tanggal pengajuan' },
      { name: 'approved_date', type: 'DATE', constraints: [], description: 'Tanggal persetujuan' },
      { name: 'disbursement_date', type: 'DATE', constraints: [], description: 'Tanggal pencairan' },
      { name: 'due_date', type: 'DATE', constraints: ['NOT NULL'], description: 'Jatuh tempo terakhir' },
      { name: 'next_payment_date', type: 'DATE', constraints: [], description: 'Jatuh tempo angsuran berikutnya' },
      { name: 'status', type: 'VARCHAR(20)', constraints: ["DEFAULT 'PENDING'"], description: "Status: 'PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED', 'OVERDUE', 'CANCELLED'" },
      { name: 'collateral_description', type: 'TEXT', constraints: [], description: 'Deskripsi jaminan' },
      { name: 'purpose', type: 'TEXT', constraints: [], description: 'Tujuan pinjaman' },
      { name: 'approved_by', type: 'UUID', constraints: ['FK → users.id'], description: 'User yang menyetujui' },
      { name: 'notes', type: 'TEXT', constraints: [], description: 'Catatan tambahan' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pembuatan' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu update' },
    ],
  },
];

const relations = [
  { from: 'users', to: 'memberships', label: '1:N', type: 'one-to-many' },
  { from: 'cooperatives', to: 'memberships', label: '1:N', type: 'one-to-many' },
  { from: 'cooperatives', to: 'id_sequences', label: '1:1', type: 'one-to-one' },
  { from: 'memberships', to: 'savings', label: '1:N', type: 'one-to-many' },
  { from: 'memberships', to: 'loans', label: '1:N', type: 'one-to-many' },
];

const sqlScript = `-- ============================================================================
-- MIGRATION SCRIPT: Sistem Manajemen Koperasi Multi-Tenant
-- Database: PostgreSQL 14+
-- ============================================================================

-- 1. Tabel Koperasi
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

-- 2. Tabel Pengguna Global
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

-- 3. Tabel Keanggotaan
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cooperative_id UUID NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'MEMBER',
    member_number VARCHAR(30),
    join_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_cooperative UNIQUE (user_id, cooperative_id)
);

-- 4. Tabel Antrian ID
CREATE TABLE id_sequences (
    cooperative_id UUID PRIMARY KEY REFERENCES cooperatives(id) ON DELETE CASCADE,
    current_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    current_sequence INT NOT NULL DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Simpanan
CREATE TABLE savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'IDR',
    last_transaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_membership_type UNIQUE (membership_id, type),
    CONSTRAINT chk_balance_positive CHECK (balance >= 0)
);

-- 6. Tabel Pinjaman
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    loan_number VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    principal_amount NUMERIC(15,2) NOT NULL,
    remaining_amount NUMERIC(15,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    interest_type VARCHAR(10) DEFAULT 'FLAT',
    total_installments INT NOT NULL,
    paid_installments INT NOT NULL DEFAULT 0,
    installment_amount NUMERIC(15,2) NOT NULL,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_date DATE,
    disbursement_date DATE,
    due_date DATE NOT NULL,
    next_payment_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    collateral_description TEXT,
    purpose TEXT,
    approved_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_principal_positive CHECK (principal_amount > 0),
    CONSTRAINT chk_remaining_valid CHECK (remaining_amount >= 0 AND remaining_amount <= principal_amount)
);`;

function highlightSQL(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted.replace(/(--.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  const keywords = ['CREATE', 'TABLE', 'UUID', 'PRIMARY', 'KEY', 'DEFAULT', 'NOT', 'NULL', 'UNIQUE', 'REFERENCES', 'ON', 'DELETE', 'CASCADE', 'VARCHAR', 'INT', 'TIMESTAMP', 'DATE', 'NUMERIC', 'BOOLEAN', 'TEXT', 'CHECK', 'CONSTRAINT', 'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'gen_random_uuid', 'EXTRACT', 'YEAR', 'FROM'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

function getConstraintStyle(constraint: string): string {
  if (constraint.includes('PRIMARY KEY')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (constraint.includes('UNIQUE')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  if (constraint.includes('NOT NULL')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (constraint.includes('FK')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (constraint.includes('DEFAULT')) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return 'bg-white/5 text-slate-400 border-white/10';
}

export default function App() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Skema Database Koperasi
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            PostgreSQL Schema dengan 6 Tabel Utama untuk Sistem Manajemen Koperasi Multi-Tenant
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tabel', value: tables.length.toString(), icon: Table },
            { label: 'Total Kolom', value: totalColumns.toString(), icon: Hash },
            { label: 'Relasi FK', value: relations.length.toString(), icon: Link2 },
            { label: 'ACID', value: '✓', icon: Database },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tables Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Table className="w-6 h-6 text-amber-400" />
            6 Tabel Utama
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
                className={`
                  text-left relative overflow-hidden rounded-2xl border transition-all duration-300
                  ${activeTable === table.id
                    ? 'border-white/20 bg-white/10 shadow-2xl scale-[1.02]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <div className={`h-1 bg-gradient-to-r ${table.gradient}`} />
                
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{table.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${table.color} bg-white/5`}>
                          #{table.number}
                        </span>
                        <code className={`text-sm font-bold ${table.color}`}>{table.name}</code>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{table.columns.length} kolom</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {table.columns.slice(0, 3).map((col) => (
                      <div key={col.name} className="flex items-center gap-2 text-xs">
                        {col.constraints.includes('PRIMARY KEY') && (
                          <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        )}
                        {col.constraints.some(c => c.includes('FK')) && !col.constraints.includes('PRIMARY KEY') && (
                          <Link2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
                        {!col.constraints.includes('PRIMARY KEY') && !col.constraints.some(c => c.includes('FK')) && (
                          <span className="w-3 h-3 flex-shrink-0" />
                        )}
                        <code className="text-slate-300">{col.name}</code>
                        <span className="text-slate-600 ml-auto">{col.type}</span>
                      </div>
                    ))}
                    {table.columns.length > 3 && (
                      <div className="text-xs text-slate-600 pl-5">+{table.columns.length - 3} kolom lainnya...</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Table View */}
        {activeTable && (
          <div className="mb-12">
            {(() => {
              const table = tables.find(t => t.id === activeTable);
              if (!table) return null;

              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${table.gradient}`} />
                  
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{table.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${table.color} bg-white/5`}>
                            Tabel {table.number}
                          </span>
                          <code className={`text-xl font-bold ${table.color}`}>{table.name}</code>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{table.description}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Kolom</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Tipe Data</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Constraints</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  {col.constraints.includes('PRIMARY KEY') && (
                                    <Key className="w-4 h-4 text-amber-400" />
                                  )}
                                  {col.constraints.some(c => c.includes('FK')) && !col.constraints.includes('PRIMARY KEY') && (
                                    <Link2 className="w-4 h-4 text-blue-400" />
                                  )}
                                  {col.constraints.includes('UNIQUE') && !col.constraints.includes('PRIMARY KEY') && (
                                    <span className="text-emerald-400">⚡</span>
                                  )}
                                  <code className={`font-medium ${table.color}`}>{col.name}</code>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <code className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                  {col.type}
                                </code>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {col.constraints.map((c, i) => (
                                    <span
                                      key={i}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border ${getConstraintStyle(c)}`}
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 text-xs hidden sm:table-cell">
                                {col.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Relations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-blue-400" />
            Relasi Antar Tabel
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {relations.map((rel, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <code className="text-xs text-blue-400 font-medium truncate">{rel.from}</code>
                    <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <code className="text-xs text-purple-400 font-medium truncate">{rel.to}</code>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    rel.type === 'one-to-one' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {rel.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SQL Script */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-400" />
            SQL Migration Script
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">migration.sql</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowSQL(!showSQL)}
                  className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  {showSQL ? '▼ Collapse' : '▶ Show SQL'}
                </button>
              </div>
            </div>

            {showSQL ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono leading-relaxed">
                  <code>
                    {sqlScript.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 transition-colors">
                        <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">{i + 1}</span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: highlightSQL(line) }}
                        />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Database className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  Full SQL migration script untuk membuat 6 tabel database koperasi
                </p>
                <button
                  onClick={() => setShowSQL(true)}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
                >
                  Lihat SQL Script
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Key, title: 'UUID Primary Key', desc: 'gen_random_uuid() untuk setiap tabel', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Link2, title: 'Foreign Key + CASCADE', desc: 'Referential integrity dengan cascade delete', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Shield, title: 'UNIQUE Constraints', desc: 'member_id & (user_id, cooperative_id)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Hash, title: 'NUMERIC Precision', desc: 'NUMERIC(15,2) untuk akurasi keuangan', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
