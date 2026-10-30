import { useState } from 'react';

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
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  bgGlow: string;
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
    colorFrom: 'from-blue-500',
    colorTo: 'to-cyan-500',
    borderColor: 'border-blue-500/30',
    bgGlow: 'bg-blue-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PK', 'DEFAULT gen_random_uuid()'], description: 'Primary key unik untuk setiap koperasi' },
      { name: 'name', type: 'VARCHAR(150)', constraints: ['NOT NULL'], description: 'Nama lengkap koperasi' },
      { name: 'coop_code', type: 'VARCHAR(20)', constraints: ['UNIQUE', 'NOT NULL'], description: "Kode koperasi (misal: 'AGR', 'KOPMAJU')" },
      { name: 'legal_entity_number', type: 'VARCHAR(50)', constraints: [], description: 'Nomor badan hukum koperasi' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pendaftaran koperasi' },
    ],
  },
  {
    id: 'users',
    name: 'users',
    number: 2,
    description: 'Tabel Pengguna Global — Menyimpan kredensial login dan data profil pengguna.',
    icon: '👤',
    color: 'text-emerald-400',
    colorFrom: 'from-emerald-500',
    colorTo: 'to-teal-500',
    borderColor: 'border-emerald-500/30',
    bgGlow: 'bg-emerald-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PK', 'DEFAULT gen_random_uuid()'], description: 'Primary key unik untuk setiap pengguna' },
      { name: 'member_id', type: 'VARCHAR(30)', constraints: ['UNIQUE', 'NOT NULL'], description: 'ID Unik Anggota — Primary Login Key' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: ['NOT NULL'], description: 'Hash password (bcrypt/argon2)' },
      { name: 'full_name', type: 'VARCHAR(150)', constraints: ['NOT NULL'], description: 'Nama lengkap pengguna' },
      { name: 'phone', type: 'VARCHAR(20)', constraints: ['UNIQUE'], description: 'Nomor telepon unik' },
      { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu pembuatan akun' },
    ],
  },
  {
    id: 'memberships',
    name: 'memberships',
    number: 3,
    description: 'Tabel Keanggotaan — Menghubungkan pengguna ke koperasi dengan peran tertentu.',
    icon: '🔗',
    color: 'text-purple-400',
    colorFrom: 'from-purple-500',
    colorTo: 'to-violet-500',
    borderColor: 'border-purple-500/30',
    bgGlow: 'bg-purple-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PK', 'DEFAULT gen_random_uuid()'], description: 'Primary key keanggotaan' },
      { name: 'user_id', type: 'UUID', constraints: ['FK → users.id', 'ON DELETE CASCADE'], description: 'Referensi ke tabel users' },
      { name: 'cooperative_id', type: 'UUID', constraints: ['FK → cooperatives.id', 'ON DELETE CASCADE'], description: 'Referensi ke tabel cooperatives' },
      { name: 'role', type: 'VARCHAR(20)', constraints: ["DEFAULT 'MEMBER'"], description: "Peran: 'MEMBER', 'ADMIN', 'MANAGER'" },
      { name: 'join_date', type: 'DATE', constraints: ['DEFAULT CURRENT_DATE'], description: 'Tanggal bergabung' },
      { name: 'status', type: 'VARCHAR(20)', constraints: ["DEFAULT 'ACTIVE'"], description: "Status: 'ACTIVE', 'INACTIVE', 'SUSPENDED'" },
    ],
  },
  {
    id: 'id_sequences',
    name: 'id_sequences',
    number: 4,
    description: 'Tabel Antrian ID — Mencegah race condition saat generate ID transaksi.',
    icon: '🔢',
    color: 'text-amber-400',
    colorFrom: 'from-amber-500',
    colorTo: 'to-orange-500',
    borderColor: 'border-amber-500/30',
    bgGlow: 'bg-amber-500/10',
    columns: [
      { name: 'cooperative_id', type: 'UUID', constraints: ['PK', 'FK → cooperatives.id', 'ON DELETE CASCADE'], description: 'Primary key & referensi ke koperasi' },
      { name: 'current_year', type: 'INT', constraints: ['NOT NULL'], description: 'Tahun berjalan untuk penomoran' },
      { name: 'current_sequence', type: 'INT', constraints: ['NOT NULL', 'DEFAULT 0'], description: 'Nomor urut terakhir (Pessimistic Locking)' },
    ],
  },
  {
    id: 'savings',
    name: 'savings',
    number: 5,
    description: 'Tabel Simpanan — Ledger sederhana untuk mencatat saldo simpanan anggota.',
    icon: '💰',
    color: 'text-rose-400',
    colorFrom: 'from-rose-500',
    colorTo: 'to-pink-500',
    borderColor: 'border-rose-500/30',
    bgGlow: 'bg-rose-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraints: ['PK', 'DEFAULT gen_random_uuid()'], description: 'Primary key simpanan' },
      { name: 'membership_id', type: 'UUID', constraints: ['FK → memberships.id'], description: 'Referensi ke keanggotaan' },
      { name: 'type', type: 'VARCHAR(20)', constraints: ['NOT NULL'], description: "Jenis: 'POKOK', 'WAJIB', 'SUKARELA'" },
      { name: 'balance', type: 'NUMERIC(15,2)', constraints: ['DEFAULT 0.00'], description: 'Saldo simpanan' },
      { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'], description: 'Waktu terakhir diupdate' },
    ],
  },
];

