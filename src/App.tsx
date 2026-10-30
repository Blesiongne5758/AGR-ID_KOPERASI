import { useState } from 'react';
import { Calculator, Calendar, TrendingUp, Database, Copy, Check, Code2 } from 'lucide-react';

const goCode = `package usecase

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
)

type LoanSchedule struct {
	ID             uuid.UUID
	LoanID         uuid.UUID
	InstallmentNo  int
	DueDate        time.Time
	PrincipalDue   float64
	InterestDue    float64
	TotalDue       float64
	RemainingBal   float64
	Status         string
}

func CalculateAndInsertAnnuitySchedule(
	ctx context.Context, 
	tx *sql.Tx, 
	loanID uuid.UUID, 
	principal float64, 
	annualRatePercent float64, 
	months int, 
	startDate time.Time,
) error {
	// 1. Konversi bunga tahunan ke bulanan
	monthlyRate := (annualRatePercent / 100) / 12

	// 2. Hitung Cicilan Tetap (Annuity Payment)
	// Rumus: A = P * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
	numerator := monthlyRate * math.Pow(1+monthlyRate, float64(months))
	denominator := math.Pow(1+monthlyRate, float64(months)) - 1
	fixedPayment := principal * (numerator / denominator)

	// Pembulatan ke 2 desimal (Rupiah)
	fixedPayment = math.Round(fixedPayment*100) / 100

	remainingBalance := principal
	currentDate := startDate

	// 3. Looping untuk membuat jadwal per bulan
	for i := 1; i <= months; i++ {
		// Hitung bunga bulan ini
		interestDue := math.Round(remainingBalance*monthlyRate*100) / 100
		
		// Hitung pokok bulan ini
		principalDue := fixedPayment - interestDue

		// PENTING: Penyesuaian Bulan Terakhir
		if i == months {
			principalDue = remainingBalance
			fixedPayment = principalDue + interestDue
		}

		// Update sisa saldo
		remainingBalance -= principalDue
		if remainingBalance < 0 {
			remainingBalance = 0
		}

		// Tambah 1 bulan untuk jatuh tempo
		currentDate = currentDate.AddDate(0, 1, 0)

		// 4. Insert ke Database
		query := \`
			INSERT INTO loan_schedules 
			(id, loan_id, installment_number, due_date, 
			 principal_due, interest_due, total_due, 
			 remaining_balance, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPCOMING')
		\`
		_, err := tx.ExecContext(ctx, query, 
			uuid.New(), loanID, i, currentDate, 
			principalDue, interestDue, fixedPayment, remainingBalance,
		)
		if err != nil {
			return fmt.Errorf("failed to insert schedule month %d: %w", i, err)
		}
	}

	return nil
}`;

interface ScheduleRow {
  month: number;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
  remaining: number;
}

function calculateAnnuity(
  principal: number,
  annualRate: number,
  months: number,
  startDate: Date
): { fixedPayment: number; schedule: ScheduleRow[] } {
  const monthlyRate = (annualRate / 100) / 12;
  
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  let fixedPayment = principal * (numerator / denominator);
  
  fixedPayment = Math.round(fixedPayment * 100) / 100;
  
  let remainingBalance = principal;
  const schedule: ScheduleRow[] = [];
  const currentDate = new Date(startDate);
  
  for (let i = 1; i <= months; i++) {
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    let interestDue = Math.round(remainingBalance * monthlyRate * 100) / 100;
    let principalDue = fixedPayment - interestDue;
    
    if (i === months) {
      principalDue = remainingBalance;
      fixedPayment = principalDue + interestDue;
    }
    
    remainingBalance -= principalDue;
    if (remainingBalance < 0) remainingBalance = 0;
    
    schedule.push({
      month: i,
      dueDate: currentDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      principal: principalDue,
      interest: interestDue,
      total: fixedPayment,
      remaining: remainingBalance,
    });
  }
  
  return { fixedPayment, schedule };
}

