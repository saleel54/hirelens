import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Sparkles, 
  User, 
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
  Info,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type TabName = 'dashboard' | 'analyze' | 'copilot' | 'interview' | 'about' | 'profile';

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);
  
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
    { id: 'copilot' as TabName, label: 'Career Copilot', icon: Compass },
    { id: 'interview' as TabName, label: 'AI Mock Interview', icon: BookOpen },
    { id: 'about' as TabName, label: 'About YAStudio', icon: Info },
    { id: 'profile' as TabName, label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Sticky Top Header */}
      <div className="w-full sticky top-0 z-30 lg:hidden flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/40 shadow-xs shrink-0">
        <div className="flex items-center space-x-2.5 cursor-pointer font-sans" onClick={() => onTabChange('dashboard')}>
          {/* Glowing Aperture/Lens Logo Icon */}
          <div className="relative w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-[1.5px] shadow-md shadow-primary/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] animate-pulse"></div>
              <div className="relative w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-primary flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                <div className="w-1 h-1 rounded-full bg-white animate-ping opacity-75"></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="font-outfit font-extrabold text-lg tracking-tighter text-slate-800 dark:text-slate-100 leading-none">
              HireLens<span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-black">AI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all duration-200 shrink-0"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
          
          {/* Hamburger Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer Panel */}
      <div 
        className={`fixed top-0 bottom-0 left-0 w-68 bg-white/98 dark:bg-slate-950/98 backdrop-blur-lg border-r border-slate-100 dark:border-slate-900/60 z-50 flex flex-col justify-between h-full lg:hidden transition-all duration-300 transform ${
          isMobileMenuOpen ? 'translate-x-0 shadow-[10px_0_40px_-10px_rgba(0,0,0,0.3)]' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-8.5 h-8.5 rounded-lg bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-[1.5px]">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <div className="relative w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-primary shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
              </div>
            </div>
            <span className="font-outfit font-extrabold text-lg tracking-tighter text-slate-800 dark:text-slate-100">
              HireLens<span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent font-black">AI</span>
            </span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-secondary-dark dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold group cursor-pointer transition-colors duration-200 ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTabPillMobile"
                    className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/3 to-transparent border-l-3 border-primary rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <div className="relative z-10">
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Drawer Profile Box */}
        <div className="p-4 border-t border-slate-100/80 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 shadow-xs">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[1.5px] shrink-0">
                <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 flex items-center justify-center font-outfit font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  {user?.name.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {user?.name || 'Job Seeker'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 truncate leading-none mt-1">
                  {user?.email || 'seeker@hirelens.ai'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-error hover:bg-error/5 transition-all duration-200 cursor-pointer shrink-0"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Persistent Sidebar Navigation */}
      <aside className="hidden lg:flex w-68 border-r border-slate-100 bg-white/95 backdrop-blur-md flex-col justify-between h-screen sticky top-0 z-40 transition-all duration-300 selection:bg-primary/20 shrink-0">
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
                className={`relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold group cursor-pointer transition-colors duration-300 ${
                  isActive 
                    ? 'text-primary font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="activeTabPillDesktop"
                    className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/3 to-transparent border-l-3 border-primary rounded-xl shadow-[inset_1px_0_0_0_rgba(99,102,241,0.1)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <div className="relative z-10">
                    <ChevronRight className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                )}
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
    </>
  );
};
export default Sidebar;
