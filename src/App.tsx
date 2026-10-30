import { useState } from 'react';
import { Database, Key, Webhook, Shield, Copy, Check, Link2, Hash, Code2 } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  constraints: string[];
  description: string;
}

interface TableSchema {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  columns: Column[];
}

const tables: TableSchema[] = [
  {
    id: 'agrid_integrations',
    name: 'agrid_integrations',
    description: 'Menyimpan kredensial API untuk setiap koperasi yang mengaktifkan integrasi AGRID',
    icon: '🔐',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
        description: 'Primary key unik untuk setiap record integrasi',
      },
      {
        name: 'cooperative_id',
        type: 'UUID',
        constraints: ['UNIQUE', 'NOT NULL', 'REFERENCES cooperatives(id)', 'ON DELETE CASCADE'],
        description: 'ID koperasi (1 koperasi = 1 integrasi)',
      },
      {
        name: 'agrid_client_id',
        type: 'VARCHAR(100)',
        constraints: ['NOT NULL'],
        description: 'Client ID dari AGRID untuk autentikasi API',
      },
      {
        name: 'agrid_client_secret',
        type: 'VARCHAR(255)',
        constraints: ['NOT NULL'],
        description: 'Client secret dari AGRID (enkripsi di level aplikasi)',
      },
      {
        name: 'webhook_secret',
        type: 'VARCHAR(255)',
        constraints: ['NOT NULL'],
        description: 'Secret key untuk verifikasi HMAC signature webhook',
      },
      {
        name: 'is_active',
        type: 'BOOLEAN',
        constraints: ['DEFAULT TRUE'],
        description: 'Status aktif/nonaktif integrasi',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMP',
        constraints: ['DEFAULT CURRENT_TIMESTAMP'],
        description: 'Timestamp kapan integrasi dibuat',
      },
    ],
  },
  {
    id: 'agrid_webhook_logs',
    name: 'agrid_webhook_logs',
    description: 'Log webhook dari AGRID untuk debugging dan audit trail',
    icon: '📡',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    columns: [
      {
        name: 'id',
        type: 'UUID',
        constraints: ['PRIMARY KEY', 'DEFAULT gen_random_uuid()'],
        description: 'Primary key unik untuk setiap log webhook',
      },
      {
        name: 'agrid_event_id',
        type: 'VARCHAR(100)',
        constraints: ['UNIQUE', 'NOT NULL'],
        description: 'Idempotency key dari AGRID (mencegah duplicate processing)',
      },
      {
        name: 'cooperative_id',
        type: 'UUID',
        constraints: ['NOT NULL'],
        description: 'ID koperasi yang menerima webhook',
      },
      {
        name: 'event_type',
        type: 'VARCHAR(50)',
        constraints: ['NOT NULL'],
        description: "Jenis event: 'ORDER.PAID', 'ORDER.CANCELLED', dll",
      },
      {
        name: 'payload',
        type: 'JSONB',
        constraints: ['NOT NULL'],
        description: 'Payload lengkap webhook dalam format JSON',
      },
      {
        name: 'signature',
        type: 'VARCHAR(255)',
        constraints: ['NOT NULL'],
        description: 'HMAC signature dari AGRID untuk verifikasi',
      },
      {
        name: 'processed_at',
        type: 'TIMESTAMP',
        constraints: [],
        description: 'Timestamp kapan webhook berhasil diproses',
      },
      {
        name: 'status',
        type: 'VARCHAR(20)',
        constraints: ["DEFAULT 'PENDING'"],
        description: "Status: 'PENDING', 'SUCCESS', 'FAILED'",
      },
      {
        name: 'created_at',
        type: 'TIMESTAMP',
        constraints: ['DEFAULT CURRENT_TIMESTAMP'],
        description: 'Timestamp kapan webhook diterima',
      },
    ],
  },
];

