import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  History, 
  User, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type TabName = 'dashboard' | 'analyze' | 'history' | 'interview' | 'about' | 'profile';

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  
  // Theme state manager
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const savedTheme = localStorage.getItem('hirelens_theme');
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hirelens_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hirelens_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navItems = [
    { id: 'dashboard' as TabName, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze' as TabName, label: 'Analyze Resume', icon: Sparkles },
    { id: 'history' as TabName, label: 'Analysis History', icon: History },
    { id: 'interview' as TabName, label: 'AI Mock Interview', icon: BookOpen },
    { id: 'about' as TabName, label: 'About YAStudio', icon: Info },
    { id: 'profile' as TabName, label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-68 border-r border-slate-100 bg-white/95 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 z-40 transition-all duration-300 selection:bg-primary/20">
      {/* Brand Header & Theme Toggle */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 group cursor-pointer">
          {/* Glowing Aperture/Lens Logo Icon */}
          <div className="relative w-10.5 h-10.5 rounded-xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-[2px] shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
              {/* Inner glowing lens */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] animate-pulse"></div>
              {/* Aperture blades details */}
              <div className="absolute w-8 h-8 rounded-full border border-white/10 opacity-30 animate-spin-slow"></div>
              {/* Glowing center dot representing the AI focus lens */}
              <div className="relative w-3.5 h-3.5 rounded-full bg-gradient-to-r from-cyan-400 to-primary flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.6)]">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="font-outfit font-extrabold text-xl tracking-tighter text-slate-800 leading-none group-hover:text-primary transition-colors duration-200">
              HireLens<span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-black">AI</span>
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Screening</span>
          </div>
        </div>

        {/* Dynamic Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all duration-200 shrink-0"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-primary/8 via-primary/3 to-transparent text-primary border-l-3 border-primary shadow-[inset_1px_0_0_0_rgba(99,102,241,0.1)]' 
                  : 'text-slate-500 hover:bg-slate-50/80 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-primary animate-pulse" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile Box - Glassmorphic Card */}
      <div className="p-4 border-t border-slate-100/80 bg-slate-50/40">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            {/* Elegant avatar with gradient border */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1.5px] shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-outfit font-extrabold text-sm text-slate-800">
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold text-slate-800 truncate leading-tight">
                {user?.name || 'Job Seeker'}
              </p>
              <p className="text-[10px] font-semibold text-slate-400 truncate leading-none mt-1">
                {user?.email || 'seeker@hirelens.ai'}
              </p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={logout}
            title="Sign Out"
            className="p-2 rounded-xl text-slate-400 hover:text-error hover:bg-error/5 transition-all duration-200 cursor-pointer shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
