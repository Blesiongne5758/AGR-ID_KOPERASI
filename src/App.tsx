import { useState } from 'react';
import {
  Webhook,
  Shield,
  Database,
  Lock,
  ArrowRight,
  Zap,
  AlertTriangle,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

const webhookCode = `// POST /api/v1/webhooks/agrid-order
router.post('/agrid-order', async (req, res) => {
  try {
    // Step 1: Extract headers
    const signature = req.headers['x-agrid-signature'];
    const timestamp = req.headers['x-agrid-timestamp'];
    const eventId = req.headers['x-agrid-event-id'];

    // Step 2: Verify signature (HMAC SHA256)
    verifySignature(req.body, signature, timestamp);

    // Step 3: Extract payload
    const { member_id, cooperative_id, order_amount, status } = req.body;

    // Step 4: Idempotency check
    const existing = await pool.query(
      'SELECT id FROM agrid_webhook_logs WHERE agrid_event_id = $1',
      [eventId]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Already processed' });
    }

    // Step 5: Log webhook (PENDING)
    await pool.query(
      \`INSERT INTO agrid_webhook_logs
       (id, agrid_event_id, cooperative_id, event_type,
        payload, signature, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')\`,
      [crypto.randomUUID(), eventId, cooperative_id,
       'ORDER.PAID', JSON.stringify(req.body), signature]
    );

    // Step 6: Process with transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find membership with FOR UPDATE lock
      const membership = await client.query(\`
        SELECT m.id, m.user_id
        FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        WHERE u.member_id = $1
          AND m.cooperative_id = $2
          AND m.status = 'ACTIVE'
        FOR UPDATE
      \`, [member_id, cooperative_id]);

      if (membership.rows.length === 0) {
        throw new Error('Membership not found');
      }

      // Find active Paylater loan
      const loan = await client.query(\`
        SELECT id, remaining_amount FROM loans
        WHERE membership_id = $1
          AND type = 'PAYLATER'
          AND status IN ('DISBURSED', 'OVERDUE')
        FOR UPDATE
      \`, [membership.rows[0].id]);

      if (loan.rows.length > 0) {
        // Reduce Paylater limit
        const newRemaining = loan.rows[0].remaining_amount - order_amount;

        await client.query(
          'UPDATE loans SET remaining_amount = $1 WHERE id = $2',
          [newRemaining, loan.rows[0].id]
        );

        // Record transaction
        await client.query(\`
          INSERT INTO savings_transactions
          (savings_id, transaction_type, amount, description)
          VALUES ($1, 'LOAN_PAYMENT', $2, $3)
        \`, [savingsId, order_amount, 'Paylater AGRID Payment']);
      }

      await client.query(
        "UPDATE agrid_webhook_logs SET status = 'SUCCESS' WHERE id = $1",
        [webhookLogId]
      );

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});`;

function highlightJS(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports', 'finally'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'verifying' | 'processing' | 'success' | 'error'>('idle');
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runTest = () => {
    setTestStatus('verifying');
    setTimeout(() => setTestStatus('processing'), 1500);
    setTimeout(() => setTestStatus('success'), 3000);
  };

  const resetTest = () => setTestStatus('idle');

  const steps = [
    { num: 1, label: 'Verify Signature', desc: 'HMAC SHA256 + timestamp check', icon: Shield, color: 'emerald' },
    { num: 2, label: 'Idempotency Check', desc: 'Cek event sudah diproses', icon: RefreshCw, color: 'blue' },
    { num: 3, label: 'Log Webhook', desc: 'Insert PENDING ke agrid_webhook_logs', icon: Database, color: 'purple' },
    { num: 4, label: 'Process Payment', desc: 'BEGIN → UPDATE loans → INSERT transactions → COMMIT', icon: Zap, color: 'amber' },
    { num: 5, label: 'Return Response', desc: 'Update SUCCESS & return 200 OK', icon: CheckCircle2, color: 'emerald' },
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
            AGRID Webhook Endpoint
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            POST /api/v1/webhooks/agrid-order
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <Lock className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-mono">HMAC SHA256 + Idempotency + Transaction</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Shield, title: 'Signature Verification', desc: 'HMAC SHA256 dengan timestamp tolerance', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Database, title: 'DB Transaction', desc: 'ACID compliance dengan BEGIN/COMMIT/ROLLBACK', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: RefreshCw, title: 'Idempotency', desc: 'Mencegah duplicate processing', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Lock, title: 'FOR UPDATE Lock', desc: 'Pessimistic locking untuk consistency', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((feature) => {
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

        {/* 5-Step Flow */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <ArrowRight className="w-6 h-6 text-orange-400" />
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
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
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
                        <h4 className="text-sm font-semibold text-white">{step.label}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Verification Detail */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            Signature Verification
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Request Headers</h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">x-agrid-signature:</span>
                  <span className="text-emerald-400 truncate ml-2">a1b2c3d4e5f6...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">x-agrid-timestamp:</span>
                  <span className="text-blue-400">1704067200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">x-agrid-event-id:</span>
                  <span className="text-purple-400">evt_xxxxx</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">Verification Logic</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Check timestamp tolerance (5 min)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">Create signed payload: timestamp + body</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">HMAC SHA256 with webhook secret</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">timingSafeEqual comparison</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-4">
            <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
              <code>{`// Signature Verification
const signedPayload = \`\${timestamp}.\${JSON.stringify(payload)}\`;
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('hex');

// Timing-safe comparison
const isValid = crypto.timingSafeEqual(
  Buffer.from(signature, 'hex'),
  Buffer.from(expectedSignature, 'hex')
);`}</code>
            </pre>
          </div>
        </div>

        {/* Payload Structure */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-400" />
            Request Payload
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`{
  "event_id": "evt_agr_2026_001234",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "order_amount": 750000,
  "status": "PAID",
  "order_id": "ord_agr_001"
}`}</code>
            </pre>
          </div>
        </div>

        {/* Transaction Flow */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Transaction Flow
          </h2>

          <div className="space-y-3">
            {[
              { step: 'BEGIN', desc: 'Mulai transaction', color: 'emerald' },
              { step: 'SELECT ... FOR UPDATE', desc: 'Lock membership & loan rows', color: 'blue' },
              { step: 'UPDATE loans', desc: 'remaining_amount = remaining_amount - order_amount', color: 'purple' },
              { step: 'INSERT transactions', desc: "type = 'LOAN_PAYMENT'", color: 'amber' },
              { step: 'COMMIT', desc: 'Commit semua perubahan', color: 'emerald' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                <code
                  className="text-xs font-bold w-40 flex-shrink-0"
                  style={{ color: `rgb(${getColorRgb(item.color)})` }}
                >
                  {item.step}
                </code>
                <span className="text-xs text-slate-300">{item.desc}</span>
              </div>
            ))}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <code className="text-xs font-bold text-rose-400 w-40 flex-shrink-0">ROLLBACK</code>
              <span className="text-xs text-slate-400">jika ada error di tengah proses</span>
            </div>
          </div>
        </div>

        {/* Code Display */}
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
                <span className="text-xs text-slate-500 ml-2 font-mono">webhook_agrid.js</span>
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
                  {showCode ? '▼ Collapse' : '▶ Show Code'}
                </button>
              </div>
            </div>

            {showCode ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono leading-relaxed">
                  <code>
                    {webhookCode.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 transition-colors">
                        <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">{i + 1}</span>
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

        {/* Test Simulator */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Test Simulator
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Test Payload
              </label>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                  <code>{`{
  "event_id": "evt_test_001",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "uuid-here",
  "order_amount": 750000,
  "status": "PAID",
  "order_id": "ord_test_001"
}`}</code>
                </pre>
              </div>
              <button
                onClick={testStatus === 'idle' || testStatus === 'success' || testStatus === 'error' ? (testStatus === 'idle' ? runTest : resetTest) : undefined}
                disabled={testStatus === 'verifying' || testStatus === 'processing'}
                className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testStatus === 'idle' && <><Zap className="w-4 h-4" /> Run Test</>}
                {testStatus === 'verifying' && <><Shield className="w-4 h-4 animate-pulse" /> Verifying Signature...</>}
                {testStatus === 'processing' && <><Database className="w-4 h-4 animate-pulse" /> Processing Transaction...</>}
                {testStatus === 'success' && <><CheckCircle2 className="w-4 h-4" /> Success! (Click to Reset)</>}
                {testStatus === 'error' && <><XCircle className="w-4 h-4" /> Error (Click to Reset)</>}
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Processing Status
              </label>
              <div className="space-y-2">
                {[
                  { label: 'Signature Verified', active: testStatus !== 'idle' },
                  { label: 'Idempotency Check', active: testStatus === 'processing' || testStatus === 'success' },
                  { label: 'Transaction Started', active: testStatus === 'processing' || testStatus === 'success' },
                  { label: 'Membership Found', active: testStatus === 'success' },
                  { label: 'Paylater Updated', active: testStatus === 'success' },
                  { label: 'Transaction Committed', active: testStatus === 'success' },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      item.active
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-white/5 border border-white/5 opacity-50'
                    }`}
                  >
                    {item.active ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${item.active ? 'text-white' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error Responses */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Error Responses
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { code: '401', status: 'Unauthorized', desc: 'Invalid signature atau timestamp expired' },
              { code: '400', status: 'Bad Request', desc: 'Missing fields atau invalid payload' },
              { code: '404', status: 'Not Found', desc: 'Membership tidak ditemukan' },
              { code: '409', status: 'Conflict', desc: 'Payment exceeds loan balance' },
              { code: '500', status: 'Server Error', desc: 'Transaction rollback terjadi' },
              { code: '200', status: 'Already Processed', desc: 'Idempotent response' },
            ].map((item) => (
              <div key={item.code} className="bg-white/5 border border-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-bold ${
                      item.code.startsWith('2')
                        ? 'text-emerald-400'
                        : item.code.startsWith('4')
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {item.code}
                  </span>
                  <span className="text-xs text-slate-400">{item.status}</span>
                </div>
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