const sqlScript = `-- Tabel 1: agrid_integrations
-- Menyimpan kredensial API untuk setiap koperasi yang mengaktifkan integrasi AGRID
CREATE TABLE agrid_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cooperative_id UUID UNIQUE NOT NULL REFERENCES cooperatives(id) ON DELETE CASCADE,
    agrid_client_id VARCHAR(100) NOT NULL,
    agrid_client_secret VARCHAR(255) NOT NULL, -- Enkripsi di level aplikasi
    webhook_secret VARCHAR(255) NOT NULL,      -- Untuk verifikasi HMAC
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 2: agrid_webhook_logs
-- Log Webhook (Sangat penting untuk debugging dan audit)
CREATE TABLE agrid_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agrid_event_id VARCHAR(100) UNIQUE NOT NULL, -- Idempotency Key dari AGRID
    cooperative_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,             -- e.g., 'ORDER.PAID', 'ORDER.CANCELLED'
    payload JSONB NOT NULL,
    signature VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',        -- 'PENDING', 'SUCCESS', 'FAILED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performa
CREATE INDEX idx_agrid_integrations_cooperative ON agrid_integrations(cooperative_id);
CREATE INDEX idx_agrid_integrations_active ON agrid_integrations(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_agrid_webhook_logs_event_id ON agrid_webhook_logs(agrid_event_id);
CREATE INDEX idx_agrid_webhook_logs_cooperative ON agrid_webhook_logs(cooperative_id);
CREATE INDEX idx_agrid_webhook_logs_event_type ON agrid_webhook_logs(event_type);
CREATE INDEX idx_agrid_webhook_logs_status ON agrid_webhook_logs(status);
CREATE INDEX idx_agrid_webhook_logs_created ON agrid_webhook_logs(created_at DESC);
CREATE INDEX idx_agrid_webhook_logs_payload ON agrid_webhook_logs USING GIN (payload);`;

