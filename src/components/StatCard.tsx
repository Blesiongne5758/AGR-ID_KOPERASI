import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
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
  icon,
  trend,
  subtitle,
  color = 'emerald',
}: StatCardProps) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      trend: 'bg-emerald-50 text-emerald-600',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      trend: 'bg-blue-50 text-blue-600',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      trend: 'bg-amber-50 text-amber-600',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      icon: 'text-rose-400',
      trend: 'bg-rose-50 text-rose-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${colors.trend}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>

      <div className="mb-1">
        <h3 className="text-3xl font-bold text-slate-900">
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </h3>
      </div>

      <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>

      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
