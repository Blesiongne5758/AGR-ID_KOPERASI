import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  CircleDollarSign, 
  Link2, 
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface Props {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
  coopName: string;
  coopCode: string;
}

export default function Sidebar({ activeMenu, onMenuChange, coopName, coopCode }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Anggota', icon: Users, badge: 1247 },
    { id: 'savings', label: 'Simpanan', icon: Wallet },
    { id: 'loans', label: 'Pinjaman', icon: CircleDollarSign, badge: 12 },
    { id: 'agrid', label: 'Integrasi AGRID', icon: Link2 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleMenuClick = (menuId: string) => {
    onMenuChange(menuId);
    setIsMobileOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-50
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white truncate">{coopName}</h2>
                <p className="text-xs text-slate-400">{coopCode}</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                  ${isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-bold
                        ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}
                      `}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400 mb-1">Versi Sistem</p>
              <p className="text-sm font-semibold text-white">v2.0.0</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-white shadow-lg"
      >
        <LayoutDashboard className="w-5 h-5" />
      </button>
    </>
  );
}
