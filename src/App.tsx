import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatCard from './components/StatCard';
import { Users, Wallet, CircleDollarSign, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  // Mock data - dalam real app, ini akan datang dari context/API
  const cooperativeName = 'Koperasi AGRID Sejahtera';

  const stats = [
    {
      title: 'Total Anggota',
      value: 1247,
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      trend: { value: 12.5, isPositive: true },
      subtitle: '+142 bulan ini',
      color: 'emerald' as const,
    },
    {
      title: 'Total Simpanan',
      value: 'Rp 2.4 M',
      icon: <Wallet className="w-6 h-6 text-blue-400" />,
      trend: { value: 8.3, isPositive: true },
      subtitle: 'Pokok + Wajib + Sukarela',
      color: 'blue' as const,
    },
    {
      title: 'Pinjaman Aktif',
      value: 156,
      icon: <CircleDollarSign className="w-6 h-6 text-amber-400" />,
      trend: { value: 5.2, isPositive: true },
      subtitle: 'Total: Rp 890 Juta',
      color: 'amber' as const,
    },
    {
      title: 'NPL Ratio',
      value: '2.3%',
      icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
      trend: { value: -0.5, isPositive: false },
      subtitle: 'Non-Performing Loan',
      color: 'rose' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />

      {/* Main Content */}
      <div className="lg:pl-64 transition-all duration-300">
        {/* Header */}
        <Header cooperativeName={cooperativeName} />

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Dashboard
            </h1>
            <p className="text-slate-600">
              Selamat datang kembali! Berikut ringkasan koperasi Anda.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                subtitle={stat.subtitle}
                color={stat.color}
              />
            ))}
          </div>

          {/* Content Area - Placeholder untuk konten lainnya */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Aktivitas Terbaru
              </h2>
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

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Aksi Cepat
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Tambah Anggota', icon: '👤' },
                  { label: 'Input Simpanan', icon: '💰' },
                  { label: 'Proses Pinjaman', icon: '🏦' },
                  { label: 'Cetak Laporan', icon: '📊' },
                ].map((action, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/50 transition-all text-left"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
