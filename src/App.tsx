import { useState } from 'react';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import TechLayerCard from './components/TechLayerCard';
import FlowDiagram from './components/FlowDiagram';
import DatabaseSchema from './components/DatabaseSchema';
import { layers } from './data/layers';

export default function App() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-slate-300">System Architecture v2.0</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent mb-4">
              Arsitektur Teknologi Koperasi
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
              Desain sistem terdistribusi dengan microservices architecture untuk platform koperasi digital yang skalabel, aman, dan performant.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Architecture Diagram */}
        <ArchitectureDiagram activeLayer={activeLayer} setActiveLayer={setActiveLayer} />

        {/* Layer Cards */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Detail Setiap Layer</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer, index) => (
              <TechLayerCard
                key={layer.id}
                layer={layer}
                index={index}
                isActive={activeLayer === layer.id}
                onHover={() => setActiveLayer(layer.id)}
                onLeave={() => setActiveLayer(null)}
              />
            ))}
          </div>
        </section>

        {/* Database Schema */}
        <section className="mt-16">
          <DatabaseSchema />
        </section>

        {/* Flow Diagram */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Alur Data & Request</h2>
          </div>
          <FlowDiagram />
        </section>

        {/* Stats */}
        <section className="mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Layer', value: '5', icon: '📐' },
              { label: 'Tech Stack', value: '10+', icon: '🛠️' },
              { label: 'Tabel DB', value: '5', icon: '🗄️' },
              { label: 'Relasi FK', value: '4', icon: '🔗' },
              { label: 'ACID Compliant', value: '100%', icon: '🔒' },
              { label: 'Uptime Target', value: '99.9%', icon: '⚡' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:bg-white/10 transition-colors">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2026 Koperasi Digital — Arsitektur Sistem Terintegrasi
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-600">Built with</span>
              <div className="flex items-center gap-2">
                {['React', 'Tailwind', 'TypeScript'].map((tech) => (
                  <span key={tech} className="text-xs px-2 py-1 rounded bg-white/5 text-slate-400 border border-white/10">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
