import { useState } from 'react';
import { RefreshCw, Database, Clock, CheckCircle2, XCircle, AlertCircle, Copy, Check } from 'lucide-react';

const syncCode = `/**
 * AGR-ID Sync Job - Sinkronisasi Data Koperasi ke AGR-ID
 */

const axios = require('axios');
const db = require('../config/database');

const AGRID_BASE_URL = process.env.AGRID_BASE_URL || 'https://agr.id';
const AGRID_SYNC_ENDPOINT = \`\${AGRID_BASE_URL}/api/v1/cooperatives/sync\`;
const AGRID_API_TOKEN = process.env.AGRID_API_TOKEN;

/**
 * Fetch all active cooperatives with their members
 */
async function fetchCooperativesWithMembers() {
  const query = \`
    SELECT 
      c.id,
      c.coop_code as code,
      c.name,
      c.is_active as active,
      json_agg(
        json_build_object(
          'id', u.id::text,
          'number', u.member_id,
          'name', u.full_name,
          'email', u.email,
          'active', m.status = 'ACTIVE'
        ) ORDER BY u.member_id
      ) FILTER (WHERE u.id IS NOT NULL) as members
    FROM cooperatives c
    LEFT JOIN memberships m ON c.id = m.cooperative_id
    LEFT JOIN users u ON m.user_id = u.id
    WHERE c.is_active = true
    GROUP BY c.id, c.coop_code, c.name, c.is_active
  \`;

  const result = await db.query(query);
  
  return result.rows.map(row => ({
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    members: row.members || [],
  }));
}

/**
 * Build sync payload
 */
function buildSyncPayload(cooperatives, snapshot = true) {
  return {
    snapshot,
    cooperatives: cooperatives.map(coop => ({
      id: coop.id,
      code: coop.code,
      name: coop.name,
      active: coop.active,
      members: coop.members.map(member => ({
        id: member.id,
        number: member.number,
        name: member.name,
        email: member.email,
        active: member.active,
      })),
    })),
  };
}

/**
 * Send sync request with retry mechanism
 */
async function sendSyncRequest(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(AGRID_SYNC_ENDPOINT, payload, {
        headers: {
          'Authorization': \`Bearer \${AGRID_API_TOKEN}\`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw new Error(\`AGR-ID sync failed: \${error.response.status}\`);
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('AGR-ID sync failed after retries');
}

/**
 * Main sync function - Full snapshot sync
 */
async function syncAllCooperatives() {
  const cooperatives = await fetchCooperativesWithMembers();
  const payload = buildSyncPayload(cooperatives, true);
  const response = await sendSyncRequest(payload);
  
  await logSyncResult(payload, response, 'SUCCESS');
  
  return {
    success: true,
    cooperatives_synced: response.cooperatives_synced,
    members_synced: response.members_synced,
  };
}

module.exports = { syncAllCooperatives };`;

const schedulerCode = `/**
 * AGR-ID Sync Scheduler
 * Cron job untuk sinkronisasi berkala
 */

const cron = require('node-cron');
const { syncAllCooperatives } = require('../services/agridSync');

const SYNC_SCHEDULE = process.env.AGRID_SYNC_SCHEDULE || '0 2 * * *';

function initScheduler() {
  // Full snapshot sync - Daily at 02:00 AM
  cron.schedule(SYNC_SCHEDULE, async () => {
    console.log('[Scheduler] Starting scheduled full sync...');
    
    try {
      const result = await syncAllCooperatives();
      console.log('[Scheduler] Sync completed successfully');
    } catch (error) {
      console.error('[Scheduler] Sync failed:', error.message);
      // TODO: Send alert notification
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Jakarta',
  });
}

module.exports = { initScheduler };`;

