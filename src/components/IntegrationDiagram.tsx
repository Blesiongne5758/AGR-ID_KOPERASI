import { useState } from 'react';

type IntegrationTab = 'overview' | 'webhook' | 'apikey' | 'sso';

export default function IntegrationDiagram() {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('overview');
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ key: string; secret: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [ssoStep, setSsoStep] = useState(0);
  const [isSsoRunning, setIsSsoRunning] = useState(false);

  const tabs: { id: IntegrationTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🌐' },
    { id: 'webhook', label: 'Webhook', icon: '📡' },
    { id: 'apikey', label: 'API Keys', icon: '🔐' },
    { id: 'sso', label: 'SSO', icon: '🔑' },
  ];

  const simulateWebhook = () => {
    const events: WebhookEvent[] = [
      { id: Date.now().toString(), type: 'order.created', member: 'Ahmad Suryadi', amount: 750000, timestamp: new Date().toISOString(), status: 'received' },
    ];
    setWebhookEvents([...events, ...webhookEvents].slice(0, 5));
    setTimeout(() => {
      setWebhookEvents(prev => prev.map(e => e.id === events[0].id ? { ...e, status: 'processed' } : e));
    }, 1500);
  };

  const generateApiKey = () => {
    setIsGeneratingKey(true);
    setTimeout(() => {
      setGeneratedKey({
        key: `agrid_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 8)}`,
        secret: `sec_${Math.random().toString(36).substring(2, 30)}${Math.random().toString(36).substring(2, 10)}`,
      });
      setIsGeneratingKey(false);
    }, 2000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const runSsoDemo = () => {
    setSsoStep(0);
    setIsSsoRunning(true);
    const steps = [1, 2, 3, 4, 5];
    steps.forEach((step, i) => {
      setTimeout(() => setSsoStep(step), (i + 1) * 1200);
    });
    setTimeout(() => setIsSsoRunning(false), 6500);
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Integrasi API — AGRID Marketplace</h2>
          <p className="text-sm text-slate-400 mt-1">Node.js sebagai Bridge: Webhook, API Key, & SSO</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
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
          {/* Architecture Diagram */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <span>🏗️</span> Arsitektur Integrasi
            </h3>
            <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
              {/* Koperasi System */}
              <div className="flex-1 w-full p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <div className="text-center mb-3">
                  <span className="text-2xl">🏛️</span>
                  <h4 className="text-sm font-bold text-emerald-400 mt-1">Sistem Koperasi</h4>
                </div>
                <div className="space-y-2">
                  {['Golang Core', 'PostgreSQL', 'Redis Queue'].map(item => (
                    <div key={item} className="text-xs text-center py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <div className="hidden lg:block text-[10px] text-slate-500">REST / Webhook</div>
                <svg className="w-16 h-6 text-teal-400 rotate-0 lg:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 100 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h90m0 0l-8-8m8 8l-8 8" />
                </svg>
                <div className="hidden lg:block text-[10px] text-slate-500">JSON + HMAC</div>
              </div>

              {/* Node.js Bridge */}
              <div className="flex-1 w-full p-5 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/30 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-[10px] text-teal-300 font-bold">
                  NODE.JS BRIDGE
                </div>
                <div className="text-center mb-3 mt-2">
                  <span className="text-2xl">🌉</span>
                  <h4 className="text-sm font-bold text-teal-400 mt-1">API Gateway</h4>
                </div>
                <div className="space-y-2">
                  {['Webhook Listener', 'API Key Manager', 'SSO Token Generator', 'Rate Limiter'].map(item => (
                    <div key={item} className="text-xs text-center py-1.5 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <div className="hidden lg:block text-[10px] text-slate-500">HTTPS + Auth</div>
                <svg className="w-16 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 100 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h90m0 0l-8-8m8 8l-8 8" />
                </svg>
                <div className="hidden lg:block text-[10px] text-slate-500">API Key + Secret</div>
              </div>

              {/* AGRID */}
              <div className="flex-1 w-full p-5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                <div className="text-center mb-3">
                  <span className="text-2xl">🛒</span>
                  <h4 className="text-sm font-bold text-blue-400 mt-1">AGRID Marketplace</h4>
                </div>
                <div className="space-y-2">
                  {['Product Catalog', 'Order System', 'Paylater Engine', 'User Accounts'].map(item => (
                    <div key={item} className="text-xs text-center py-1.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: '📡',
                title: 'Webhook Listener',
                desc: 'Endpoint /api/webhooks/agrid menerima notifikasi real-time dari AGRID',
                color: 'from-amber-500 to-orange-500',
                borderColor: 'border-amber-500/30',
                bgColor: 'bg-amber-500/10',
                textColor: 'text-amber-400',
              },
              {
                icon: '🔐',
                title: 'API Key Management',
                desc: 'Setiap koperasi mendapat api_key & api_secret untuk pull/push data',
                color: 'from-purple-500 to-violet-500',
                borderColor: 'border-purple-500/30',
                bgColor: 'bg-purple-500/10',
                textColor: 'text-purple-400',
              },
              {
                icon: '🔑',
                title: 'Single Sign-On',
                desc: 'Token sementara untuk auto-login anggota ke AGRID tanpa input ulang',
                color: 'from-blue-500 to-cyan-500',
                borderColor: 'border-blue-500/30',
                bgColor: 'bg-blue-500/10',
                textColor: 'text-blue-400',
              },
            ].map(pillar => (
              <div key={pillar.title} className={`relative overflow-hidden rounded-2xl bg-white/5 border ${pillar.borderColor} p-5 hover:bg-white/10 transition-all group`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${pillar.color}`} />
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{pillar.icon}</span>
                <h4 className={`text-sm font-bold ${pillar.textColor} mb-2`}>{pillar.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech Stack */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Stack Teknologi Integrasi</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Node.js', version: 'v20 LTS', icon: '🟢' },
                { name: 'NestJS', version: 'v10', icon: '🔴' },
                { name: 'HMAC-SHA256', version: 'Webhook Sign', icon: '🔏' },
                { name: 'JWT', version: 'SSO Token', icon: '🎫' },
              ].map(tech => (
                <div key={tech.name} className="p-3 rounded-lg bg-white/5 border border-white/5 text-center">
                  <span className="text-xl block mb-1">{tech.icon}</span>
                  <div className="text-xs font-bold text-white">{tech.name}</div>
                  <div className="text-[10px] text-slate-500">{tech.version}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhook Tab */}
      {activeTab === 'webhook' && (
        <div className="space-y-6">
          {/* Webhook Flow */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>📡</span> Webhook Flow
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              {[
                { label: 'AGRID Event', icon: '🛒', color: 'bg-blue-500/20 text-blue-400' },
                { label: 'POST /api/webhooks/agrid', icon: '📤', color: 'bg-teal-500/20 text-teal-400' },
                { label: 'Verify HMAC', icon: '🔏', color: 'bg-amber-500/20 text-amber-400' },
                { label: 'Process Event', icon: '⚙️', color: 'bg-purple-500/20 text-purple-400' },
                { label: 'Update DB', icon: '💾', color: 'bg-emerald-500/20 text-emerald-400' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2 flex-1 w-full">
                  <div className={`flex-1 p-3 rounded-lg ${step.color} border border-white/10 text-center`}>
                    <span className="text-lg block mb-1">{step.icon}</span>
                    <span className="text-[10px] font-medium">{step.label}</span>
                  </div>
                  {i < 4 && (
                    <svg className="w-4 h-4 text-white/20 flex-shrink-0 hidden sm:block" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            {/* Simulate Button */}
            <button
              onClick={simulateWebhook}
              className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-2"
            >
              <span>🧪</span> Simulasi Webhook Event
            </button>
          </div>

          {/* Code Example */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">webhook.controller.ts</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">NestJS</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`@Post('/api/webhooks/agrid')
async handleAgridWebhook(
  @Headers('x-agrid-signature') signature: string,
  @Headers('x-agrid-timestamp') timestamp: string,
  @Body() payload: AgridWebhookPayload,
) {
  // 1. Verify HMAC-SHA256 signature
  const isValid = this.webhookService.verifySignature(
    payload, signature, timestamp
  );
  
  if (!isValid) {
    throw new UnauthorizedException('Invalid signature');
  }

  // 2. Process based on event type
  switch (payload.event) {
    case 'order.created':
      await this.processOrderCreated(payload);
      break;
    case 'paylater.used':
      await this.processPaylaterUsed(payload);
      break;
    case 'payment.completed':
      await this.processPaymentCompleted(payload);
      break;
  }

  // 3. Queue notification to member
  await this.redisQueue.add('notify-member', {
    memberId: payload.data.member_id,
    message: payload.data.notification,
  });

  return { status: 'ok', received_at: new Date() };
}`}</code>
            </pre>
          </div>

          {/* Webhook Events Log */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Webhook Events
            </h3>
            {webhookEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Klik "Simulasi Webhook Event" untuk melihat demo
              </div>
            ) : (
              <div className="space-y-2">
                {webhookEvents.map(event => (
                  <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    event.status === 'processed'
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-amber-500/5 border-amber-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full ${
                        event.status === 'processed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <div>
                        <div className="text-xs font-mono text-white">{event.type}</div>
                        <div className="text-[10px] text-slate-500">
                          {event.member} • Rp {event.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      event.status === 'processed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {event.status === 'processed' ? '✓ Processed' : '⏳ Receiving...'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Types */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Jenis Webhook Events</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { event: 'order.created', desc: 'Anggota melakukan pembelian baru', icon: '🛒' },
                { event: 'paylater.used', desc: 'Pembayaran menggunakan Paylater Koperasi', icon: '💳' },
                { event: 'payment.completed', desc: 'Pembayaran angsuran berhasil', icon: '✅' },
                { event: 'product.synced', desc: 'Produk koperasi diupdate di AGRID', icon: '🔄' },
                { event: 'member.registered', desc: 'Anggota baru mendaftar via AGRID', icon: '👤' },
                { event: 'limit.updated', desc: 'Limit Paylater anggota diperbarui', icon: '📊' },
              ].map(evt => (
                <div key={evt.event} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-lg">{evt.icon}</span>
                  <div>
                    <code className="text-xs text-teal-400 font-mono">{evt.event}</code>
                    <p className="text-[10px] text-slate-500 mt-0.5">{evt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API Key Tab */}
      {activeTab === 'apikey' && (
        <div className="space-y-6">
          {/* API Key Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>🔐</span> API Key Management
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Setiap koperasi terdaftar mendapatkan <code className="px-1.5 py-0.5 rounded bg-white/5 text-purple-400 text-xs">api_key</code> dan <code className="px-1.5 py-0.5 rounded bg-white/5 text-purple-400 text-xs">api_secret</code> untuk melakukan pull/push data produk ke AGRID Marketplace.
            </p>

            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">Pilih Koperasi</label>
                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500">
                  <option value="">-- Pilih Koperasi --</option>
                  <option value="agr">AGR.BIZ.ID - KOPERASI DIGITAL (AGR)</option>
                  <option value="kpm">Koperasi Maju Bersama (KPM)</option>
                  <option value="spr">Koperasi Sumber Rejeki (SPR)</option>
                </select>
              </div>
              <button
                onClick={generateApiKey}
                disabled={isGeneratingKey}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingKey ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>🔑 Generate API Key</>
                )}
              </button>
            </div>

            {/* Generated Keys */}
            {generatedKey && (
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                  <span>⚠️</span>
                  <span>Simpan secret ini! Tidak akan ditampilkan lagi.</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">API Key</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-xs text-purple-300 font-mono overflow-x-auto">
                      {generatedKey.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedKey.key, 'key')}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'key' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">API Secret</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-xs text-purple-300 font-mono overflow-x-auto">
                      {generatedKey.secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(generatedKey.secret, 'secret')}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedField === 'secret' ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Example */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">Contoh Penggunaan API</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">cURL</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`# Push produk ke AGRID Marketplace
curl -X POST https://api.agrid.market/v1/products \\
  -H "X-API-Key: agride_live_xxxxxxxx" \\
  -H "X-API-Secret: sec_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Beras Organik 5kg",
    "price": 75000,
    "stock": 120,
    "category": "sembako",
    "cooperative_id": "coop_agr_001"
  }'

# Pull pesanan dari AGRID
curl -X GET https://api.agrid.market/v1/orders?status=pending \\
  -H "X-API-Key: agride_live_xxxxxxxx" \\
  -H "X-API-Secret: sec_xxxxxxxx"`}</code>
            </pre>
          </div>

          {/* Security Notes */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: '🔒', title: 'HMAC Signature', desc: 'Setiap request di-sign dengan HMAC-SHA256 menggunakan api_secret' },
              { icon: '🔄', title: 'Key Rotation', desc: 'Rotate key secara berkala, minimal setiap 90 hari' },
              { icon: '📊', title: 'Rate Limiting', desc: '1000 request/menit per koperasi untuk mencegah abuse' },
              { icon: '🌐', title: 'IP Whitelist', desc: 'Opsional: batasi request hanya dari IP server koperasi' },
            ].map(note => (
              <div key={note.title} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xl block mb-2">{note.icon}</span>
                <h4 className="text-sm font-semibold text-white mb-1">{note.title}</h4>
                <p className="text-xs text-slate-400">{note.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SSO Tab */}
      {activeTab === 'sso' && (
        <div className="space-y-6">
          {/* SSO Flow */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <span>🔑</span> Single Sign-On (SSO) Flow
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Saat anggota login di sistem koperasi, token sementara dihasilkan untuk auto-login ke AGRID Marketplace tanpa input ulang password.
            </p>

            {/* SSO Steps Visualization */}
            <div className="space-y-3">
              {[
                { step: 1, label: 'Anggota Login', desc: 'Login ke Sistem Koperasi dengan ID & Password', icon: '👤', color: 'emerald' },
                { step: 2, label: 'Generate SSO Token', desc: 'Sistem membuat JWT token dengan expiry 5 menit', icon: '🎫', color: 'purple' },
                { step: 3, label: 'Redirect ke AGRID', desc: 'Token dikirim via URL parameter ke AGRID', icon: '🔀', color: 'blue' },
                { step: 4, label: 'AGRID Verifikasi', desc: 'AGRID validasi token dengan shared secret', icon: '✅', color: 'amber' },
                { step: 5, label: 'Auto-Login Sukses', desc: 'Anggota langsung masuk tanpa input password', icon: '🎉', color: 'teal' },
              ].map(item => (
                <div
                  key={item.step}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                    ssoStep >= item.step
                      ? `bg-${item.color}-500/10 border-${item.color}-500/30`
                      : 'bg-white/5 border-white/10 opacity-50'
                  }`}
                  style={{
                    backgroundColor: ssoStep >= item.step ? `rgba(${getColorRgb(item.color)}, 0.1)` : undefined,
                    borderColor: ssoStep >= item.step ? `rgba(${getColorRgb(item.color)}, 0.3)` : undefined,
                  }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                    ssoStep >= item.step ? 'scale-110' : ''
                  }`} style={{
                    backgroundColor: ssoStep >= item.step ? `rgba(${getColorRgb(item.color)}, 0.2)` : 'rgba(255,255,255,0.05)',
                  }}>
                    {ssoStep >= item.step ? item.icon : <span className="text-xs text-slate-600">{item.step}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Step {item.step}</span>
                      <h4 className={`text-sm font-semibold ${ssoStep >= item.step ? 'text-white' : 'text-slate-500'}`}>
                        {item.label}
                      </h4>
                      {ssoStep >= item.step && <span className="text-emerald-400 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo Button */}
            <button
              onClick={runSsoDemo}
              disabled={isSsoRunning}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSsoRunning ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running SSO Flow...
                </>
              ) : (
                <>🚀 Demo SSO Flow</>
              )}
            </button>
          </div>

          {/* Token Structure */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">SSO Token Payload (JWT)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">JSON</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`{
  "sub": "user_agr001_uuid",
  "member_id": "AGR001",
  "cooperative_id": "coop_agr_sejahtera",
  "name": "Ahmad Suryadi",
  "phone": "081234567890",
  "role": "MEMBER",
  "paylater_limit": 10000000,
  "iat": 1704067200,
  "exp": 1704067500,  // 5 menit expiry
  "iss": "koperasi-digital",
  "aud": "agrid-marketplace",
  "jti": "unique_token_id_xxxx"
}`}</code>
            </pre>
          </div>

          {/* SSO Code */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">sso.service.ts</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-400">NestJS</span>
            </div>
            <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
              <code>{`@Injectable()
export class SsoService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateSsoToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      member_id: user.member_id,
      cooperative_id: user.cooperative_id,
      name: user.full_name,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      expiresIn: '5m',  // Token valid 5 menit
      issuer: 'koperasi-digital',
      audience: 'agrid-marketplace',
    });
  }

  async getSsoRedirectUrl(user: User): Promise<string> {
    const token = await this.generateSsoToken(user);
    const agridBaseUrl = this.configService.get('AGRID_URL');
    
    return \`\${agridBaseUrl}/sso/callback?sso_token=\${token}\`;
  }
}`}</code>
            </pre>
          </div>

          {/* Security */}
          <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span>🛡️</span> Keamanan SSO
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: 'Short Expiry', desc: 'Token hanya valid 5 menit', icon: '⏱️' },
                { label: 'One-Time Use', desc: 'Token tidak bisa digunakan ulang', icon: '🔒' },
                { label: 'IP Binding', desc: 'Token terikat IP address pengguna', icon: '🌐' },
                { label: 'Audit Log', desc: 'Setiap SSO login dicatat untuk audit', icon: '📋' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

interface WebhookEvent {
  id: string;
  type: string;
  member: string;
  amount: number;
  timestamp: string;
  status: 'received' | 'processed';
}

function getColorRgb(color: string): string {
  const colors: Record<string, string> = {
    'emerald': '16, 185, 129',
    'purple': '168, 85, 247',
    'blue': '59, 130, 246',
    'amber': '245, 158, 11',
    'teal': '20, 184, 166',
  };
  return colors[color] || '255, 255, 255';
}