const relations = [
  { from: 'users', to: 'memberships', label: '1:N', type: 'one-to-many' },
  { from: 'cooperatives', to: 'memberships', label: '1:N', type: 'one-to-many' },
  { from: 'cooperatives', to: 'id_sequences', label: '1:1', type: 'one-to-one' },
  { from: 'memberships', to: 'savings', label: '1:N', type: 'one-to-many' },
];

export default function DatabaseSchema() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showRelations, setShowRelations] = useState(true);

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Skema Database PostgreSQL</h2>
          <p className="text-sm text-slate-400 mt-1">Entity Relationship Diagram — 5 tabel dengan relasi terstruktur</p>
        </div>
        <button
          onClick={() => setShowRelations(!showRelations)}
          className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showRelations
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Relasi
        </button>
      </div>

      {/* ERD Visualization */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
              className={`
                text-left relative overflow-hidden rounded-xl border-2 transition-all duration-300
                ${activeTable === table.id
                  ? `${table.borderColor} shadow-lg scale-[1.02]`
                  : 'border-white/10 hover:border-white/20 hover:scale-[1.01]'
                }
              `}
              style={activeTable === table.id ? {
                boxShadow: `0 0 30px ${getGlowColor(table.id)}`,
              } : {}}
            >
              {/* Gradient top */}
              <div className={`h-1 bg-gradient-to-r ${table.colorFrom} ${table.colorTo}`} />
              
              <div className="p-4">
                {/* Table Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{table.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${table.bgGlow} ${table.color}`}>
                        #{table.number}
                      </span>
                      <code className={`text-sm font-bold ${table.color}`}>{table.name}</code>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{table.columns.length} kolom</p>
                  </div>
                </div>

                {/* Column Preview */}
                <div className="space-y-1">
                  {table.columns.slice(0, 3).map((col) => (
                    <div key={col.name} className="flex items-center gap-2 text-xs">
                      {col.constraints.includes('PK') && (
                        <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">🔑</span>
                      )}
                      {col.constraints.includes('FK') && !col.constraints.includes('PK') && (
                        <span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">🔗</span>
                      )}
                      {!col.constraints.includes('PK') && !col.constraints.includes('FK') && (
                        <span className="w-4 h-4 flex-shrink-0" />
                      )}
                      <code className="text-slate-300">{col.name}</code>
                      <span className="text-slate-600 ml-auto">{col.type}</span>
                    </div>
                  ))}
                  {table.columns.length > 3 && (
                    <div className="text-xs text-slate-600 pl-6">+{table.columns.length - 3} kolom lainnya...</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Relations */}
        {showRelations && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Relasi Antar Tabel
            </h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {relations.map((rel, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <code className="text-xs text-blue-400 font-medium truncate">{rel.from}</code>
                    <svg className="w-4 h-4 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
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
        )}
      </div>

      {/* Detailed Table View */}
      <div className="space-y-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`
              relative overflow-hidden rounded-2xl border transition-all duration-500
              ${activeTable === table.id
                ? `${table.borderColor} shadow-xl`
                : 'border-white/10'
              }
            `}
            style={activeTable === table.id ? {
              boxShadow: `0 0 40px ${getGlowColor(table.id)}`,
            } : {}}
          >
            {/* Background glow */}
            <div className={`absolute inset-0 ${table.bgGlow} opacity-0 transition-opacity duration-500 ${activeTable === table.id ? 'opacity-100' : ''}`} />
            
            {/* Gradient top border */}
            <div className={`h-1 bg-gradient-to-r ${table.colorFrom} ${table.colorTo}`} />

            <div className="relative p-6">
              {/* Table Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{table.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${table.bgGlow} ${table.color} border ${table.borderColor}`}>
                        Tabel {table.number}
                      </span>
                      <code className={`text-lg font-bold ${table.color}`}>{table.name}</code>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{table.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                    activeTable === table.id
                      ? `${table.bgGlow} ${table.color} border ${table.borderColor}`
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {activeTable === table.id ? 'Tutup Detail' : 'Lihat Detail'}
                </button>
              </div>

              {/* Columns Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kolom</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipe Data</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Constraints</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.columns.map((col) => (
                      <tr key={col.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {col.constraints.includes('PK') && (
                              <span className="text-amber-400" title="Primary Key">🔑</span>
                            )}
                            {col.constraints.some(c => c.startsWith('FK')) && !col.constraints.includes('PK') && (
                              <span className="text-blue-400" title="Foreign Key">🔗</span>
                            )}
                            {col.constraints.includes('UNIQUE') && !col.constraints.includes('PK') && (
                              <span className="text-emerald-400" title="Unique">⚡</span>
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
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getConstraintStyle(c)}`}
                              >
                                {c.length > 25 ? c.substring(0, 25) + '...' : c}
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

              {/* Mobile Description */}
              <div className="sm:hidden mt-4 space-y-2">
                {table.columns.map((col) => (
                  <div key={col.name} className="text-xs text-slate-500">
                    <span className={`${table.color} font-medium`}>{col.name}</span>: {col.description}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SQL Info */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <span className="text-sm">📋</span>
          </div>
          <h3 className="text-lg font-bold text-white">Fitur Database</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '🔐', label: 'UUID Primary Key', desc: 'Gen_random_uuid() untuk setiap tabel' },
            { icon: '🔗', label: 'Foreign Key + CASCADE', desc: 'Referential integrity dengan cascade delete' },
            { icon: '⚡', label: 'Unique Constraints', desc: 'Mencegah duplikasi data kritis' },
            { icon: '📊', label: 'NUMERIC Precision', desc: 'NUMERIC(15,2) untuk akurasi keuangan' },
          ].map((feature) => (
            <div key={feature.label} className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="text-xl mb-1">{feature.icon}</div>
              <div className="text-sm font-semibold text-white">{feature.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{feature.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getConstraintStyle(constraint: string): string {
  if (constraint === 'PK') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (constraint.startsWith('FK')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  if (constraint === 'UNIQUE' || constraint === 'NOT NULL') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (constraint.startsWith('DEFAULT')) return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
  return 'bg-white/5 text-slate-400 border border-white/10';
}

function getGlowColor(id: string): string {
  const colors: Record<string, string> = {
    'cooperatives': 'rgba(59, 130, 246, 0.1)',
    'users': 'rgba(16, 185, 129, 0.1)',
    'memberships': 'rgba(168, 85, 247, 0.1)',
    'id_sequences': 'rgba(245, 158, 11, 0.1)',
    'savings': 'rgba(244, 63, 94, 0.1)',
  };
  return colors[id] || 'rgba(255, 255, 255, 0.1)';
}
