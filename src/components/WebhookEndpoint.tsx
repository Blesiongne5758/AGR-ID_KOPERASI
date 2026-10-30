import { useState } from 'react';
import {
  Webhook,
  ShieldCheck,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  ArrowRight,
  Zap,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';

const webhookCode = `// POST /api/v1/webhooks/agrid-order
router.post('/agrid-order', async (req, res, next) => {
  try {
    // Step 1: Extract & Verify Signature
    const signature = req.headers['x-agrid-signature'];
    const timestamp = req.headers['x-agrid-timestamp'];
    
    verifyWebhookSignature(req.body, signature, timestamp);

    // Step 2: Extract Payload
    const { member_id, cooperative_id, order_amount, status } = req.body;

    // Step 3: Idempotency Check
    const existing = await pool.query(
      'SELECT id FROM webhook_logs WHERE event_id = $1',
      [req.headers['x-agrid-event-id']]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, message: 'Already processed' });
    }

    // Step 4: Database Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find membership with FOR UPDATE lock
      const membership = await client.query(\`
        SELECT m.id, m.user_id, m.cooperative_id
        FROM memberships m
        INNER JOIN users u ON m.user_id = u.id
        WHERE u.member_id = $1 AND m.cooperative_id = $2
        FOR UPDATE
      \`, [member_id, cooperative_id]);

      if (membership.rows.length === 0) {
        throw new Error('Membership not found');
      }

      // Step 5: Process Payment
      if (status === 'PAID') {
        // Find active Paylater loan
        const loan = await client.query(\`
          SELECT id, remaining_amount FROM loans
          WHERE membership_id = $1 AND type = 'PAYLATER'
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
            INSERT INTO savings_transactions (
              savings_id, transaction_type, amount,
              description, reference_number
            ) VALUES ($1, 'LOAN_PAYMENT', $2, $3, $4)
          \`, [savingsId, order_amount, 
               'Paylater AGRID Payment', orderId]);
        }
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});`;

function highlightJS(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  // Strings
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports', 'finally', 'true', 'false', 'null'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function WebhookEndpoint() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'verifying' | 'processing' | 'success' | 'error'>('idle');

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

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
          <Webhook className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Webhook Endpoint — AGRID Order</h2>
          <p className="text-sm text-slate-400 mt-1">
            Integration Engineer • HMAC-SHA256 Verification • Database Transaction
          </p>
        </div>
      </div>

      {/* Endpoint Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30">
              POST
            </span>
            <code className="text-sm sm:text-base text-white font-mono">
              /api/v1/webhooks/agrid-order
            </code>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Timeout: 30s</span>
            <span className="text-white/20">•</span>
            <Lock className="w-3.5 h-3.5" />
            <span>HMAC-SHA256</span>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: ShieldCheck, title: 'Signature Verification', desc: 'HMAC-SHA256 dengan timestamp tolerance', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Database, title: 'DB Transaction', desc: 'ACID compliance dengan BEGIN/COMMIT/ROLLBACK', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Zap, title: 'Idempotency', desc: 'Mencegah duplicate processing', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { icon: Lock, title: 'FOR UPDATE Lock', desc: 'Pessimistic locking untuk data consistency', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4">
              <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
              <p className="text-xs text-slate-400">{feature.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Webhook Flow */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-orange-400" />
          Alur Pemrosesan Webhook
        </h3>

        <div className="space-y-3">
          {[
            { step: 1, label: 'Receive Webhook', desc: 'AGRID mengirim POST request dengan signature', icon: '📥', color: 'emerald' },
            { step: 2, label: 'Verify Signature', desc: 'HMAC-SHA256 verification + timestamp check', icon: '🔐', color: 'blue' },
            { step: 3, label: 'Idempotency Check', desc: 'Cek apakah event sudah diproses sebelumnya', icon: '🔍', color: 'amber' },
            { step: 4, label: 'Begin Transaction', desc: 'Mulai database transaction (BEGIN)', icon: '🗄️', color: 'purple' },
            { step: 5, label: 'Find Membership', desc: 'Cari membership dengan FOR UPDATE lock', icon: '👥', color: 'rose' },
            { step: 6, label: 'Process Payment', desc: 'Kurangi limit Paylater atau catat transaksi', icon: '💰', color: 'emerald' },
            { step: 7, label: 'Commit Transaction', desc: 'Commit semua perubahan (COMMIT)', icon: '✅', color: 'blue' },
            { step: 8, label: 'Return Response', desc: 'Kirim response 200 OK ke AGRID', icon: '📤', color: 'amber' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className={`w-10 h-10 rounded-full bg-${item.color}-500/20 border border-${item.color}-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0`}
                style={{
                  backgroundColor: `rgba(${getColorRgb(item.color)}, 0.2)`,
                  borderColor: `rgba(${getColorRgb(item.color)}, 0.3)`,
                }}
              >
                <span>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Step {item.step}</span>
                  <h4 className="text-sm font-semibold text-white">{item.label}</h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signature Verification */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Signature Verification
        </h3>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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
                <span className="text-slate-300">HMAC-SHA256 with webhook secret</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-300">timingSafeEqual comparison</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
          <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
            <code>{`// Signature Verification
const signedPayload = \`\${timestamp}.\${JSON.stringify(payload)}\`;
const expectedSignature = crypto
  .createHmac('sha256', AGRID_WEBHOOK_SECRET)
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
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <span className="text-xs text-slate-500 font-mono">Request Payload</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">JSON</span>
        </div>
        <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
          <code>{`{
  "order_id": "ord_agr_2026_001234",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "987fcdeb-51a2-43d7-9012-3456789abcde",
  "order_amount": 750000,
  "status": "PAID",
  "items": [
    {
      "product_id": "prod_001",
      "name": "Beras Organik 5kg",
      "quantity": 2,
      "price": 75000
    }
  ],
  "payment_method": "PAYLATER",
  "created_at": "2026-01-15T10:30:00Z"
}`}</code>
        </pre>
      </div>

      {/* Database Transaction */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          Database Transaction Flow
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">1</div>
              <h4 className="text-sm font-semibold text-emerald-400">BEGIN Transaction</h4>
            </div>
            <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono">
              await client.query('BEGIN');
            </code>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">2</div>
              <h4 className="text-sm font-semibold text-blue-400">SELECT ... FOR UPDATE</h4>
            </div>
            <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono overflow-x-auto">
              {`SELECT m.id FROM memberships m
INNER JOIN users u ON m.user_id = u.id
WHERE u.member_id = $1 AND m.cooperative_id = $2
FOR UPDATE  -- Pessimistic lock`}
            </code>
          </div>

          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">3</div>
              <h4 className="text-sm font-semibold text-purple-400">UPDATE Paylater Loan</h4>
            </div>
            <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono overflow-x-auto">
              {`UPDATE loans 
SET remaining_amount = remaining_amount - $1,
    updated_at = NOW()
WHERE id = $2 AND type = 'PAYLATER'`}
            </code>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">4</div>
              <h4 className="text-sm font-semibold text-amber-400">INSERT Transaction Record</h4>
            </div>
            <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono overflow-x-auto">
              {`INSERT INTO savings_transactions (
  savings_id, transaction_type, amount,
  description, reference_number
) VALUES ($1, 'LOAN_PAYMENT', $2, $3, $4)`}
            </code>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-emerald-400">COMMIT (Success)</h4>
              </div>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono">
                await client.query('COMMIT');
              </code>
            </div>
            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-semibold text-rose-400">ROLLBACK (Error)</h4>
              </div>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded font-mono">
                await client.query('ROLLBACK');
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
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
          <div className="overflow-x-auto">
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
              Full webhook implementation tersedia di <code className="px-2 py-0.5 rounded bg-white/5 text-orange-400">public/code/webhook_agrid.js</code>
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

      {/* Test Simulator */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Webhook Test Simulator
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Input */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Test Payload
            </label>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5">
              <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                <code>{`{
  "order_id": "ord_test_001",
  "member_id": "AGR-2024-000001",
  "cooperative_id": "uuid-here",
  "order_amount": 750000,
  "status": "PAID"
}`}</code>
              </pre>
            </div>
            <button
              onClick={testStatus === 'idle' ? runTest : resetTest}
              disabled={testStatus === 'verifying' || testStatus === 'processing'}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
            >
              {testStatus === 'idle' && '🧪 Run Test'}
              {testStatus === 'verifying' && '🔐 Verifying Signature...'}
              {testStatus === 'processing' && '⚙️ Processing Transaction...'}
              {testStatus === 'success' && '✓ Test Complete (Click to Reset)'}
              {testStatus === 'error' && '✗ Error (Click to Reset)'}
            </button>
          </div>

          {/* Test Output */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Processing Status
            </label>
            <div className="space-y-2">
              {[
                { step: 'Signature Verified', active: testStatus !== 'idle' },
                { step: 'Idempotency Check', active: testStatus === 'processing' || testStatus === 'success' },
                { step: 'Transaction Started', active: testStatus === 'processing' || testStatus === 'success' },
                { step: 'Membership Found', active: testStatus === 'success' },
                { step: 'Paylater Updated', active: testStatus === 'success' },
                { step: 'Transaction Committed', active: testStatus === 'success' },
              ].map((item, i) => (
                <div
                  key={item.step}
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
                    {item.step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Error Responses
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { code: '401', status: 'Unauthorized', desc: 'Invalid signature atau timestamp expired' },
            { code: '400', status: 'Bad Request', desc: 'Missing fields atau invalid payload' },
            { code: '404', status: 'Not Found', desc: 'Membership tidak ditemukan' },
            { code: '409', status: 'Conflict', desc: 'Payment amount exceeds loan balance' },
            { code: '500', status: 'Server Error', desc: 'Transaction rollback terjadi' },
            { code: '200', status: 'Already Processed', desc: 'Idempotent response (duplicate event)' },
          ].map(item => (
            <div key={item.code} className="p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold ${
                  item.code.startsWith('2') ? 'text-emerald-400' :
                  item.code.startsWith('4') ? 'text-amber-400' :
                  'text-rose-400'
                }`}>{item.code}</span>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
              <p className="text-[10px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getColorRgb(color: string): string {
  const colors: Record<string, string> = {
    'emerald': '16, 185, 129',
    'blue': '59, 130, 246',
    'amber': '245, 158, 11',
    'purple': '168, 85, 247',
    'rose': '244, 63, 94',
  };
  return colors[color] || '255, 255, 255';
}
