import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: 'emerald' | 'blue' | 'amber' | 'rose';
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  color = 'emerald' 
}: Props) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      glow: 'shadow-blue-500/5',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      glow: 'shadow-amber-500/5',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      icon: 'text-rose-400',
      glow: 'shadow-rose-500/5',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`
      relative overflow-hidden bg-white rounded-xl border border-slate-200
      p-6 shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-1 ${colors.glow}
    `}>
      {/* Background Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full -translate-y-16 translate-x-16 opacity-50`} />
      
      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`
            w-12 h-12 rounded-lg ${colors.bg} border ${colors.border}
            flex items-center justify-center
          `}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          
          {trend && (
            <div className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
              ${trend.isPositive 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-rose-50 text-rose-600'
              }
            `}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-1">
          <h3 className="text-3xl font-bold text-slate-900">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
          </h3>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-slate-600 mb-1">
          {title}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
