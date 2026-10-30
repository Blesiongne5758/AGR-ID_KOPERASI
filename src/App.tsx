import { useState } from 'react';
import { 
  Database, 
  Server, 
  Shield, 
  Zap, 
  GitBranch, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code2,
  BookOpen,
  Rocket,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'setup' | 'api'>('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">
              AGR.BIZ.ID - KOPERASI DIGITAL
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Integrasi Database Koperasi ke AGR-ID Marketplace
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href="https://agr.biz.id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:scale-105 flex items-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Kunjungi AGR-ID
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/blesiongne5758/agr-id"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <GitBranch className="w-5 h-5" />
                View Repository
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Database, label: 'Database', value: 'Supabase', color: 'from-blue-500 to-cyan-500' },
            { icon: Server, label: 'Frontend', value: 'InfinityFree', color: 'from-purple-500 to-pink-500' },
            { icon: Shield, label: 'Auth', value: 'Bearer Token', color: 'from-emerald-500 to-teal-500' },
            { icon: Zap, label: 'Sync', value: 'Real-time', color: 'from-amber-500 to-orange-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm text-slate-400 mb-1">{item.label}</div>
                <div className="text-xl font-bold text-white">{item.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'architecture', label: 'Architecture', icon: GitBranch },
            { id: 'setup', label: 'Quick Setup', icon: Rocket },
            { id: 'api', label: 'API Docs', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'architecture' && <ArchitectureTab />}
          {activeTab === 'setup' && <SetupTab />}
          {activeTab === 'api' && <ApiTab />}
        </div>

        {/* Features Grid */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Fitur Utama</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Snapshot Sync',
                desc: 'Full sync semua koperasi & anggota dengan satu API call',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Shield,
                title: 'Retry Mechanism',
                desc: 'Exponential backoff untuk handle transient failures',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
              {
                icon: Database,
                title: 'Audit Trail',
                desc: 'Log semua sync operations untuk monitoring & debugging',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Server,
                title: 'Auto Scheduler',
                desc: 'Cron job untuk sinkronisasi otomatis setiap hari',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                icon: Code2,
                title: 'REST API',
                desc: 'Endpoint untuk trigger manual sync & monitoring',
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
              },
              {
                icon: CheckCircle2,
                title: 'Health Check',
                desc: 'Endpoint monitoring untuk memastikan server berjalan',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Warning */}
        <div className="mt-16 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Peringatan Keamanan</h3>
              <p className="text-slate-300 mb-4">
                Jika Anda telah membagikan GitHub Personal Access Token (PAT) di chat atau tempat publik, 
                <strong className="text-red-400"> segera revoke token tersebut</strong> dan generate token baru.
              </p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Simpan token di environment variables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Jangan commit token ke Git</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Rotate token setiap 90 hari</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="https://agr.biz.id" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
              Website
            </a>
            <span>•</span>
            <a href="https://github.com/blesiongne5758/agr-id" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-400 transition-colors">
              Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">📋 Gambaran Umum</h2>
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Apa itu AGR-ID?</h3>
          <p className="text-slate-300 leading-relaxed">
            AGR-ID adalah marketplace koperasi terintegrasi yang memungkinkan anggota koperasi untuk berbelanja 
            menggunakan sistem Paylater. Platform ini dibangun dengan frontend yang di-hosting di InfinityFree 
            dan menggunakan Supabase sebagai database backend.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">🎯 Tujuan Integrasi</h3>
          <ul className="space-y-3">
            {[
              'Sinkronisasi data koperasi dan anggota secara otomatis',
              'Verifikasi anggota koperasi di platform AGR-ID',
              'Memungkinkan anggota menggunakan Paylater untuk belanja',
              'Data selalu up-to-date antara sistem koperasi dan AGR-ID',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-emerald-400 mb-3">Informasi Teknis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Repository:</span>
                <a href="https://github.com/blesiongne5758/agr-id" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  blesiongne5758/agr-id
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">URL Base:</span>
                <a href="https://agr.biz.id" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  https://agr.biz.id
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="text-white">Supabase</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hosting:</span>
                <span className="text-white">InfinityFree</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-blue-400 mb-3">Tech Stack</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Backend:</span>
                <span className="text-white">Node.js + Express</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Database Lokal:</span>
                <span className="text-white">PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduler:</span>
                <span className="text-white">node-cron</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HTTP Client:</span>
                <span className="text-white">Axios</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchitectureTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🏗️ Arsitektur Sistem</h2>
      
      {/* Architecture Diagram */}
      <div className="bg-black/30 rounded-xl p-8 mb-8">
        <div className="space-y-6">
          {/* Layer 1: Database Koperasi */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Database Koperasi (PostgreSQL)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['cooperatives', 'members', 'agrid_sync_logs'].map((table) => (
                <div key={table} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <code className="text-sm text-emerald-400">{table}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-emerald-500 to-blue-500" />
              <ArrowRight className="w-6 h-6 text-blue-400 rotate-90" />
            </div>
          </div>

          {/* Layer 2: Integration Server */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Integration Server (Node.js)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Service Layer', 'Scheduler', 'API Routes'].map((item) => (
                <div key={item} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <span className="text-sm text-blue-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500" />
              <ArrowRight className="w-6 h-6 text-purple-400 rotate-90" />
              <span className="text-xs text-slate-400 mt-2">POST /api/v1/cooperatives/sync</span>
            </div>
          </div>

          {/* Layer 3: AGR-ID API */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AGR-ID API (https://agr.biz.id)</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['Frontend', 'API Gateway', 'Supabase DB'].map((item) => (
                <div key={item} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                  <span className="text-sm text-purple-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Flow */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🔄 Data Flow</h3>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Fetch Data', desc: 'Query koperasi + anggota dari database lokal' },
            { step: 2, label: 'Build Payload', desc: 'Format data sesuai spesifikasi AGR-ID' },
            { step: 3, label: 'Send to AGR-ID', desc: 'POST ke endpoint dengan Bearer token' },
            { step: 4, label: 'Process Response', desc: 'Parse response & log ke database' },
            { step: 5, label: 'Verify Members', desc: 'Anggota dapat diverifikasi di AGR-ID' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">🚀 Quick Setup (5 Menit)</h2>
      
      <div className="space-y-6">
        {[
          {
            step: 1,
            title: 'Install Dependencies',
            code: 'npm install',
          },
          {
            step: 2,
            title: 'Setup Database',
            code: 'createdb koperasi_db\nnpm run db:init',
          },
          {
            step: 3,
            title: 'Configure Environment',
            code: 'cp .env.example .env\nnano .env',
          },
          {
            step: 4,
            title: 'Run Server',
            code: 'npm start',
          },
          {
            step: 5,
            title: 'Test Integration',
            code: 'curl -X POST http://localhost:3000/api/v1/sync/agrid',
          },
        ].map((item) => (
          <div key={item.step} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            </div>
            <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm text-slate-300 font-mono">
                <code>{item.code}</code>
              </pre>
            </div>
          </div>
        ))}

        {/* Environment Variables */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚙️ Environment Variables</h3>
          <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300 font-mono">
              <code>{`# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/koperasi_db

# AGR-ID Configuration
AGRID_BASE_URL=https://agr.biz.id
AGRID_API_TOKEN=your_token_here

# Scheduler
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server
PORT=3000`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">📡 API Documentation</h2>
      
      <div className="space-y-6">
        {/* Endpoint 1 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg">
              POST
            </span>
            <code className="text-lg text-white font-mono">/api/v1/sync/agrid</code>
          </div>
          <p className="text-slate-300 mb-4">Trigger manual sync untuk semua koperasi</p>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Request</h4>
              <div className="bg-black/30 rounded-lg p-4">
                <pre className="text-sm text-slate-300 font-mono">
                  <code>{`curl -X POST http://localhost:3000/api/v1/sync/agrid`}</code>
                </pre>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Response (Success)</h4>
              <div className="bg-black/30 rounded-lg p-4">
                <pre className="text-sm text-slate-300 font-mono">
                  <code>{`{
  "success": true,
  "message": "AGR-ID sync completed successfully",
  "data": {
    "cooperatives_synced": 2,
    "members_synced": 10,
    "snapshot": true
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoint 2 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
              GET
            </span>
            <code className="text-lg text-white font-mono">/api/v1/sync/history</code>
          </div>
          <p className="text-slate-300 mb-4">Get sync history dari database</p>
          
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Request</h4>
              <div className="bg-black/30 rounded-lg p-4">
                <pre className="text-sm text-slate-300 font-mono">
                  <code>{`curl http://localhost:3000/api/v1/sync/history?limit=10`}</code>
                </pre>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Response</h4>
              <div className="bg-black/30 rounded-lg p-4">
                <pre className="text-sm text-slate-300 font-mono">
                  <code>{`{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sync_type": "SNAPSHOT",
      "cooperatives_count": 2,
      "members_count": 10,
      "status": "SUCCESS",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Endpoint 3 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">
              GET
            </span>
            <code className="text-lg text-white font-mono">/health</code>
          </div>
          <p className="text-slate-300 mb-4">Health check endpoint</p>
          
          <div className="bg-black/30 rounded-lg p-4">
            <pre className="text-sm text-slate-300 font-mono">
              <code>{`{
  "status": "ok",
  "timestamp": "2026-01-15T10:30:00Z",
  "service": "AGR-ID Integration Server"
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