function highlightGo(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/("[^"]*")/g, '<span class="text-emerald-400">$1</span>');

  const keywords = ['package', 'import', 'func', 'return', 'var', 'const', 'type', 'struct', 'if', 'for', 'range', 'error', 'nil', 'true', 'false'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  const types = ['context\\.Context', '\\*sql\\.Tx', 'uuid\\.UUID', 'float64', 'int', 'string', 'time\\.Time'];
  types.forEach(t => {
    const regex = new RegExp(`\\b(${t})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [principal, setPrincipal] = useState(10000000);
  const [annualRate, setAnnualRate] = useState(12);
  const [months, setMonths] = useState(12);
  const [startDate, setStartDate] = useState('2026-01-15');
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const result = calculateAnnuity(principal, annualRate, months, new Date(startDate));
  const totalPayment = result.fixedPayment * months;
  const totalInterest = totalPayment - principal;

  const handleCopy = () => {
    navigator.clipboard.writeText(goCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
              <Calculator className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Annuity Loan Calculator
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Calculate & Insert Annuity Schedule in 1 Transaction
          </p>
        </div>

        {/* Formula Card */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Annuity Formula
          </h3>
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <code className="text-sm text-cyan-300 font-mono block">
              A = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]
            </code>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { symbol: 'A', label: 'Annuity Payment', desc: 'Cicilan tetap per bulan' },
              { symbol: 'P', label: 'Principal', desc: 'Pokok pinjaman' },
              { symbol: 'r', label: 'Monthly Rate', desc: 'Bunga bulanan (desimal)' },
              { symbol: 'n', label: 'Number of Months', desc: 'Jumlah bulan' },
            ].map(item => (
              <div key={item.symbol} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-bold text-cyan-400">{item.symbol}</span>
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                </div>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calculator */}
        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          {/* Input */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Input Parameters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pokok Pinjaman (Rp)
                </label>
                <input
                  type="number"
                  value={principal}
                  onChange={e => setPrincipal(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(principal)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bunga Tahunan (%)
                </label>
                <input
                  type="number"
                  value={annualRate}
                  onChange={e => setAnnualRate(Number(e.target.value))}
                  step="0.1"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {annualRate}% per tahun = {(annualRate / 12).toFixed(2)}% per bulan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Jangka Waktu (Bulan)
                </label>
                <input
                  type="number"
                  value={months}
                  onChange={e => setMonths(Number(e.target.value))}
                  min="1"
                  max="360"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {months} bulan = {(months / 12).toFixed(1)} tahun
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Calculation Results
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-300 mb-1">Cicilan Tetap per Bulan</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(result.fixedPayment)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Total Pembayaran</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalPayment)}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-400 mb-1">Total Bunga</p>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(totalInterest)}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <p className="text-xs text-slate-400 mb-1">Effective Interest Rate</p>
                <p className="text-lg font-bold text-cyan-400">
                  {((totalInterest / principal) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            Payment Schedule ({months} months)
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm">
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-slate-400 font-semibold">Bulan</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-semibold">Jatuh Tempo</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-semibold">Pokok</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-semibold">Bunga</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-semibold">Total</th>
                    <th className="text-right py-2 px-3 text-slate-400 font-semibold">Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map(row => (
                    <tr key={row.month} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-slate-300">{row.month}</td>
                      <td className="py-2 px-3 text-slate-300">{row.dueDate}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{formatCurrency(row.principal)}</td>
                      <td className="py-2 px-3 text-right text-amber-400">{formatCurrency(row.interest)}</td>
                      <td className="py-2 px-3 text-right text-white font-medium">{formatCurrency(row.total)}</td>
                      <td className="py-2 px-3 text-right text-slate-400">{formatCurrency(row.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Code Display */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" />
            Implementation Code
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">annuity_calculator.go</span>
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
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  {showCode ? '▼ Collapse' : '▶ Show Code'}
                </button>
              </div>
            </div>

            {showCode ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono leading-relaxed">
                  <code>
                    {goCode.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 transition-colors">
                        <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">
                          {i + 1}
                        </span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: highlightGo(line) }}
                        />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calculator className="w-12 h-12 text-cyan-400/50 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  Full Go implementation dengan transaction support
                </p>
                <button
                  onClick={() => setShowCode(true)}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                  Lihat Full Code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Calculator, title: 'Annuity Formula', desc: 'Rumus anuitas standar untuk cicilan tetap', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: Database, title: 'Transaction Safe', desc: 'Insert semua jadwal dalam 1 transaksi DB', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: TrendingUp, title: 'Rounding Fix', desc: 'Penyesuaian bulan terakhir untuk rounding error', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Calendar, title: 'Date Calculation', desc: 'Auto-calculate jatuh tempo per bulan', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map(feature => {
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
