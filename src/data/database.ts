export interface Column {
  name: string;
  type: string;
  constraint?: string;
  description: string;
}

export interface TableSchema {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  bgGlow: string;
  columns: Column[];
  description: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: '1:N' | 'N:1' | '1:1';
  label: string;
  onDelete?: string;
}

export const tables: TableSchema[] = [
  {
    id: 'cooperatives',
    name: 'cooperatives',
    subtitle: 'Tabel Koperasi',
    icon: '🏛️',
    color: 'text-blue-400',
    colorFrom: 'from-blue-500',
    colorTo: 'to-cyan-500',
    borderColor: 'border-blue-500/30',
    bgGlow: 'bg-blue-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PK', description: 'Primary key, auto-generated' },
      { name: 'name', type: 'VARCHAR(150)', constraint: 'NOT NULL', description: 'Nama koperasi' },
      { name: 'coop_code', type: 'VARCHAR(20)', constraint: 'UNIQUE', description: 'Kode unik koperasi (AGR, KOPMAJU)' },
      { name: 'legal_entity_number', type: 'VARCHAR(50)', constraint: '', description: 'Nomor badan hukum' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW', description: 'Waktu pembuatan' },
    ],
    description: 'Menyimpan data entitas koperasi yang terdaftar dalam sistem.',
  },
  {
    id: 'users',
    name: 'users',
    subtitle: 'Tabel Pengguna Global',
    icon: '👤',
    color: 'text-emerald-400',
    colorFrom: 'from-emerald-500',
    colorTo: 'to-teal-500',
    borderColor: 'border-emerald-500/30',
    bgGlow: 'bg-emerald-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PK', description: 'Primary key, auto-generated' },
      { name: 'member_id', type: 'VARCHAR(30)', constraint: 'UNIQUE', description: 'ID Unik Anggota (Primary Login Key)' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraint: 'NOT NULL', description: 'Hash password (bcrypt/argon2)' },
      { name: 'full_name', type: 'VARCHAR(150)', constraint: 'NOT NULL', description: 'Nama lengkap pengguna' },
      { name: 'phone', type: 'VARCHAR(20)', constraint: 'UNIQUE', description: 'Nomor telepon unik' },
      { name: 'created_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW', description: 'Waktu pembuatan akun' },
    ],
    description: 'Login credential global. Satu user bisa menjadi anggota beberapa koperasi.',
  },
  {
    id: 'memberships',
    name: 'memberships',
    subtitle: 'Tabel Keanggotaan',
    icon: '🔗',
    color: 'text-purple-400',
    colorFrom: 'from-purple-500',
    colorTo: 'to-violet-500',
    borderColor: 'border-purple-500/30',
    bgGlow: 'bg-purple-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PK', description: 'Primary key, auto-generated' },
      { name: 'user_id', type: 'UUID', constraint: 'FK → users', description: 'Referensi ke tabel users' },
      { name: 'cooperative_id', type: 'UUID', constraint: 'FK → cooperatives', description: 'Referensi ke tabel cooperatives' },
      { name: 'role', type: 'VARCHAR(20)', constraint: "DEFAULT 'MEMBER'", description: 'MEMBER, ADMIN, MANAGER' },
      { name: 'join_date', type: 'DATE', constraint: 'DEFAULT TODAY', description: 'Tanggal bergabung' },
      { name: 'status', type: 'VARCHAR(20)', constraint: "DEFAULT 'ACTIVE'", description: 'Status keanggotaan' },
    ],
    description: 'Menghubungkan user ke koperasi. UNIQUE(user_id, cooperative_id) mencegah duplikasi.',
  },
  {
    id: 'id_sequences',
    name: 'id_sequences',
    subtitle: 'Tabel Antrian ID',
    icon: '🔢',
    color: 'text-amber-400',
    colorFrom: 'from-amber-500',
    colorTo: 'to-orange-500',
    borderColor: 'border-amber-500/30',
    bgGlow: 'bg-amber-500/10',
    columns: [
      { name: 'cooperative_id', type: 'UUID', constraint: 'PK, FK', description: 'Primary key sekaligus FK ke cooperatives' },
      { name: 'current_year', type: 'INT', constraint: 'NOT NULL', description: 'Tahun berjalan untuk ID' },
      { name: 'current_sequence', type: 'INT', constraint: 'DEFAULT 0', description: 'Sequence terakhir (Pessimistic Locking)' },
    ],
    description: 'Mencegah race condition saat generate ID transaksi unik per koperasi per tahun.',
  },
  {
    id: 'savings',
    name: 'savings',
    subtitle: 'Tabel Simpanan (Ledger)',
    icon: '💰',
    color: 'text-rose-400',
    colorFrom: 'from-rose-500',
    colorTo: 'to-pink-500',
    borderColor: 'border-rose-500/30',
    bgGlow: 'bg-rose-500/10',
    columns: [
      { name: 'id', type: 'UUID', constraint: 'PK', description: 'Primary key, auto-generated' },
      { name: 'membership_id', type: 'UUID', constraint: 'FK → memberships', description: 'Referensi ke keanggotaan' },
      { name: 'type', type: 'VARCHAR(20)', constraint: 'NOT NULL', description: 'POKOK, WAJIB, SUKARELA' },
      { name: 'balance', type: 'NUMERIC(15,2)', constraint: 'DEFAULT 0.00', description: 'Saldo simpanan' },
      { name: 'updated_at', type: 'TIMESTAMP', constraint: 'DEFAULT NOW', description: 'Waktu terakhir diupdate' },
    ],
    description: 'Ledger sederhana untuk simpanan anggota. Mendukung 3 jenis: Pokok, Wajib, Sukarela.',
  },
];

export const relationships: Relationship[] = [
  { from: 'memberships', to: 'users', type: 'N:1', label: 'user_id', onDelete: 'CASCADE' },
  { from: 'memberships', to: 'cooperatives', type: 'N:1', label: 'cooperative_id', onDelete: 'CASCADE' },
  { from: 'id_sequences', to: 'cooperatives', type: '1:1', label: 'cooperative_id', onDelete: 'CASCADE' },
  { from: 'savings', to: 'memberships', type: 'N:1', label: 'membership_id' },
];
