import { useState } from 'react';
import { adminStats, members, loans, monthlyData, formatCurrency, formatDate } from '../data/mockData';
import IntegrationDiagram from '../components/IntegrationDiagram';

interface Props {
  onLogout: () => void;
}

type Tab = 'overview' | 'members' | 'savings' | 'loans' | 'agrid' | 'integration' | 'reports';

export default function AdminDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loanFilter, setLoanFilter] = useState<string>('ALL');
  const [memberSearch, setMemberSearch] = useState('');
  const [agridSync, setAgridSync] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'members', label: 'Anggota', icon: '👥' },
    { id: 'savings', label: 'Simpanan', icon: '💰' },
    { id: 'loans', label: 'Pinjaman', icon: '🏦' },
    { id: 'agrid', label: 'AGRID', icon: '🛒' },
    { id: 'integration', label: 'Integrasi API', icon: '🌐' },
    { id: 'reports', label: 'Laporan', icon: '📋' },
  ];

  const filteredLoans = loanFilter === 'ALL' ? loans : loans.filter(l => l.status === loanFilter);
  const filteredMembers = members.filter(m =>
    m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.member_id.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const maxChart = Math.max(...monthlyData.map(d => Math.max(d.savings, d.loans)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-lg">🏛️</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Admin Dashboard</h1>
                <p className="text-[10px] text-emerald-400">Koperasi AGRID Sejahtera</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300">Online</span>
              </div>
              <button onClick={onLogout} className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Aset', value: formatCurrency(adminStats.total_assets), icon: '💎', color: 'from-emerald-500 to-teal-500', change: '+12.5%' },
                { label: 'NPL Ratio', value: `${adminStats.npl_ratio}%`, icon: '⚠️', color: 'from-amber-500 to-orange-500', change: '-0.3%' },
                { label: 'Anggota Aktif', value: adminStats.active_members.toLocaleString(), icon: '👥', color: 'from-blue-500 to-cyan-500', change: '+28' },
                { label: 'SHU Berjalan', value: formatCurrency(adminStats.running_shu), icon: '📈', color: 'from-purple-500 to-violet-500', change: '+8.2%' },
              ].map(stat => (
                <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-all group">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
                    </div>
                    <span className="text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Tren Simpanan & Pinjaman (Miliar Rp)</h3>
                <div className="flex items-end justify-between gap-2 h-48">
                  {monthlyData.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5 items-end" style={{ height: '160px' }}>
                        <div
                          className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(d.savings / maxChart) * 100}%` }}
                          title={`Simpanan: ${d.savings}M`}
                        />
                        <div
                          className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:opacity-80"
                          style={{ height: `${(d.loans / maxChart) * 100}%` }}
                          title={`Pinjaman: ${d.loans}M`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-slate-400">Simpanan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-slate-400">Pinjaman</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Ringkasan Keuangan</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Simpanan Anggota', value: formatCurrency(adminStats.total_savings), percent: 77, color: 'bg-emerald-500' },
                    { label: 'Total Pinjaman Aktif', value: formatCurrency(adminStats.total_loans), percent: 23, color: 'bg-blue-500' },
                    { label: 'Pendapatan Bulanan', value: formatCurrency(adminStats.monthly_revenue), percent: 65, color: 'bg-purple-500' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-2xl font-bold text-amber-400">{adminStats.pending_loans}</div>
                    <div className="text-xs text-slate-400">Pinjaman Pending</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-400">{adminStats.total_members}</div>
                    <div className="text-xs text-slate-400">Total Anggota</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Manajemen Anggota</h2>
                <p className="text-sm text-slate-400">Kelola data anggota, approval, dan kartu digital</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cari anggota..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
                <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                  + Tambah
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Anggota</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">ID</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Bergabung</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Total Simpanan</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map(member => (
                      <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                              {member.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-white">{member.full_name}</div>
                              <div className="text-xs text-slate-500">{member.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <code className="text-xs px-2 py-0.5 rounded bg-white/5 text-emerald-400 border border-emerald-500/20">{member.member_id}</code>
                        </td>
                        <td className="py-3 px-4 text-slate-400 hidden md:table-cell">{formatDate(member.join_date)}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            member.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' :
                            member.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-white font-medium hidden lg:table-cell">
                          {formatCurrency(member.savings.pokok + member.savings.wajib + member.savings.sukarela)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Lihat Detail">
                              👁️
                            </button>
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Cetak Kartu">
                              🪪
                            </button>
                            {member.status === 'PENDING' && (
                              <button className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors" title="Approve">
                                ✅
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
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Unit Simpanan</h2>
                <p className="text-sm text-slate-400">Kelola simpanan Pokok, Wajib, dan Sukarela</p>
              </div>
              <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                + Input Setoran
              </button>
            </div>

            {/* Savings Summary */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { type: 'Simpanan Pokok', total: 3_000_000, members: 1_200, color: 'from-emerald-500 to-teal-500', icon: '🏦' },
                { type: 'Simpanan Wajib', total: 12_000_000, members: 1_247, color: 'from-blue-500 to-cyan-500', icon: '📋' },
                { type: 'Simpanan Sukarela', total: 1_875_000_000, members: 1_180, color: 'from-purple-500 to-violet-500', icon: '💎' },
              ].map(s => (
                <div key={s.type} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color}`} />
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-sm font-medium text-slate-300">{s.type}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{formatCurrency(s.total)}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.members.toLocaleString()} anggota</div>
                </div>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Mutasi Terbaru</h3>
              <div className="space-y-3">
                {[
                  { member: 'Ahmad Suryadi', type: 'Sukarela', amount: 500_000, date: '10 Jan 2025', isDeposit: true },
                  { member: 'Siti Nurhaliza', type: 'Wajib', amount: 200_000, date: '09 Jan 2025', isDeposit: true },
                  { member: 'Budi Santoso', type: 'Sukarela', amount: -1_000_000, date: '08 Jan 2025', isDeposit: false },
                  { member: 'Fatimah Azzahra', type: 'Wajib', amount: 200_000, date: '07 Jan 2025', isDeposit: true },
                  { member: 'Eko Prasetyo', type: 'Sukarela', amount: 2_000_000, date: '06 Jan 2025', isDeposit: true },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {tx.isDeposit ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{tx.member}</div>
                        <div className="text-xs text-slate-500">Simpanan {tx.type} • {tx.date}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${tx.isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.isDeposit ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Unit Pinjaman</h2>
                <p className="text-sm text-slate-400">Workflow approval dan tracking pinjaman</p>
              </div>
            </div>

            {/* Loan Filters */}
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'OVERDUE', 'COMPLETED'].map(f => (
                <button
                  key={f}
                  onClick={() => setLoanFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    loanFilter === f
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {f === 'ALL' ? 'Semua' : f}
                  {f !== 'ALL' && (
                    <span className="ml-1 opacity-60">({loans.filter(l => l.status === f).length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Loan Cards */}
            <div className="grid gap-4">
              {filteredLoans.map(loan => (
                <div key={loan.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        loan.type === 'MODAL_USAHA' ? 'bg-emerald-500/20' :
                        loan.type === 'DARURAT' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                      }`}>
                        {loan.type === 'MODAL_USAHA' ? '💼' : loan.type === 'DARURAT' ? '🚨' : '🛒'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{loan.member_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getLoanStatusStyle(loan.status)}`}>
                            {loan.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {loan.type.replace('_', ' ')} • {formatCurrency(loan.amount)} • Bunga {loan.interest_rate}%
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Angsuran {loan.paid_installments}/{loan.installments} • Jatuh tempo: {formatDate(loan.next_payment_date || loan.due_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Progress Bar */}
                      <div className="w-24 hidden sm:block">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${loan.status === 'OVERDUE' ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(loan.paid_installments / loan.installments) * 100}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 text-center">
                          {Math.round((loan.paid_installments / loan.installments) * 100)}% lunas
                        </div>
                      </div>
                      {(loan.status === 'PENDING' || loan.status === 'VERIFIED') && (
                        <button
                          onClick={() => setShowApprovalModal(loan.id)}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                        >
                          Proses
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Workflow Steps */}
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      {['PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED'].map((step, i) => {
                        const steps = ['PENDING', 'VERIFIED', 'APPROVED', 'DISBURSED', 'COMPLETED'];
                        const currentIdx = steps.indexOf(loan.status);
                        const isComplete = i <= currentIdx;
                        const isOverdue = loan.status === 'OVERDUE';
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isOverdue && i === currentIdx ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              isComplete ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-white/5 text-slate-600 border border-white/10'
                            }`}>
                              {i + 1}
                            </div>
                            {i < 4 && (
                              <div className={`flex-1 h-0.5 mx-1 ${isComplete && i < currentIdx ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {['Verifikasi', 'Persetujuan', 'Approve', 'Cair', 'Selesai'].map(label => (
                        <span key={label} className="text-[9px] text-slate-600 flex-1 text-center">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AGRID Tab */}
        {activeTab === 'agrid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Integrasi AGRID Marketplace</h2>
                <p className="text-sm text-slate-400">Sinkronisasi produk & pesanan dari AGRID</p>
              </div>
              <a
                href="https://github.com/blesiongne5758/agr-id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <span>🔗</span> GitHub AGRID
              </a>
            </div>

            {/* Sync Toggle */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">🔄</div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Sinkronisasi Otomatis</h3>
                    <p className="text-xs text-slate-400">Produk koperasi akan tampil di Marketplace AGRID</p>
                  </div>
                </div>
                <button
                  onClick={() => setAgridSync(!agridSync)}
                  className={`relative w-14 h-7 rounded-full transition-all ${agridSync ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${agridSync ? 'left-7.5' : 'left-0.5'}`}
                    style={{ left: agridSync ? '30px' : '2px' }}
                  />
                </button>
              </div>
              {agridSync && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300">Terhubung — Sinkronisasi terakhir: 5 menit yang lalu</span>
                </div>
              )}
            </div>

            {/* AGRID Products */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Produk Koperasi di Marketplace</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Beras Organik 5kg', price: 75_000, stock: 120, sold: 45 },
                  { name: 'Pupuk NPK Premium', price: 150_000, stock: 80, sold: 32 },
                  { name: 'Benih Jagung Hibrida', price: 45_000, stock: 200, sold: 89 },
                ].map(product => (
                  <div key={product.name} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-sm font-medium text-white mb-1">{product.name}</div>
                    <div className="text-emerald-400 font-bold">{formatCurrency(product.price)}</div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Stok: {product.stock}</span>
                      <span>Terjual: {product.sold}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Paylater Orders */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Pesanan Paylater AGRID</h3>
              <div className="space-y-3">
                {[
                  { member: 'Ahmad Suryadi', product: 'Pupuk NPK Premium x2', amount: 300_000, status: 'Selesai' },
                  { member: 'Siti Nurhaliza', product: 'Benih Jagung x5', amount: 225_000, status: 'Dikirim' },
                  { member: 'Budi Santoso', product: 'Beras Organik x3', amount: 225_000, status: 'Proses' },
                ].map((order, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div>
                      <div className="text-sm font-medium text-white">{order.member}</div>
                      <div className="text-xs text-slate-500">{order.product}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{formatCurrency(order.amount)}</div>
                      <div className="text-xs text-emerald-400">{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integration Tab */}
        {activeTab === 'integration' && (
          <IntegrationDiagram />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Laporan & Ekspor</h2>
              <p className="text-sm text-slate-400">Cetak neraca, SHU, dan laporan keuangan</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Neraca Keuangan', desc: 'Laporan posisi keuangan koperasi', icon: '📊', format: 'PDF' },
                { title: 'Laporan SHU per Anggota', desc: 'Sisa Hasil Usaha tahun berjalan', icon: '📈', format: 'Excel' },
                { title: 'Mutasi Simpanan', desc: 'Riwayat seluruh transaksi simpanan', icon: '💰', format: 'Excel' },
                { title: 'Laporan Pinjaman', desc: 'Status seluruh pinjaman aktif', icon: '🏦', format: 'PDF' },
                { title: 'Laporan NPL', desc: 'Analisis kredit macet', icon: '⚠️', format: 'PDF' },
                { title: 'Daftar Anggota', desc: 'Data lengkap seluruh anggota', icon: '👥', format: 'Excel' },
              ].map(report => (
                <div key={report.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{report.icon}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      report.format === 'PDF' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {report.format}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{report.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{report.desc}</p>
                  <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-colors">
                    📥 Unduh {report.format}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Proses Pinjaman</h3>
            <p className="text-sm text-slate-400 mb-4">Pilih tindakan untuk pinjaman ini:</p>
            <div className="space-y-2">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
              >
                ✅ Verifikasi
              </button>
              <button
                onClick={() => setShowApprovalModal(null)}
                className="w-full py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
              >
                👔 Setujui (Ketua)
              </button>
              <button
                onClick={() => setShowApprovalModal(null)}
                className="w-full py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-colors"
              >
                ❌ Tolak
              </button>
            </div>
            <button
              onClick={() => setShowApprovalModal(null)}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getLoanStatusStyle(status: string): string {
  const styles: Record<string, string> = {
    'PENDING': 'bg-amber-500/20 text-amber-400',
    'VERIFIED': 'bg-blue-500/20 text-blue-400',
    'APPROVED': 'bg-indigo-500/20 text-indigo-400',
    'DISBURSED': 'bg-emerald-500/20 text-emerald-400',
    'COMPLETED': 'bg-slate-500/20 text-slate-400',
    'OVERDUE': 'bg-red-500/20 text-red-400',
  };
  return styles[status] || 'bg-white/10 text-slate-400';
}
