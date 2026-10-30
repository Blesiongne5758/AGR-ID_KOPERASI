import { useState } from 'react';
import { tables, relationships, TableSchema } from '../data/database';

export default function DatabaseSchema() {
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'erd' | 'tables'>('erd');

  return (
    <section>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Skema Database</h2>
            <p className="text-sm text-slate-400">PostgreSQL — 5 Tabel, ACID Compliant, Row-Level Security</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={() => setViewMode('erd')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'erd'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 ERD
          </button>
          <button
            onClick={() => setViewMode('tables')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'tables'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📋 Tabel
          </button>
        </div>
      </div>

      {viewMode === 'erd' ? (
        <ERDView activeTable={activeTable} setActiveTable={setActiveTable} />
      ) : (
        <TablesView activeTable={activeTable} setActiveTable={setActiveTable} />
      )}
    </section>
  );
}

/* ───────── ERD View ───────── */
function ERDView({
  activeTable,
  setActiveTable,
}: {
  activeTable: string | null;
  setActiveTable: (id: string | null) => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
      {/* ERD Diagram */}
      <div className="relative">
        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-6">
            {/* Row 1 */}
            <ERDNode
              table={tables[0]} // cooperatives
              isActive={activeTable === 'cooperatives'}
              onClick={() => setActiveTable(activeTable === 'cooperatives' ? null : 'cooperatives')}
            />
            <div className="flex items-center justify-center">
              <ERDRelation from="users" to="cooperatives" label="melalui memberships" />
            </div>
            <ERDNode
              table={tables[1]} // users
              isActive={activeTable === 'users'}
              onClick={() => setActiveTable(activeTable === 'users' ? null : 'users')}
            />

            {/* Row 2 */}
            <ERDNode
              table={tables[3]} // id_sequences
              isActive={activeTable === 'id_sequences'}
              onClick={() => setActiveTable(activeTable === 'id_sequences' ? null : 'id_sequences')}
            />
            <ERDNode
              table={tables[2]} // memberships
              isActive={activeTable === 'memberships'}
              onClick={() => setActiveTable(activeTable === 'memberships' ? null : 'memberships')}
              highlight
            />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="text-xs text-slate-500 text-center px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <div className="font-semibold text-slate-300 mb-1">Relasi Utama</div>
                <div>users ↔ cooperatives</div>
                <div className="text-slate-500">via memberships</div>
              </div>
            </div>

            {/* Row 3 */}
            <div />
            <ERDNode
              table={tables[4]} // savings
              isActive={activeTable === 'savings'}
              onClick={() => setActiveTable(activeTable === 'savings' ? null : 'savings')}
            />
            <div />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col items-center gap-4">
          {tables.map((table) => (
            <ERDNode
              key={table.id}
              table={table}
              isActive={activeTable === table.id}
              onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
            />
          ))}
        </div>
      </div>

      {/* Relationships Legend */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold text-slate-400 mb-4">🔗 Relasi Antar Tabel (Foreign Keys)</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {relationships.map((rel, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg">→</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono">
                  <span className="text-purple-400">{rel.from}</span>
                  <span className="text-slate-600"> . </span>
                  <span className="text-amber-400">{rel.label}</span>
                  <span className="text-slate-600"> → </span>
                  <span className="text-emerald-400">{rel.to}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono">{rel.type}</span>
                  {rel.onDelete && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-mono">ON DELETE {rel.onDelete}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Table Detail */}
      {activeTable && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <TableDetail table={tables.find((t) => t.id === activeTable)!} />
        </div>
      )}
    </div>
  );
}

/* ───────── ERD Node ───────── */
function ERDNode({
  table,
  isActive,
  onClick,
  highlight,
}: {
  table: TableSchema;
  isActive: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${isActive
          ? `${table.borderColor} shadow-lg scale-[1.02]`
          : 'border-white/10 hover:border-white/20 hover:scale-[1.01]'
        }
        ${highlight ? 'ring-1 ring-purple-500/20' : ''}
      `}
      style={isActive ? { boxShadow: `0 0 30px ${getGlowColor(table.id)}` } : {}}
    >
      {/* Header */}
      <div className={`px-4 py-3 rounded-t-[10px] bg-gradient-to-r ${table.colorFrom} ${table.colorTo} bg-opacity-10`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{table.icon}</span>
          <span className="font-mono font-bold text-white text-sm">{table.name}</span>
        </div>
        <div className="text-xs text-white/60 mt-0.5">{table.subtitle}</div>
      </div>

      {/* Columns preview */}
      <div className="p-3 bg-white/[0.02]">
        {table.columns.slice(0, 3).map((col) => (
          <div key={col.name} className="flex items-center justify-between py-1 text-xs">
            <div className="flex items-center gap-2">
              {col.constraint === 'PK' && <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">PK</span>}
              {col.constraint?.startsWith('FK') && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">FK</span>}
              {col.constraint === 'UNIQUE' && <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">UQ</span>}
              <span className="font-mono text-slate-300">{col.name}</span>
            </div>
            <span className="font-mono text-slate-500 text-[10px]">{col.type}</span>
          </div>
        ))}
        {table.columns.length > 3 && (
          <div className="text-[10px] text-slate-600 text-center mt-1">+{table.columns.length - 3} kolom lainnya</div>
        )}
      </div>
    </button>
  );
}

/* ───────── ERD Relation ───────── */
function ERDRelation({ from, to, label }: { from: string; to: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-emerald-400">{from}</span>
        <div className="flex items-center">
          <div className="w-6 h-0.5 bg-gradient-to-r from-emerald-500/50 to-blue-500/50" />
          <div className="w-2 h-2 rounded-full bg-white/20 border border-white/30" />
          <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
        </div>
        <span className="text-[10px] font-mono text-blue-400">{to}</span>
      </div>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

/* ───────── Tables View ───────── */
function TablesView({
  activeTable,
  setActiveTable,
}: {
  activeTable: string | null;
  setActiveTable: (id: string | null) => void;
}) {
  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <div
          key={table.id}
          className={`
            rounded-2xl border transition-all duration-300 overflow-hidden
            ${activeTable === table.id ? table.borderColor : 'border-white/10'}
          `}
          style={activeTable === table.id ? { boxShadow: `0 0 30px ${getGlowColor(table.id)}` } : {}}
        >
          {/* Table Header */}
          <button
            onClick={() => setActiveTable(activeTable === table.id ? null : table.id)}
            className={`w-full text-left p-5 transition-colors ${
              activeTable === table.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{table.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{table.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${table.bgGlow} ${table.color} border ${table.borderColor}`}>
                      {table.columns.length} kolom
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{table.subtitle}</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-slate-500 transition-transform ${activeTable === table.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Table Detail */}
          {activeTable === table.id && (
            <div className="px-5 pb-5">
              <TableDetail table={table} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────── Table Detail ───────── */
function TableDetail({ table }: { table: TableSchema }) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">{table.description}</p>

      {/* SQL Preview */}
      <div className="mb-4 p-4 rounded-lg bg-black/30 border border-white/5 overflow-x-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-red-500/60" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <span className="w-2 h-2 rounded-full bg-green-500/60" />
          <span className="text-[10px] text-slate-600 ml-2 font-mono">SQL</span>
        </div>
        <pre className="text-xs font-mono text-slate-300 leading-relaxed">
          <span className="text-purple-400">CREATE TABLE</span>{' '}
          <span className="text-amber-400">{table.name}</span>{' '}
          <span className="text-slate-500">{'('}</span>{'\n'}
          {table.columns.map((col, i) => (
            <span key={col.name}>
              {'  '}
              <span className="text-cyan-400">{col.name}</span>{' '}
              <span className="text-emerald-400">{col.type}</span>
              {col.constraint && <span className="text-rose-400"> {col.constraint}</span>}
              {i < table.columns.length - 1 ? <span className="text-slate-500">,</span> : ''}{'\n'}
            </span>
          ))}
          <span className="text-slate-500">{')'}</span>
          <span className="text-slate-500">;</span>
        </pre>
      </div>

      {/* Columns Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Kolom</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Tipe Data</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Constraint</th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col) => (
              <tr key={col.name} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {col.constraint === 'PK' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">PK</span>
                    )}
                    {col.constraint?.startsWith('FK') && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold">FK</span>
                    )}
                    {col.constraint === 'UNIQUE' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">UQ</span>
                    )}
                    <span className="font-mono text-slate-300">{col.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-emerald-400">{col.type}</td>
                <td className="py-2.5 px-3 font-mono text-xs text-rose-400">{col.constraint || '—'}</td>
                <td className="py-2.5 px-3 text-xs text-slate-500 hidden sm:table-cell">{col.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getGlowColor(id: string): string {
  const colors: Record<string, string> = {
    cooperatives: 'rgba(59, 130, 246, 0.12)',
    users: 'rgba(16, 185, 129, 0.12)',
    memberships: 'rgba(168, 85, 247, 0.12)',
    id_sequences: 'rgba(245, 158, 11, 0.12)',
    savings: 'rgba(244, 63, 94, 0.12)',
  };
  return colors[id] || 'rgba(255, 255, 255, 0.1)';
}
