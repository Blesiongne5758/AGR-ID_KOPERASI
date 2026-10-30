import { TechLayer } from '../data/layers';

interface Props {
  layer: TechLayer;
  index: number;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export default function TechLayerCard({ layer, index, isActive, onHover, onLeave }: Props) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-500
        ${isActive
          ? `${layer.borderColor} shadow-xl scale-[1.02]`
          : 'border-white/10 hover:border-white/20'
        }
      `}
      style={isActive ? {
        boxShadow: `0 0 40px ${getGlowColor(layer.id)}`,
      } : {}}
    >
      {/* Background glow */}
      <div className={`absolute inset-0 ${layer.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Gradient top border */}
      <div className={`h-1 bg-gradient-to-r ${layer.colorFrom} ${layer.colorTo}`} />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{layer.icon}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${layer.bgGlow} ${layer.color} border ${layer.borderColor}`}>
                Layer {index + 1}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-2">{layer.name}</h3>
            <p className="text-sm text-slate-500">{layer.subtitle}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          {layer.description}
        </p>

        {/* Technologies */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Teknologi
          </h4>
          <div className="flex flex-wrap gap-2">
            {layer.technologies.map((tech) => (
              <span
                key={tech}
                className={`
                  text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
                  bg-white/5 text-slate-300 border border-white/10
                  group-hover:${layer.bgGlow} group-hover:${layer.color} group-hover:border-current
                `}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Peran & Tanggung Jawab
          </h4>
          <ul className="space-y-2">
            {layer.roles.map((role, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${layer.color.replace('text-', 'bg-')} flex-shrink-0`} />
                <span>{role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function getGlowColor(id: string): string {
  const colors: Record<string, string> = {
    'frontend': 'rgba(59, 130, 246, 0.1)',
    'api-gateway': 'rgba(16, 185, 129, 0.1)',
    'core-backend': 'rgba(168, 85, 247, 0.1)',
    'database': 'rgba(245, 158, 11, 0.1)',
    'cache-queue': 'rgba(244, 63, 94, 0.1)',
  };
  return colors[id] || 'rgba(255, 255, 255, 0.05)';
}