function getConstraintStyle(constraint: string): string {
  if (constraint.includes('PRIMARY KEY')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (constraint.includes('UNIQUE')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  if (constraint.includes('NOT NULL')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (constraint.includes('REFERENCES')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (constraint.includes('DEFAULT')) return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return 'bg-white/5 text-slate-400 border-white/10';
}

function highlightSQL(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted.replace(/(--.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  const keywords = ['CREATE', 'TABLE', 'UUID', 'PRIMARY', 'KEY', 'DEFAULT', 'NOT', 'NULL', 'UNIQUE', 'REFERENCES', 'ON', 'DELETE', 'CASCADE', 'BOOLEAN', 'VARCHAR', 'TIMESTAMP', 'JSONB', 'TRUE', 'FALSE', 'INDEX', 'WHERE', 'USING', 'GIN'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  highlighted = highlighted.replace(/\b(gen_random_uuid|CURRENT_TIMESTAMP)\b/g, '<span class="text-cyan-400">$1</span>');
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <Database className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            AGRID Integration Schema
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Database tables untuk integrasi AGRID Marketplace
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Tabel', value: tables.length.toString(), icon: Database },
            { label: 'Total Kolom', value: totalColumns.toString(), icon: Hash },
            { label: 'Indexes', value: '8', icon: Link2 },
            { label: 'JSONB', value: '✓', icon: Code2 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <Icon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Key, title: 'API Credentials', desc: 'Client ID & Secret per koperasi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Shield, title: 'HMAC Verification', desc: 'Webhook secret untuk signature', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: Webhook, title: 'Idempotency Key', desc: 'Mencegah duplicate processing', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Database, title: 'JSONB Payload', desc: 'Flexible storage dengan GIN index', color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

        {/* Tables Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            2 Tabel Utama
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
                className={`
                  text-left relative overflow-hidden rounded-2xl border transition-all duration-300
                  ${
                    activeTable === table.id
                      ? 'border-white/20 bg-white/10 shadow-2xl scale-[1.02]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }
                `}
              >
                <div className={`h-1 bg-gradient-to-r ${table.gradient}`} />

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{table.icon}</span>
                    <div>
                      <code className={`text-sm font-bold ${table.color}`}>{table.name}</code>
                      <p className="text-xs text-slate-500 mt-0.5">{table.columns.length} kolom</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{table.description}</p>

                  <div className="space-y-1">
                    {table.columns.slice(0, 4).map((col) => (
                      <div key={col.name} className="flex items-center gap-2 text-xs">
                        {col.constraints.includes('PRIMARY KEY') && (
                          <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        )}
                        {col.constraints.some(c => c.includes('REFERENCES')) && !col.constraints.includes('PRIMARY KEY') && (
                          <Link2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        )}
                        {!col.constraints.includes('PRIMARY KEY') && !col.constraints.some(c => c.includes('REFERENCES')) && (
                          <span className="w-3 h-3 flex-shrink-0" />
                        )}
                        <code className="text-slate-300">{col.name}</code>
                        <span className="text-slate-600 ml-auto">{col.type}</span>
                      </div>
                    ))}
                    {table.columns.length > 4 && (
                      <div className="text-xs text-slate-600 pl-5">+{table.columns.length - 4} kolom lainnya...</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Table View */}
        {activeTable && (
          <div className="mb-12">
            {(() => {
              const table = tables.find(t => t.id === activeTable);
              if (!table) return null;

              return (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${table.gradient}`} />

                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">{table.icon}</span>
                      <div>
                        <code className={`text-xl font-bold ${table.color}`}>{table.name}</code>
                        <p className="text-sm text-slate-400 mt-1">{table.description}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Kolom</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Tipe Data</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase">Constraints</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((col) => (
                            <tr key={col.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  {col.constraints.includes('PRIMARY KEY') && (
                                    <Key className="w-4 h-4 text-amber-400" />
                                  )}
                                  {col.constraints.some(c => c.includes('REFERENCES')) && !col.constraints.includes('PRIMARY KEY') && (
                                    <Link2 className="w-4 h-4 text-blue-400" />
                                  )}
                                  {col.constraints.includes('UNIQUE') && !col.constraints.includes('PRIMARY KEY') && (
                                    <span className="text-emerald-400">⚡</span>
                                  )}
                                  <code className={`font-medium ${table.color}`}>{col.name}</code>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <code className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                  {col.type}
                                </code>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex flex-wrap gap-1">
                                  {col.constraints.map((c, i) => (
                                    <span
                                      key={i}
                                      className={`text-[10px] px-1.5 py-0.5 rounded border ${getConstraintStyle(c)}`}
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 text-xs hidden sm:table-cell">
                                {col.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* SQL Script */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-400" />
            SQL Migration Script
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">agrid_integration.sql</span>
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
                  onClick={() => setShowSQL(!showSQL)}
                  className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  {showSQL ? '▼ Collapse' : '▶ Show SQL'}
                </button>
              </div>
            </div>

            {showSQL ? (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono leading-relaxed">
                  <code>
                    {sqlScript.split('\n').map((line, i) => (
                      <div key={i} className="flex hover:bg-white/5 transition-colors">
                        <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">{i + 1}</span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: highlightSQL(line) }}
                        />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Database className="w-12 h-12 text-emerald-400/50 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-4">
                  Full SQL script untuk membuat tabel agrid_integrations dan agrid_webhook_logs
                </p>
                <button
                  onClick={() => setShowSQL(true)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                >
                  Lihat SQL Script
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-amber-400" />
            Contoh Penggunaan
          </h2>

          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">1. Setup Integrasi untuk Koperasi</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                <code>{`INSERT INTO agrid_integrations (
  cooperative_id, 
  agrid_client_id, 
  agrid_client_secret, 
  webhook_secret
) VALUES (
  'uuid-koperasi-here',
  'agrid_client_xxxxx',
  'encrypted_secret_xxxxx',  -- Enkripsi di aplikasi
  'webhook_secret_xxxxx'
);`}</code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">2. Log Webhook yang Diterima</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                <code>{`INSERT INTO agrid_webhook_logs (
  agrid_event_id,
  cooperative_id,
  event_type,
  payload,
  signature,
  status
) VALUES (
  'evt_agr_123456',
  'uuid-koperasi-here',
  'ORDER.PAID',
  '{"order_id": "ord_001", "amount": 750000}',
  'hmac_signature_here',
  'PENDING'
);`}</code>
              </pre>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-2">3. Query Webhook Logs untuk Audit</h4>
              <pre className="text-xs text-slate-300 overflow-x-auto font-mono">
                <code>{`SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total DESC;`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Security Notes */}
        <div className="bg-gradient-to-r from-emerald-500/5 to-blue-500/5 border border-emerald-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Security Best Practices
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Encrypt Secrets', desc: 'Enkripsi client_secret & webhook_secret di level aplikasi' },
              { label: 'Rotate Keys', desc: 'Rotate credentials secara berkala (90 hari)' },
              { label: 'Verify Signature', desc: 'Selalu verifikasi HMAC signature sebelum proses webhook' },
              { label: 'Idempotency', desc: 'Gunakan agrid_event_id untuk mencegah duplicate processing' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
