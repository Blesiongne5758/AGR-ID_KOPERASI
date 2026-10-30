import { useState } from 'react';
import { members, loans, transactions, formatCurrency, formatDate } from '../data/mockData';

interface Props {
  onLogout: () => void;
}

type Tab = 'home' | 'savings' | 'loans' | 'history' | 'agrid';

export default function MemberDashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const member = members[0]; // Ahmad Suryadi
  const memberLoans = loans.filter(l => l.member_id === member.member_id && l.status !== 'COMPLETED');
  const activeLoan = memberLoans[0];

  const totalSavings = member.savings.pokok + member.savings.wajib + member.savings.sukarela;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {member.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{member.full_name}</h1>
              <p className="text-[10px] text-emerald-400">{member.member_id} • Koperasi AGRID</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Digital Member Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <span className="text-xs font-medium text-emerald-200">KARTU ANGGOTA DIGITAL</span>
                  </div>
                  <span className="text-xs text-emerald-200/60">ID: {member.member_id}</span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border border-white/20">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{member.full_name}</h2>
                    <p className="text-sm text-emerald-200">{member.phone}</p>
                    <p className="text-xs text-emerald-200/60 mt-0.5">Bergabung: {formatDate(member.join_date)}</p>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-xs text-emerald-200">Aktif & Terverifikasi</span>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center">
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-sm grid grid-cols-4 grid-rows-4 gap-0.5 p-1">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`rounded-[1px] ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-white'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Savings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Total Simpanan</span>
                <span className="text-xs text-emerald-400">Lihat Detail →</span>
              </div>
              <div className="text-3xl font-bold text-white mb-4">{formatCurrency(totalSavings)}</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pokok', value: member.savings.pokok, color: 'text-emerald-400' },
                  { label: 'Wajib', value: member.savings.wajib, color: 'text-blue-400' },
                  { label: 'Sukarela', value: member.savings.sukarela, color: 'text-purple-400' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-white/5">
                    <div className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Loan Status */}
            {activeLoan && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Status Pinjaman Aktif</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    activeLoan.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {activeLoan.status === 'OVERDUE' ? '⚠️ Terlambat' : 'Aktif'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{activeLoan.type === 'MODAL_USAHA' ? '💼' : '🚨'}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{activeLoan.type.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">Sisa: {formatCurrency(activeLoan.remaining)}</div>
                  </div>
                </div>
                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress Pelunasan</span>
                    <span>{activeLoan.paid_installments}/{activeLoan.installments} angsuran</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${activeLoan.status === 'OVERDUE' ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                      style={{ width: `${(activeLoan.paid_installments / activeLoan.installments) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Jatuh tempo: <span className={activeLoan.status === 'OVERDUE' ? 'text-red-400 font-medium' : 'text-white'}>{formatDate(activeLoan.next_payment_date)}</span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                    💳 Bayar Angsuran
                  </button>
                </div>
              </div>
            )}

            {/* AGRID Quick Link */}
            <a
              href="https://github.com/blesiongne5758/agr-id"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-5 hover:from-emerald-500/30 hover:to-teal-500/30 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Belanja di AGRID</h3>
                  <p className="text-xs text-emerald-200/70">Gunakan saldo Paylater/Simpanan untuk belanja</p>
                </div>
                <svg className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Transaksi Terakhir</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-emerald-400">Lihat Semua →</button>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 4).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${getTxIconStyle(tx.type)}`}>
                        {getTxIcon(tx.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{tx.description}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Savings Tab */}
        {activeTab === 'savings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Portofolio Simpanan</h2>
            
            {/* Visual Cards */}
            {[
              { type: 'Simpanan Pokok', value: member.savings.pokok, icon: '🏦', color: 'from-emerald-500 to-teal-500', desc: 'Wajib dibayar sekali saat mendaftar' },
              { type: 'Simpanan Wajib', value: member.savings.wajib, icon: '📋', color: 'from-blue-500 to-cyan-500', desc: 'Dibayar setiap bulan (Rp 200.000)' },
              { type: 'Simpanan Sukarela', value: member.savings.sukarela, icon: '💎', color: 'from-purple-500 to-violet-500', desc: 'Setor & tarik kapan saja' },
            ].map(s => (
              <div key={s.type} className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color}`} />
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} bg-opacity-20 flex items-center justify-center text-2xl`}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">{s.type}</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(s.value)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center">
              <div className="text-sm text-emerald-300 mb-1">Total Seluruh Simpanan</div>
              <div className="text-3xl font-bold text-white">{formatCurrency(totalSavings)}</div>
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Status Pinjaman</h2>
            
            {memberLoans.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🎉</span>
                <p className="text-slate-400">Tidak ada pinjaman aktif</p>
              </div>
            ) : (
              memberLoans.map(loan => (
                <div key={loan.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      loan.type === 'MODAL_USAHA' ? 'bg-emerald-500/20' :
                      loan.type === 'DARURAT' ? 'bg-blue-500/20' : 'bg-purple-500/20'
                    }`}>
                      {loan.type === 'MODAL_USAHA' ? '💼' : loan.type === 'DARURAT' ? '🚨' : '🛒'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">{loan.type.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-400">{formatCurrency(loan.amount)} • {loan.interest_rate}%/bulan</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      loan.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {loan.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Pelunasan</span>
                      <span className="text-white font-medium">{loan.paid_installments}/{loan.installments}</span>
                    </div>
                    <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${
                          loan.status === 'OVERDUE' ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        }`}
                        style={{ width: `${Math.max((loan.paid_installments / loan.installments) * 100, 8)}%` }}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {Math.round((loan.paid_installments / loan.installments) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-xs text-slate-500">Sisa Pinjaman</div>
                      <div className="text-sm font-bold text-white">{formatCurrency(loan.remaining)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-center">
                      <div className="text-xs text-slate-500">Jatuh Tempo</div>
                      <div className={`text-sm font-bold ${loan.status === 'OVERDUE' ? 'text-red-400' : 'text-white'}`}>
                        {formatDate(loan.next_payment_date)}
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                    💳 Bayar Angsuran
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Riwayat Transaksi</h2>
            
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="relative flex items-start gap-4 pl-2">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${getTxIconStyle(tx.type)}`}>
                      {getTxIcon(tx.type)}
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-white">{tx.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{tx.category} • {formatDate(tx.date)}</div>
                        </div>
                        <div className={`text-sm font-bold whitespace-nowrap ${
                          tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 text-xs text-slate-500">
                        Saldo setelah: {formatCurrency(tx.balance_after)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AGRID Tab */}
        {activeTab === 'agrid' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">AGRID Marketplace</h2>
              <p className="text-sm text-slate-400">Belanja kebutuhan pertanian dengan saldo koperasi</p>
            </div>

            {/* Balance for AGRID */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-5">
              <div className="text-xs text-emerald-300 mb-1">Saldo tersedia untuk belanja</div>
              <div className="text-2xl font-bold text-white">{formatCurrency(member.savings.sukarela)}</div>
              <div className="text-xs text-emerald-200/60 mt-1">Dari Simpanan Sukarela + Limit Paylater</div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Produk Populer</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Beras Organik 5kg', price: 75_000, img: '🌾' },
                  { name: 'Pupuk NPK Premium', price: 150_000, img: '🧪' },
                  { name: 'Benih Jagung Hibrida', price: 45_000, img: '🌽' },
                  { name: 'Pestisida Organik', price: 85_000, img: '🧴' },
                ].map(product => (
                  <div key={product.name} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                    <div className="text-3xl mb-2 text-center">{product.img}</div>
                    <div className="text-xs font-medium text-white mb-1 text-center">{product.name}</div>
                    <div className="text-sm font-bold text-emerald-400 text-center">{formatCurrency(product.price)}</div>
                    <button className="w-full mt-2 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/30 transition-colors">
                      Beli
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://github.com/blesiongne5758/agr-id"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl text-center shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
            >
              Buka AGRID Marketplace →
            </a>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {[
            { id: 'home' as Tab, icon: '🏠', label: 'Beranda' },
            { id: 'savings' as Tab, icon: '💰', label: 'Simpanan' },
            { id: 'loans' as Tab, icon: '🏦', label: 'Pinjaman' },
            { id: 'history' as Tab, icon: '📜', label: 'Riwayat' },
            { id: 'agrid' as Tab, icon: '🛒', label: 'AGRID' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`text-lg ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>{tab.icon}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function getTxIcon(type: string): string {
  switch (type) {
    case 'DEPOSIT': return '↓';
    case 'WITHDRAWAL': return '↑';
    case 'LOAN_PAYMENT': return '💳';
    case 'LOAN_DISBURSEMENT': return '💰';
    default: return '•';
  }
}

function getTxIconStyle(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'bg-emerald-500/20 text-emerald-400';
    case 'WITHDRAWAL': return 'bg-red-500/20 text-red-400';
    case 'LOAN_PAYMENT': return 'bg-blue-500/20 text-blue-400';
    case 'LOAN_DISBURSEMENT': return 'bg-amber-500/20 text-amber-400';
    default: return 'bg-white/10 text-slate-400';
  }
}
