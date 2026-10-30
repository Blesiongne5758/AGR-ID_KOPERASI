export interface TechLayer {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  colorFrom: string;
  colorTo: string;
  borderColor: string;
  bgGlow: string;
  icon: string;
  technologies: string[];
  roles: string[];
  description: string;
}

export const layers: TechLayer[] = [
  {
    id: 'frontend',
    name: 'Frontend (UI/UX)',
    subtitle: 'Presentation Layer',
    color: 'text-blue-400',
    colorFrom: 'from-blue-500',
    colorTo: 'to-cyan-500',
    borderColor: 'border-blue-500/30',
    bgGlow: 'bg-blue-500/10',
    icon: '🎨',
    technologies: ['HTML5', 'Tailwind CSS', 'React.js', 'Vue.js'],
    roles: [
      'Single Page Application (SPA)',
      'Mobile-first untuk Anggota',
      'Dashboard Data-rich untuk Admin Koperasi',
    ],
    description:
      'Layer antarmuka pengguna yang responsif dan interaktif, mengutamakan pengalaman mobile untuk anggota koperasi.',
  },
  {
    id: 'api-gateway',
    name: 'API Gateway / BFF',
    subtitle: 'Backend for Frontend',
    color: 'text-emerald-400',
    colorFrom: 'from-emerald-500',
    colorTo: 'to-teal-500',
    borderColor: 'border-emerald-500/30',
    bgGlow: 'bg-emerald-500/10',
    icon: '🌐',
    technologies: ['Node.js', 'NestJS', 'Express'],
    roles: [
      'Menangani routing awal',
      'Validasi token JWT',
      'Agregasi data dari multiple services',
      'Jembatan integrasi API ke AGRID Marketplace',
    ],
    description:
      'Gerbang utama yang mengatur lalu lintas request, validasi autentikasi, dan agregasi data sebelum diteruskan ke core backend.',
  },
  {
    id: 'core-backend',
    name: 'Core Backend',
    subtitle: 'Financial Engine',
    color: 'text-purple-400',
    colorFrom: 'from-purple-500',
    colorTo: 'to-violet-500',
    borderColor: 'border-purple-500/30',
    bgGlow: 'bg-purple-500/10',
    icon: '⚙️',
    technologies: ['Golang', 'Gin', 'Fiber'],
    roles: [
      'Generate ID Unik (Pessimistic Locking)',
      'Perhitungan bunga otomatis',
      'Double-entry ledger system',
      'Manajemen transaksi berat',
    ],
    description:
      'Mesin utama keuangan koperasi yang menangani semua operasi kritis dengan performa tinggi dan konsistensi data.',
  },
  {
    id: 'database',
    name: 'Database',
    subtitle: 'Persistent Storage',
    color: 'text-amber-400',
    colorFrom: 'from-amber-500',
    colorTo: 'to-orange-500',
    borderColor: 'border-amber-500/30',
    bgGlow: 'bg-amber-500/10',
    icon: '🗄️',
    technologies: ['PostgreSQL', 'Row-Level Security', 'ACID Compliance'],
    roles: [
      'Penyimpanan data relasional',
      'Row-Level Security (RLS)',
      'ACID Compliance penuh',
      'Backup & replication otomatis',
    ],
    description:
      'Database relasional yang menjamin integritas data transaksi keuangan dengan fitur keamanan tingkat baris.',
  },
  {
    id: 'cache-queue',
    name: 'Cache & Queue',
    subtitle: 'Performance Layer',
    color: 'text-rose-400',
    colorFrom: 'from-rose-500',
    colorTo: 'to-pink-500',
    borderColor: 'border-rose-500/30',
    bgGlow: 'bg-rose-500/10',
    icon: '⚡',
    technologies: ['Redis', 'Bull Queue', 'Pub/Sub'],
    roles: [
      'Menyimpan sesi login',
      'Rate limiting per user',
      'Antrian notifikasi WhatsApp',
      'Antrian notifikasi Email',
    ],
    description:
      'Layer caching dan message queue untuk meningkatkan performa dan mengelola notifikasi secara asynchronous.',
  },
];
