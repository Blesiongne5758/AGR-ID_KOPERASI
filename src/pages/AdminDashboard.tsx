import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CircleDollarSign,
  Link2,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { adminStats, members, loans, formatCurrency, formatDate } from '../data/mockData';

interface AdminDashboardProps {
  onLogout: () => void;
}

type Tab = 'overview' | 'members' | 'savings' | 'loans' | 'agrid' | 'reports';

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'members' as Tab, label: 'Anggota', icon: Users },
    { id: 'savings' as Tab, label: 'Simpanan', icon: Wallet },
    { id: 'loans' as Tab, label: 'Pinjaman', icon: CircleDollarSign },
    { id: 'agrid' as Tab, label: 'Integrasi AGRID', icon: Link2 },
    { id: 'reports' as Tab, label: 'Laporan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Admin Panel</h2>
              <p className="text-xs text-slate-400">Koperasi Digital</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-slate-900">Koperasi AGRID Sejahtera</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari..."
                    className="pl-10 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'members' && <MembersTab />}
          {activeTab === 'savings' && <SavingsTab />}
          {activeTab === 'loans' && <LoansTab />}
          {activeTab === 'agrid' && <AgridTab />}
          {activeTab === 'reports' && <ReportsTab />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    {
      title: 'Total Aset',
      value: formatCurrency(adminStats.total_assets),
      icon: TrendingUp,
      trend: { value: 12.5, isPositive: true },
      color: 'emerald',
    },
    {
      title: 'NPL Ratio',
      value: `${adminStats.npl_ratio}%`,
      icon: AlertTriangle,
      trend: { value: -0.3, isPositive: false },
      color: 'amber',
    },
    {
      title: 'Anggota Aktif',
      value: adminStats.active_members.toLocaleString(),
      icon: Users,
      trend: { value: 28, isPositive: true },
      color: 'blue',
    },
    {
      title: 'SHU Berjalan',
      value: formatCurrency(adminStats.running_shu),
      icon: TrendingUp,
      trend: { value: 8.2, isPositive: true },
      color: 'purple',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
        <p className="text-slate-600">Selamat datang kembali! Berikut ringkasan koperasi Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  stat.trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {stat.trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stat.trend.value > 0 ? '+' : ''}{stat.trend.value}%</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-slate-600">{stat.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Aktivitas Terbaru</h2>
          <div className="space-y-4">
            {[
              { action: 'Anggota baru bergabung', name: 'Siti Nurhaliza', time: '2 jam lalu' },
              { action: 'Setoran simpanan', name: 'Budi Santoso', time: '3 jam lalu' },
              { action: 'Pengajuan pinjaman', name: 'Dewi Lestari', time: '5 jam lalu' },
              { action: 'Pembayaran angsuran', name: 'Eko Prasetyo', time: '1 hari lalu' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                  <p className="text-xs text-slate-600">{activity.name}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ringkasan Keuangan</h2>
          <div className="space-y-4">
            {[
              { label: 'Total Simpanan Anggota', value: formatCurrency(adminStats.total_savings), percent: 77 },
              { label: 'Total Pinjaman Aktif', value: formatCurrency(adminStats.total_loans), percent: 23 },
              { label: 'Pendapatan Bulanan', value: formatCurrency(adminStats.monthly_revenue), percent: 65 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="text-slate-900 font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersTab() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Manajemen Anggota</h1>
          <p className="text-slate-600">Kelola data anggota, approval pendaftaran, dan cetak kartu digital</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Anggota
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Anggota</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase hidden sm:table-cell">ID</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Bergabung</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                        {member.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{member.full_name}</div>
                        <div className="text-xs text-slate-500">{member.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <code className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{member.member_id}</code>
                  </td>
                  <td className="py-3 px-4 text-slate-600 hidden md:table-cell">{formatDate(member.join_date)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
                      member.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                      {member.status === 'PENDING' && (
                        <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 transition-colors">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SavingsTab() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Unit Simpanan</h1>
          <p className="text-slate-600">Input setoran Simpanan Pokok/Wajib/Sukarela dan riwayat mutasi</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Input Setoran
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { type: 'Simpanan Pokok', total: 3_000_000, members: 1_200, color: 'emerald' },
          { type: 'Simpanan Wajib', total: 12_000_000, members: 1_247, color: 'blue' },
          { type: 'Simpanan Sukarela', total: 1_875_000_000, members: 1_180, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${s.color}-500/10 flex items-center justify-center`}>
                <Wallet className={`w-5 h-5 text-${s.color}-400`} />
              </div>
              <span className="text-sm font-medium text-slate-700">{s.type}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">{formatCurrency(s.total)}</div>
            <div className="text-xs text-slate-500">{s.members.toLocaleString()} anggota</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Mutasi Terbaru</h2>
        <div className="space-y-3">
          {[
            { member: 'Ahmad Suryadi', type: 'Sukarela', amount: 500_000, date: '10 Jan 2025', isDeposit: true },
            { member: 'Siti Nurhaliza', type: 'Wajib', amount: 200_000, date: '09 Jan 2025', isDeposit: true },
            { member: 'Budi Santoso', type: 'Sukarela', amount: -1_000_000, date: '08 Jan 2025', isDeposit: false },
            { member: 'Dewi Lestari', type: 'Wajib', amount: 200_000, date: '07 Jan 2025', isDeposit: true },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                  tx.isDeposit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {tx.isDeposit ? '↓' : '↑'}
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900">{tx.member}</div>
                  <div className="text-xs text-slate-500">Simpanan {tx.type} • {tx.date}</div>
                </div>
              </div>
              <div className={`text-sm font-bold ${tx.isDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tx.isDeposit ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoansTab() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Unit Pinjaman</h1>
          <p className="text-slate-600">Daftar pengajuan pinjaman, workflow approval, dan tracking angsuran</p>
        </div>
        <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Pengajuan Baru
        </button>
      </div>

      <div className="space-y-4">
        {loans.map((loan) => (
          <div key={loan.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                  loan.type === 'MODAL_USAHA' ? 'bg-emerald-500/10' :
                  loan.type === 'DARURAT' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                }`}>
                  {loan.type === 'MODAL_USAHA' ? '💼' : loan.type === 'DARURAT' ? '🚨' : '🛒'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{loan.member_name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      loan.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                      loan.status === 'APPROVED' ? 'bg-blue-50 text-blue-600' :
                      loan.status === 'DISBURSED' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {loan.type.replace('_', ' ')} • {formatCurrency(loan.amount)} • Bunga {loan.interest_rate}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Angsuran {loan.paid_installments}/{loan.installments} • Jatuh tempo: {formatDate(loan.next_payment_date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 hidden sm:block">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${loan.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${(loan.paid_installments / loan.installments) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 text-center">
                    {Math.round((loan.paid_installments / loan.installments) * 100)}% lunas
                  </div>
                </div>
                {(loan.status === 'PENDING' || loan.status === 'VERIFIED') && (
                  <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                    Proses
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-1">
                {['PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED'].map((step, i) => {
                  const steps = ['PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED'];
                  const currentIdx = steps.indexOf(loan.status);
                  const isComplete = i <= currentIdx;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isComplete ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}>
                        {i + 1}
                      </div>
                      {i < 4 && (
                        <div className={`flex-1 h-0.5 mx-1 ${isComplete && i < currentIdx ? 'bg-emerald-500/50' : 'bg-slate-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {['Verifikasi', 'Persetujuan', 'Approve', 'Cair', 'Selesai'].map(label => (
                  <span key={label} className="text-[9px] text-slate-500 flex-1 text-center">{label}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgridTab() {
  const [agridSync, setAgridSync] = useState(true);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Integrasi AGRID</h1>
        <p className="text-slate-600">Sinkronisasi produk koperasi ke Marketplace AGRID dan lihat pesanan Paylater</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl">🔄</div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Sinkronisasi Otomatis</h3>
              <p className="text-xs text-slate-500">Produk koperasi akan tampil di Marketplace AGRID</p>
            </div>
          </div>
          <button
            onClick={() => setAgridSync(!agridSync)}
            className={`relative w-14 h-7 rounded-full transition-all ${agridSync ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all" style={{ left: agridSync ? '30px' : '2px' }} />
          </button>
        </div>
        {agridSync && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-700">Terhubung - Sinkronisasi terakhir: 5 menit yang lalu</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Produk Koperasi di Marketplace</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Beras Organik 5kg', price: 75_000, stock: 120, sold: 45 },
            { name: 'Pupuk NPK Premium', price: 150_000, stock: 80, sold: 32 },
            { name: 'Benih Jagung Hibrida', price: 45_000, stock: 200, sold: 89 },
          ].map((product, i) => (
            <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-sm font-medium text-slate-900 mb-1">{product.name}</div>
              <div className="text-emerald-600 font-bold mb-2">{formatCurrency(product.price)}</div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Stok: {product.stock}</span>
                <span>Terjual: {product.sold}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pesanan Paylater AGRID</h3>
        <div className="space-y-3">
          {[
            { member: 'Ahmad Suryadi', product: 'Pupuk NPK Premium x2', amount: 300_000, status: 'Selesai' },
            { member: 'Siti Nurhaliza', product: 'Benih Jagung x5', amount: 225_000, status: 'Dikirim' },
            { member: 'Budi Santoso', product: 'Beras Organik x3', amount: 225_000, status: 'Proses' },
          ].map((order, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <div className="text-sm font-medium text-slate-900">{order.member}</div>
                <div className="text-xs text-slate-500">{order.product}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">{formatCurrency(order.amount)}</div>
                <div className="text-xs text-emerald-600">{order.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Laporan</h1>
        <p className="text-slate-600">Cetak neraca, laporan SHU per anggota, dan ekspor data</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: 'Neraca Keuangan', desc: 'Laporan posisi keuangan koperasi', icon: '📊', format: 'PDF' },
          { title: 'Laporan SHU per Anggota', desc: 'Sisa Hasil Usaha tahun berjalan', icon: '📈', format: 'Excel' },
          { title: 'Mutasi Simpanan', desc: 'Riwayat seluruh transaksi simpanan', icon: '💰', format: 'Excel' },
          { title: 'Laporan Pinjaman', desc: 'Status seluruh pinjaman aktif', icon: '🏦', format: 'PDF' },
          { title: 'Laporan NPL', desc: 'Analisis kredit macet', icon: '⚠️', format: 'PDF' },
          { title: 'Daftar Anggota', desc: 'Data lengkap seluruh anggota', icon: '👥', format: 'Excel' },
        ].map((report, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{report.icon}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                report.format === 'PDF' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {report.format}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">{report.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{report.desc}</p>
            <button className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
              <Download className="w-3 h-3" />
              Unduh {report.format}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
