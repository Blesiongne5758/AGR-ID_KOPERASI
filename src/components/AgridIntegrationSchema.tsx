import { useState } from 'react';
import { Database, Key, Webhook, Shield, Copy, Check, AlertCircle } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  constraints: string[];
  description: string;
}

interface TableSchema {
  name: string;
  description: string;
  icon: string;
  color: string;
  columns: Column[];
}

const tables: TableSchema[] = [
  {
    name: 'agrid_integrations',
    description: 'Menyimpan kredensial API untuk setiap koperasi yang mengaktifkan integrasi AGRID',
    icon: '🔐',
    color: 'emerald',
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
    name: 'agrid_webhook_logs',
    description: 'Log webhook dari AGRID untuk debugging dan audit trail',
    icon: '📡',
    color: 'blue',
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

  // Comments
  highlighted = highlighted.replace(/(--.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  // Strings
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['CREATE', 'TABLE', 'UUID', 'PRIMARY', 'KEY', 'DEFAULT', 'NOT', 'NULL', 'UNIQUE', 'REFERENCES', 'ON', 'DELETE', 'CASCADE', 'BOOLEAN', 'VARCHAR', 'TIMESTAMP', 'JSONB', 'TRUE', 'FALSE', 'INDEX', 'WHERE', 'USING', 'GIN'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Functions
  highlighted = highlighted.replace(/\b(gen_random_uuid|CURRENT_TIMESTAMP)\b/g, '<span class="text-cyan-400">$1</span>');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function AgridIntegrationSchema() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">AGRID Integration Schema</h2>
          <p className="text-sm text-slate-400 mt-1">
            Database tables untuk integrasi AGRID Marketplace
          </p>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Key, title: 'API Credentials', desc: 'Client ID & Secret per koperasi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { icon: Shield, title: 'HMAC Verification', desc: 'Webhook secret untuk signature', color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Webhook, title: 'Idempotency Key', desc: 'Mencegah duplicate processing', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { icon: Database, title: 'JSONB Payload', desc: 'Flexible storage dengan GIN index', color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

      {/* Tables Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {tables.map((table) => (
          <div
            key={table.name}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
              activeTable === table.name
                ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setActiveTable(activeTable === table.name ? null : table.name)}
          >
            {/* Header */}
            <div className={`p-4 border-b border-white/10 ${
              table.color === 'emerald' ? 'bg-emerald-500/5' : 'bg-blue-500/5'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{table.icon}</span>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${
                    table.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {table.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{table.description}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {table.columns.length} kolom
                </div>
              </div>
            </div>

            {/* Columns Preview */}
            <div className="p-4 space-y-2">
              {table.columns.slice(0, 5).map((col) => (
                <div key={col.name} className="flex items-start gap-2 text-xs">
                  <span className="text-slate-500 font-mono w-32 flex-shrink-0">
                    {col.name}
                  </span>
                  <span className="text-slate-400 font-mono flex-shrink-0">
                    {col.type}
                  </span>
                  <div className="flex flex-wrap gap-1 ml-auto">
                    {col.constraints.slice(0, 2).map((c, i) => (
                      <span
                        key={i}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${getConstraintStyle(c)}`}
                      >
                        {c.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {table.columns.length > 5 && (
                <div className="text-xs text-slate-600 pt-2 border-t border-white/5">
                  +{table.columns.length - 5} kolom lainnya...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Table View */}
      {activeTable && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
          {(() => {
            const table = tables.find(t => t.name === activeTable);
            if (!table) return null;

            return (
              <>
                <div className={`p-4 border-b border-white/10 ${
                  table.color === 'emerald' ? 'bg-emerald-500/5' : 'bg-blue-500/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{table.icon}</span>
                    <div>
                      <h3 className={`text-xl font-bold ${
                        table.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {table.name}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">{table.description}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5">
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Kolom</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Tipe Data</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Constraints</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase">Deskripsi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.columns.map((col) => (
                        <tr key={col.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {col.constraints.includes('PRIMARY KEY') && (
                                <span className="text-amber-400" title="Primary Key">🔑</span>
                              )}
                              {col.constraints.includes('UNIQUE') && !col.constraints.includes('PRIMARY KEY') && (
                                <span className="text-purple-400" title="Unique">⚡</span>
                              )}
                              {col.constraints.some(c => c.includes('REFERENCES')) && (
                                <span className="text-blue-400" title="Foreign Key">🔗</span>
                              )}
                              <code className={`font-medium ${
                                table.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                              }`}>
                                {col.name}
                              </code>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <code className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                              {col.type}
                            </code>
                          </td>
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* SQL Script */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
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
          <div className="overflow-x-auto">
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
              SQL script untuk membuat tabel agrid_integrations dan agrid_webhook_logs
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

      {/* Usage Example */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Contoh Penggunaan
        </h3>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
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
    </section>
  );
}
