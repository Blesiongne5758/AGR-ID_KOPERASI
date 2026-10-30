import { useState } from 'react';
import {
  Home,
  Wallet,
  CircleDollarSign,
  History,
  ShoppingBag,
  LogOut,
  User,
  CreditCard,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { members, loans, transactions, formatCurrency, formatDate } from '../data/mockData';

interface MemberDashboardProps {
  onLogout: () => void;
}

type Tab = 'home' | 'savings' | 'loans' | 'history' | 'agrid';

export default function MemberDashboard({ onLogout }: MemberDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const member = members[0]; // Ahmad Suryadi
  const memberLoans = loans.filter(l => l.member_id === member.member_id && l.status !== 'COMPLETED');
  const activeLoan = memberLoans[0];

  const totalSavings = member.savings.pokok + member.savings.wajib + member.savings.sukarela;

  const tabs = [
    { id: 'home' as Tab, icon: Home, label: 'Beranda' },
    { id: 'savings' as Tab, icon: Wallet, label: 'Simpanan' },
    { id: 'loans' as Tab, icon: CircleDollarSign, label: 'Pinjaman' },
    { id: 'history' as Tab, icon: History, label: 'Riwayat' },
    { id: 'agrid' as Tab, icon: ShoppingBag, label: 'AGRID' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {member.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">{member.full_name}</h1>
              <p className="text-[10px] text-emerald-600">{member.member_id} • Koperasi AGRID</p>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <LogOut className="w-4 h-4" />
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
                    <User className="w-4 h-4 text-emerald-200" />
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
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-600">Total Simpanan</span>
                <button onClick={() => setActiveTab('savings')} className="text-xs text-emerald-600 font-medium">Lihat Detail →</button>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-4">{formatCurrency(totalSavings)}</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Pokok', value: member.savings.pokok, color: 'text-emerald-600' },
                  { label: 'Wajib', value: member.savings.wajib, color: 'text-blue-600' },
                  { label: 'Sukarela', value: member.savings.sukarela, color: 'text-purple-600' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-slate-50">
                    <div className={`text-sm font-bold ${s.color}`}>{formatCurrency(s.value)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Loan Status */}
            {activeLoan && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-600">Status Pinjaman Aktif</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    activeLoan.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {activeLoan.status === 'OVERDUE' ? '⚠️ Terlambat' : 'Aktif'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{activeLoan.type === 'MODAL_USAHA' ? '💼' : '🚨'}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{activeLoan.type.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">Sisa: {formatCurrency(activeLoan.remaining)}</div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress Pelunasan</span>
                    <span>{activeLoan.paid_installments}/{activeLoan.installments} angsuran</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${activeLoan.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                      style={{ width: `${(activeLoan.paid_installments / activeLoan.installments) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Jatuh tempo: <span className={activeLoan.status === 'OVERDUE' ? 'text-rose-600 font-medium' : 'text-slate-900'}>{formatDate(activeLoan.next_payment_date)}</span>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25">
                    💳 Bayar Angsuran
                  </button>
                </div>
              </div>
            )}

            {/* AGRID Quick Link */}
            <button
              onClick={() => setActiveTab('agrid')}
              className="w-full block bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🛒
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-bold text-slate-900">Belanja di AGRID</h3>
                  <p className="text-xs text-emerald-700">Gunakan saldo Paylater/Simpanan untuk belanja</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Transaksi Terakhir</h3>
                <button onClick={() => setActiveTab('history')} className="text-xs text-emerald-600 font-medium">Lihat Semua →</button>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 4).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${
                        tx.type === 'DEPOSIT' || tx.type === 'LOAN_DISBURSEMENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'LOAN_DISBURSEMENT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{tx.description}</div>
                        <div className="text-[10px] text-slate-500">{formatDate(tx.date)}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${
                      tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
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
            <h2 className="text-xl font-bold text-slate-900">Portofolio Simpanan</h2>

            {[
              { type: 'Simpanan Pokok', value: member.savings.pokok, icon: '🏦', color: 'from-emerald-500 to-teal-500', desc: 'Wajib dibayar sekali saat mendaftar' },
              { type: 'Simpanan Wajib', value: member.savings.wajib, icon: '📋', color: 'from-blue-500 to-cyan-500', desc: 'Dibayar setiap bulan (Rp 200.000)' },
              { type: 'Simpanan Sukarela', value: member.savings.sukarela, icon: '💎', color: 'from-purple-500 to-violet-500', desc: 'Setor & tarik kapan saja' },
            ].map((s, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color}`} />
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} bg-opacity-20 flex items-center justify-center text-2xl`}>
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-600">{s.type}</div>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(s.value)}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
              <div className="text-sm text-emerald-700 mb-1">Total Seluruh Simpanan</div>
              <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalSavings)}</div>
            </div>
          </div>
        )}

        {/* Loans Tab */}
        {activeTab === 'loans' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Status Pinjaman</h2>

            {memberLoans.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl mb-4 block">🎉</span>
                <p className="text-slate-600">Tidak ada pinjaman aktif</p>
              </div>
            ) : (
              memberLoans.map(loan => (
                <div key={loan.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      loan.type === 'MODAL_USAHA' ? 'bg-emerald-500/10' :
                      loan.type === 'DARURAT' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                    }`}>
                      {loan.type === 'MODAL_USAHA' ? '💼' : loan.type === 'DARURAT' ? '🚨' : '🛒'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{loan.type.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-500">{formatCurrency(loan.amount)} • {loan.interest_rate}%/bulan</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      loan.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {loan.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">Pelunasan</span>
                      <span className="text-slate-900 font-medium">{loan.paid_installments}/{loan.installments}</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${
                          loan.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
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
                    <div className="p-2 rounded-lg bg-slate-50 text-center">
                      <div className="text-xs text-slate-500">Sisa Pinjaman</div>
                      <div className="text-sm font-bold text-slate-900">{formatCurrency(loan.remaining)}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 text-center">
                      <div className="text-xs text-slate-500">Jatuh Tempo</div>
                      <div className={`text-sm font-bold ${loan.status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-900'}`}>
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
            <h2 className="text-xl font-bold text-slate-900">Riwayat Transaksi</h2>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div key={tx.id} className="relative flex items-start gap-4 pl-2">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      tx.type === 'DEPOSIT' || tx.type === 'LOAN_DISBURSEMENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {tx.type === 'DEPOSIT' || tx.type === 'LOAN_DISBURSEMENT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{tx.description}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{tx.category} • {formatDate(tx.date)}</div>
                        </div>
                        <div className={`text-sm font-bold whitespace-nowrap ${
                          tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {tx.type === 'WITHDRAWAL' || tx.type === 'LOAN_PAYMENT' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
                <ShoppingBag className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">AGRID Marketplace</h2>
              <p className="text-sm text-slate-600">Belanja kebutuhan pertanian dengan saldo koperasi</p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <div className="text-xs text-emerald-700 mb-1">Saldo tersedia untuk belanja</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(member.savings.sukarela)}</div>
              <div className="text-xs text-emerald-600 mt-1">Dari Simpanan Sukarela + Limit Paylater</div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Produk Populer</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Beras Organik 5kg', price: 75_000, img: '🌾' },
                  { name: 'Pupuk NPK Premium', price: 150_000, img: '🧪' },
                  { name: 'Benih Jagung Hibrida', price: 45_000, img: '🌽' },
                  { name: 'Pestisida Organik', price: 85_000, img: '🧴' },
                ].map((product, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow">
                    <div className="text-3xl mb-2 text-center">{product.img}</div>
                    <div className="text-xs font-medium text-slate-900 mb-1 text-center">{product.name}</div>
                    <div className="text-sm font-bold text-emerald-600 text-center">{formatCurrency(product.price)}</div>
                    <button className="w-full mt-2 py-1.5 bg-emerald-500/10 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-500/20 transition-colors">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
