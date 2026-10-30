import { useState } from 'react';
import { 
  Monitor, 
  Server, 
  Cpu, 
  Database, 
  Zap,
  ChevronRight,
  Code2,
  Shield,
  Layers
} from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  icon: any;
  technology: string;
  role: string;
  color: string;
  gradient: string;
}

const layers: Layer[] = [
  {
    id: 'frontend',
    name: 'Frontend (UI/UX)',
    icon: Monitor,
    technology: 'HTML5, Tailwind CSS, React.js (atau Vue.js)',
    role: 'Single Page Application (SPA). Mobile-first untuk Anggota, Dashboard Data-rich untuk Admin Koperasi.',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'gateway',
    name: 'API Gateway / BFF',
    icon: Server,
    technology: 'Node.js (NestJS atau Express)',
    role: 'Menangani routing awal, validasi token, agregasi data, dan jembatan integrasi API ke AGRID Marketplace.',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'backend',
    name: 'Core Backend',
    icon: Cpu,
    technology: 'Golang (Gin atau Fiber)',
    role: 'Mesin utama keuangan: Generate ID Unik (dengan Pessimistic Locking), perhitungan bunga, double-entry ledger, dan manajemen transaksi berat.',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    id: 'database',
    name: 'Database',
    icon: Database,
    technology: 'PostgreSQL',
    role: 'Penyimpanan data relasional dengan fitur Row-Level Security (RLS) dan ACID Compliance.',
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'cache',
    name: 'Cache & Queue',
    icon: Zap,
    technology: 'Redis',
    role: 'Menyimpan sesi login, rate limiting, dan antrian notifikasi (WhatsApp/Email).',
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
  },
];

export default function App() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <Layers className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Arsitektur Sistem Koperasi Digital
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Tech Stack & Layer Arsitektur untuk Sistem Manajemen Koperasi Terintegrasi
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            5 Layer Arsitektur
          </h2>
          
          <div className="space-y-4">
            {layers.map((layer, index) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayer(isActive ? null : layer.id)}
                  className={`
                    relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                    ${isActive 
                      ? 'border-white/20 bg-white/10 shadow-2xl' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }
                  `}
                >
                  {/* Gradient Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${layer.gradient}`} />
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`
                        w-14 h-14 rounded-xl bg-gradient-to-br ${layer.gradient} 
                        flex items-center justify-center flex-shrink-0 shadow-lg
                      `}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {layer.name}
                          </h3>
                          <ChevronRight className={`
                            w-5 h-5 text-slate-400 transition-transform duration-300
                            ${isActive ? 'rotate-90' : ''}
                          `} />
                        </div>
                        
                        {/* Technology */}
                        <div className="mb-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Teknologi
                          </span>
                          <p className={`text-sm font-semibold ${layer.color} mt-1`}>
                            {layer.technology}
                          </p>
                        </div>
                        
                        {/* Role */}
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Peran & Tanggung Jawab
                          </span>
                          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                            {layer.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-emerald-400" />
            Flow Arsitektur
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex flex-col items-center space-y-4">
              {layers.map((layer, index) => {
                const Icon = layer.icon;
                return (
                  <div key={layer.id} className="w-full">
                    <div className={`
                      flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${layer.gradient} bg-opacity-10
                      border border-white/10
                    `}>
                      <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">{layer.name}</div>
                        <div className="text-white/70 text-sm">{layer.technology}</div>
                      </div>
                      <div className="text-white/50 text-xs font-mono">
                        Layer {index + 1}
                      </div>
                    </div>
                    
                    {/* Arrow */}
                    {index < layers.length - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-white/20 to-white/5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'Multi-Tenant Architecture',
              desc: 'Mendukung multiple koperasi dalam satu sistem dengan isolasi data',
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              icon: Zap,
              title: 'High Performance',
              desc: 'Golang backend dengan Redis cache untuk response time optimal',
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
            {
              icon: Database,
              title: 'ACID Compliance',
              desc: 'PostgreSQL dengan RLS untuk data integrity dan security',
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              icon: Server,
              title: 'API Gateway Pattern',
              desc: 'BFF (Backend for Frontend) untuk routing dan aggregasi data',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
            },
            {
              icon: Monitor,
              title: 'Mobile-First Design',
              desc: 'Responsive UI untuk anggota dan dashboard data-rich untuk admin',
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10',
            },
            {
              icon: Code2,
              title: 'Modern Tech Stack',
              desc: 'React, Node.js, Golang, PostgreSQL, Redis - teknologi terkini',
              color: 'text-rose-400',
              bg: 'bg-rose-500/10',
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

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