function highlightJS(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  highlighted = highlighted.replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/('[^']*')/g, '<span class="text-emerald-400">$1</span>');

  const keywords = ['const', 'let', 'var', 'function', 'async', 'await', 'return', 'if', 'else', 'try', 'catch', 'throw', 'new', 'require', 'module', 'exports'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function AgridSyncJob() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<null | { success: boolean; message: string }>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    // Simulate API call
    setTimeout(() => {
      setIsSyncing(false);
      setSyncResult({
        success: true,
        message: 'Sync completed successfully. 3 cooperatives and 150 members synced to AGR-ID.',
      });
    }, 3000);
  };

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">AGR-ID Sync Job</h2>
          <p className="text-sm text-slate-400 mt-1">
            Sinkronisasi Data Koperasi ke AGR-ID Marketplace
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-6 mb-8">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-purple-400" />
          Overview
        </h3>
        <p className="text-sm text-slate-300 mb-4">
          Job sinkronisasi ini membaca data koperasi dan anggota dari database lokal KOPERASI, 
          membentuk payload sesuai spesifikasi AGR-ID, lalu mengirimkannya ke endpoint 
          <code className="px-2 py-0.5 rounded bg-white/5 text-purple-400 mx-1">POST /api/v1/cooperatives/sync</code>
          di AGR-ID.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Database, label: 'Snapshot Mode', desc: 'Full sync semua koperasi & anggota' },
            { icon: Clock, label: 'Scheduled', desc: 'Daily at 02:00 AM (configurable)' },
            { icon: RefreshCw, label: 'Retry Logic', desc: 'Exponential backoff (3 retries)' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">{item.label}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-400" />
          Sync Flow
        </h3>
        <div className="space-y-3">
          {[
            { step: 1, label: 'Fetch Cooperatives', desc: 'Query semua koperasi aktif dengan anggota', icon: '📊' },
            { step: 2, label: 'Build Payload', desc: 'Format data sesuai spesifikasi AGR-ID', icon: '📦' },
            { step: 3, label: 'Send to AGR-ID', desc: 'POST /api/v1/cooperatives/sync dengan Bearer token', icon: '📤' },
            { step: 4, label: 'Handle Response', desc: 'Parse response & log result', icon: '✅' },
            { step: 5, label: 'Log to Database', desc: 'Insert ke agrid_sync_logs untuk audit trail', icon: '💾' },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400 flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <h4 className="text-sm font-semibold text-white">{item.label}</h4>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Sync Trigger */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-400" />
          Manual Sync Trigger
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Trigger sinkronisasi manual untuk semua koperasi (snapshot mode)
        </p>
        
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              <span>Trigger Full Sync</span>
            </>
          )}
        </button>

        {syncResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            syncResult.success 
              ? 'bg-emerald-500/5 border-emerald-500/20' 
              : 'bg-rose-500/5 border-rose-500/20'
          }`}>
            <div className="flex items-start gap-2">
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-semibold ${syncResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {syncResult.success ? 'Success' : 'Failed'}
                </div>
                <div className="text-xs text-slate-400 mt-1">{syncResult.message}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Code Display */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">agridSync.js</span>
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
              className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              {showCode ? '▼ Collapse' : '▶ Show Code'}
            </button>
          </div>
        </div>

        {showCode ? (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="p-4 text-xs font-mono leading-relaxed">
              <code>
                {syncCode.split('\n').map((line, i) => (
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
            <Database className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-4">
              Full implementation code for AGR-ID sync job
            </p>
            <button
              onClick={() => setShowCode(true)}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            >
              Lihat Full Code
            </button>
          </div>
        )}
      </div>

      {/* Scheduler Code */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">agridSyncScheduler.js</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Cron Job</span>
        </div>
        <div className="overflow-x-auto">
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <code>
              {schedulerCode.split('\n').map((line, i) => (
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
      </div>

      {/* Configuration */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Environment Variables
        </h3>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/30 border border-white/5">
            <code className="text-slate-300">
              <span className="text-purple-400">AGRID_BASE_URL</span>=https://agr.id
            </code>
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/5">
            <code className="text-slate-300">
              <span className="text-purple-400">AGRID_API_TOKEN</span>=&lt;your-api-token&gt;
            </code>
          </div>
          <div className="p-3 rounded-lg bg-black/30 border border-white/5">
            <code className="text-slate-300">
              <span className="text-purple-400">AGRID_SYNC_SCHEDULE</span>=0 2 * * *
            </code>
            <span className="text-slate-500 ml-2"># Daily at 02:00 AM</span>
          </div>
        </div>
      </div>
    </section>
  );
}
