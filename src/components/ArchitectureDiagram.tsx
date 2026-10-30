import { TechLayer } from '../data/layers';

interface Props {
  activeLayer: string | null;
  setActiveLayer: (id: string | null) => void;
}

const layerPositions = [
  { id: 'frontend', label: 'Frontend', icon: '🎨', color: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500/50' },
  { id: 'api-gateway', label: 'API Gateway', icon: '🌐', color: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/50' },
  { id: 'core-backend', label: 'Core Backend', icon: '⚙️', color: 'bg-purple-500', textColor: 'text-purple-400', borderColor: 'border-purple-500/50' },
  { id: 'database', label: 'Database', icon: '🗄️', color: 'bg-amber-500', textColor: 'text-amber-400', borderColor: 'border-amber-500/50' },
  { id: 'cache-queue', label: 'Cache & Queue', icon: '⚡', color: 'bg-rose-500', textColor: 'text-rose-400', borderColor: 'border-rose-500/50' },
];

export default function ArchitectureDiagram({ activeLayer, setActiveLayer }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Diagram Arsitektur</h2>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-sm">
        {/* Vertical Stack */}
        <div className="flex flex-col items-center gap-2">
          {layerPositions.map((layer, index) => (
            <div key={layer.id} className="w-full flex flex-col items-center">
              {/* Layer Node */}
              <button
                onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                className={`
                  w-full max-w-md group relative transition-all duration-300 cursor-pointer
                  ${activeLayer === layer.id ? 'scale-105' : 'hover:scale-102'}
                `}
              >
                <div
                  className={`
                    relative flex items-center gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-300
                    ${activeLayer === layer.id
                      ? `${layer.borderColor} ${layer.textColor} shadow-lg`
                      : 'border-white/10 hover:border-white/20 text-slate-300'
                    }
                  `}
                  style={activeLayer === layer.id ? {
                    boxShadow: `0 0 30px ${getGlowColor(layer.id)}`,
                  } : {}}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${layer.color}/20 bg-opacity-20`}>
                    {layer.icon}
                  </div>
                  {/* Label */}
                  <div className="flex-1 text-left">
                    <div className={`font-semibold text-base sm:text-lg ${activeLayer === layer.id ? layer.textColor : 'text-slate-300'}`}>
                      {layer.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Layer {index + 1}</div>
                  </div>
                  {/* Active indicator */}
                  {activeLayer === layer.id && (
                    <div className={`w-3 h-3 rounded-full ${layer.color} animate-pulse`} />
                  )}
                </div>
              </button>

              {/* Connector Arrow */}
              {index < layerPositions.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-white/10" />
                  <svg className="w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span>Klik layer untuk highlight</span>
            <span className="text-white/20">•</span>
            <span>Request mengalir dari atas ke bawah</span>
            <span className="text-white/20">•</span>
            <span>Response mengalir dari bawah ke atas</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getGlowColor(id: string): string {
  const colors: Record<string, string> = {
    'frontend': 'rgba(59, 130, 246, 0.15)',
    'api-gateway': 'rgba(16, 185, 129, 0.15)',
    'core-backend': 'rgba(168, 85, 247, 0.15)',
    'database': 'rgba(245, 158, 11, 0.15)',
    'cache-queue': 'rgba(244, 63, 94, 0.15)',
  };
  return colors[id] || 'rgba(255, 255, 255, 0.1)';
}
