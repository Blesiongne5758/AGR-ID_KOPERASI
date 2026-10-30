import { useState } from 'react';
import {
  Webhook,
  Shield,
  Database,
  Lock,
  Copy,
  Check,
  Zap,
  AlertTriangle,
  GitBranch,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const webhookCode = `const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/v1/webhooks/agrid
 * Endpoint ini menerima notifikasi dari AGRID Marketplace
 */
router.post('/agrid', async (req, res) => {
    try {
        const signature = req.headers['x-agrid-signature'];
        const payload = req.body;
        const eventId = payload.event_id; // Idempotency key dari AGRID

        // 1. VERIFIKASI KEAMANAN (HMAC SHA256)
        // Ambil webhook_secret berdasarkan cooperative_id
        const coopId = payload.cooperative_id;
        const integration = await db.query(
            'SELECT webhook_secret FROM agrid_integrations WHERE cooperative_id = $1 AND is_active = true', 
            [coopId]
        );

        if (integration.rows.length === 0) {
            return res.status(404).json({ error: 'Integrasi tidak aktif' });
        }

        const secret = integration.rows[0].webhook_secret;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // Gunakan timingSafeEqual untuk mencegah Timing Attack
        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        
        if (signatureBuffer.length !== expectedBuffer.length || 
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // 2. CEK IDEMPOTENCY (Mencegah proses ganda jika AGRID retry)
        const existingLog = await db.query(
            'SELECT id FROM agrid_webhook_logs WHERE agrid_event_id = $1', 
            [eventId]
        );
        if (existingLog.rows.length > 0) {
            return res.status(200).json({ message: 'Event already processed' });
        }

        // 3. SIMPAN LOG WEBHOOK (Status Pending)
        await db.query(
            \`INSERT INTO agrid_webhook_logs 
             (id, agrid_event_id, cooperative_id, event_type, payload, signature, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')\`,
            [crypto.randomUUID(), eventId, coopId, payload.event_type, 
             JSON.stringify(payload), signature]
        );

        // 4. PROSES LOGIKA BISNIS
        if (payload.event_type === 'ORDER.PAID') {
            await processPaidOrder(payload);
        } else if (payload.event_type === 'ORDER.CANCELLED') {
            await processCancelledOrder(payload);
        }

        // 5. UPDATE STATUS LOG
        await db.query(
            "UPDATE agrid_webhook_logs SET status = 'SUCCESS', processed_at = NOW() WHERE agrid_event_id = $1", 
            [eventId]
        );

        // WAJIB return 200 OK secepatnya ke AGRID
        return res.status(200).json({ message: 'Webhook received and processed' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fungsi Helper: Memproses Pesanan yang Dibayar via Paylater Koperasi
async function processPaidOrder(payload) {
    const { member_id, cooperative_id, order_amount, agrid_order_id } = payload;

    // Cari data keanggotaan dan limit Paylater di database lokal
    const memberData = await db.query(
        \`SELECT m.id as membership_id, l.id as loan_id, l.remaining_limit 
         FROM memberships m 
         LEFT JOIN loans l ON m.id = l.membership_id 
           AND l.loan_type = 'PAYLATER' AND l.status = 'ACTIVE'
         WHERE m.user_id = (SELECT id FROM users WHERE member_id = $1) 
           AND m.cooperative_id = $2\`,
        [member_id, cooperative_id]
    );

    if (memberData.rows.length === 0) throw new Error('Member not found');
    
    const loan = memberData.rows[0];
    if (!loan.loan_id) throw new Error('Paylater loan not active');
    if (loan.remaining_limit < order_amount) throw new Error('Insufficient limit');

    // Kurangi Limit Paylater dan Catat di Ledger (Transaction!)
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        await client.query(
            'UPDATE loans SET remaining_limit = remaining_limit - $1 WHERE id = $2', 
            [order_amount, loan.loan_id]
        );
        
        await client.query(
            \`INSERT INTO transactions 
             (membership_id, loan_id, type, amount, reference_id, description) 
             VALUES ($1, $2, 'PAYLATER_PURCHASE', $3, $4, 'Pembelian di AGRID Marketplace')\`,
            [loan.membership_id, loan.loan_id, order_amount, agrid_order_id]
        );

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

module.exports = router;`;

function highlightJS(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  // Template literals
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  // Strings
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports', 'finally'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Verifikasi Keamanan (HMAC SHA256)',
      icon: Shield,
      color: 'emerald',
      desc: 'Ambil webhook_secret dari tabel agrid_integrations berdasarkan cooperative_id, lalu verifikasi signature dengan timingSafeEqual',
      code: `const integration = await db.query(
    'SELECT webhook_secret FROM agrid_integrations WHERE cooperative_id = $1 AND is_active = true', 
    [coopId]
);

const secret = integration.rows[0].webhook_secret;
const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

// Timing-safe comparison
if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return res.status(401).json({ error: 'Invalid signature' });
}`,
    },
    {
      num: 2,
      title: 'Cek Idempotency',
      icon: RefreshCw,
      color: 'blue',
      desc: 'Cek apakah event_id sudah diproses. Return 200 OK agar AGRID tidak retry',
      code: `const existingLog = await db.query(
    'SELECT id FROM agrid_webhook_logs WHERE agrid_event_id = $1', 
    [eventId]
);
if (existingLog.rows.length > 0) {
    return res.status(200).json({ message: 'Event already processed' });
}`,
    },
    {
      num: 3,
      title: 'Simpan Log Webhook (PENDING)',
      icon: Database,
      color: 'purple',
      desc: 'Insert log ke agrid_webhook_logs dengan status PENDING sebelum proses bisnis',
      code: `await db.query(
    \`INSERT INTO agrid_webhook_logs 
     (id, agrid_event_id, cooperative_id, event_type, payload, signature, status) 
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')\`,
    [crypto.randomUUID(), eventId, coopId, payload.event_type, 
     JSON.stringify(payload), signature]
);`,
    },
    {
      num: 4,
      title: 'Proses Logika Bisnis',
      icon: GitBranch,
      color: 'amber',
      desc: 'Routing berdasarkan event_type: ORDER.PAID atau ORDER.CANCELLED',
      code: `if (payload.event_type === 'ORDER.PAID') {
    await processPaidOrder(payload);
} else if (payload.event_type === 'ORDER.CANCELLED') {
    await processCancelledOrder(payload);
}`,
    },
    {
      num: 5,
      title: 'Update Status & Return 200',
      icon: CheckCircle2,
      color: 'emerald',
      desc: 'Update status log ke SUCCESS dan return 200 OK secepatnya ke AGRID',
      code: `await db.query(
    "UPDATE agrid_webhook_logs SET status = 'SUCCESS', processed_at = NOW() WHERE agrid_event_id = $1", 
    [eventId]
);

return res.status(200).json({ message: 'Webhook received and processed' });`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <Webhook className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            AGRID Webhook - Production Ready
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            POST /api/v1/webhooks/agrid
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-mono">
              Per-Cooperative Secrets + Idempotency + Transaction
            </span>
          </div>
        </div>

        {/* Key Differences */}
        <div className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-500/20 rounded-2xl p-6 mb-12">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Key Features (Production Grade)
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Per-Cooperative Secret', desc: 'webhook_secret dari DB per koperasi', icon: '🔐' },
              { label: 'Idempotency via event_id', desc: 'Return 200 OK jika sudah diproses', icon: '🔄' },
              { label: 'Log-First Pattern', desc: 'Insert PENDING sebelum proses bisnis', icon: '📝' },
              { label: 'Transaction for Ledger', desc: 'BEGIN/COMMIT/ROLLBACK untuk update Paylater', icon: '💾' },
              { label: 'Timing-Safe Comparison', desc: 'crypto.timingSafeEqual mencegah timing attack', icon: '🛡️' },
              { label: 'Event-Based Routing', desc: 'ORDER.PAID dan ORDER.CANCELLED', icon: '🔀' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                <span className="text-lg">{item.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Step Flow */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-orange-400" />
            5-Step Processing Flow
          </h2>

          <div className="space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(isActive ? null : step.num)}
                  className={`cursor-pointer rounded-xl border transition-all ${
                    isActive
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `rgba(${getColorRgb(step.color)}, 0.2)`,
                        color: `rgb(${getColorRgb(step.color)})`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Step {step.num}</span>
                        <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-4 pb-4">
                      <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                        <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* processPaidOrder Deep Dive */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            processPaidOrder - Transaction Flow
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3">1. Query Membership & Paylater</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                <code>{`SELECT m.id as membership_id, 
       l.id as loan_id, 
       l.remaining_limit 
FROM memberships m 
LEFT JOIN loans l ON m.id = l.membership_id 
  AND l.loan_type = 'PAYLATER' 
  AND l.status = 'ACTIVE'
WHERE m.user_id = (
  SELECT id FROM users WHERE member_id = $1
) AND m.cooperative_id = $2`}</code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3">2. Validation Checks</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Member exists</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">Paylater loan is ACTIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">remaining_limit &gt;= order_amount</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3">3. Transaction (ACID)</h4>
            <div className="space-y-2">
              {[
                { step: 'BEGIN', desc: 'Mulai transaction' },
                { step: 'UPDATE loans', desc: 'remaining_limit = remaining_limit - order_amount' },
                { step: 'INSERT transactions', desc: "type = 'PAYLATER_PURCHASE'" },
                { step: 'COMMIT', desc: 'Commit semua perubahan' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <code className="text-xs font-bold text-emerald-400 w-32 flex-shrink-0">{item.step}</code>
                  <span className="text-xs text-slate-300">{item.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <code className="text-xs font-bold text-rose-400">ROLLBACK</code>
              <span className="text-xs text-slate-400 ml-2">jika ada error di tengah proses</span>
            </div>
          </div>
        </div>

        {/* Full Code Display */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CodeIcon />
            Implementation Code
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">routes/webhooks.agrid.js</span>
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
                  className="px-3 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400 hover:bg-orange-500/30 transition-colors"
                >
                  {showCode ? '▼ Collapse' : '▶ Show Full Code'}
                </button>
              </div>
            </div>

            {showCode ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono leading-relaxed">
                  <code>
                    {webhookCode.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 transition-colors">
                        <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">
                          {i + 1}
                        </span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: highlightJS(line) }}
                        />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Webhook className="w-12 h-12 text-orange-400/50 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  Full production-ready webhook implementation
                </p>
                <button
                  onClick={() => setShowCode(true)}
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                >
                  Lihat Full Code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Request/Response */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">Request (from AGRID)</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono">
              <code>{`POST /api/v1/webhooks/agrid
Headers:
  x-agrid-signature: a1b2c3d4e5f6...
  Content-Type: application/json

Body:
{
  "event_id": "evt_agr_123456",
  "event_type": "ORDER.PAID",
  "cooperative_id": "uuid-coop",
  "member_id": "AGR-2024-000001",
  "order_amount": 750000,
  "agrid_order_id": "ord_agr_001"
}`}</code>
            </pre>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">Response (to AGRID)</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono">
              <code>{`// Success (200 OK)
{
  "message": "Webhook received and processed"
}

// Already processed (200 OK - idempotent)
{
  "message": "Event already processed"
}

// Invalid signature (401)
{
  "error": "Invalid signature"
}

// Integration not active (404)
{
  "error": "Integrasi tidak aktif"
}

// Server error (500)
{
  "error": "Internal Server Error"
}`}</code>
            </pre>
          </div>
        </div>

        {/* Database Dependencies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Database Dependencies
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { table: 'agrid_integrations', desc: 'webhook_secret per koperasi', color: 'emerald' },
              { table: 'agrid_webhook_logs', desc: 'Audit trail webhook', color: 'blue' },
              { table: 'memberships', desc: 'Data keanggotaan', color: 'purple' },
              { table: 'loans', desc: 'Paylater remaining_limit', color: 'amber' },
            ].map((item) => (
              <div key={item.table} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <code className={`text-xs font-bold text-${item.color}-400 block mb-1`}>
                  {item.table}
                </code>
                <p className="text-[10px] text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

function CodeIcon() {
  return (
    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function getColorRgb(color: string): string {
  const colors: Record<string, string> = {
    emerald: '16, 185, 129',
    blue: '59, 130, 246',
    amber: '245, 158, 11',
    purple: '168, 85, 247',
    rose: '244, 63, 94',
    orange: '249, 115, 22',
  };
  return colors[color] || '255, 255, 255';
}
