'use client';

import React, { useState } from 'react';
import { useSession } from '@/components/providers';
import { 
  Menu, X, Bell, LogOut, User as UserIcon, BookOpen, 
  BarChart2, Users, Calendar, Shield, BrainCircuit, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, navItems }) => {
  const { user, logout, loading } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'Jane Smith attendance dropped below 75%', time: '2h ago', type: 'risk' },
    { id: '2', text: 'New student file upload processed', time: '1d ago', type: 'info' },
  ]);
  const pathname = usePathname();

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const isFaculty = user?.role === 'faculty';
  const accentColor = isFaculty ? 'text-secondary border-secondary/20 bg-secondary/10' : 'text-primary border-primary/20 bg-primary/10';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-on-surface-variant text-sm font-medium">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased flex overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-fixed-dim/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 1. Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-outline-variant/50 bg-background/40 backdrop-blur-xl fixed h-full z-30">
        <div className="p-6 border-b border-outline-variant/30 flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${accentColor}`}>
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-headline font-black text-on-surface text-lg tracking-tight">UniSmart</span>
            <p className="text-[10px] text-on-surface-variant font-label uppercase font-bold tracking-wider">
              {isFaculty ? 'Faculty Portal' : 'Admin Console'}
            </p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/faculty/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-medium transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-primary-container/80 text-on-primary-container border-l-4 border-primary-fixed shadow-md shadow-primary-container/20' 
                    : 'text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-primary-fixed-dim'
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest/30">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-label font-semibold text-error hover:bg-error-container/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-64 bg-surface-container-highest border-r border-outline-variant/50 h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${accentColor}`}>
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <span className="font-headline font-black text-on-surface text-lg">UniSmart</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/faculty/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-label font-medium transition-all ${
                      isActive 
                        ? 'bg-primary-container text-on-primary-container' 
                        : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-outline-variant/30">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-label font-semibold text-error hover:bg-error-container/10 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:pl-64 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-outline-variant/50 bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-variant/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-headline font-bold text-on-surface tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-variant/40 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full animate-pulse" />
                )}
              </button>

              {/* Dropdown glass panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-headline font-semibold text-on-surface">Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={handleClearNotifications} className="text-[10px] text-primary-fixed hover:underline font-semibold">
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-on-surface-variant text-center py-6 font-body">No new notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 rounded-lg bg-surface-container border border-outline-variant/40 text-[11px] leading-relaxed">
                          <p className="text-on-surface font-medium">{n.text}</p>
                          <span className="text-on-surface-variant block text-[9px] mt-1">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-variant/50 transition-colors border border-outline-variant/40 bg-surface-container/30"
              >
                <div className="w-7 h-7 bg-primary-fixed-dim/20 text-primary-fixed border border-primary-fixed-dim/30 rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-on-surface truncate max-w-[120px]">{user?.name || 'User'}</div>
                  <div className="text-[9px] text-on-surface-variant capitalize font-medium">{user?.role}</div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-2 border-b border-outline-variant/30 mb-1">
                    <div className="text-sm font-semibold text-on-surface truncate">{user?.name}</div>
                    <div className="text-xs text-on-surface-variant truncate">{user?.email}</div>
                  </div>
                  <div className="py-1">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-on-surface-variant capitalize">
                      <Shield className="w-4 h-4 text-primary-fixed-dim" />
                      Role: <span className="font-bold text-on-surface ml-auto">{user?.role}</span>
                    </div>
                    {user?.department && (
                      <div className="px-3 py-1.5 text-xs text-on-surface-variant flex">
                        Dept: <span className="text-on-surface font-bold ml-auto">{user.department}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-outline-variant/30 mt-1 pt-1">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error-container/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <main className="flex-grow p-6 md:p-8 space-y-8 overflow-y-auto bg-surface-dim relative">
          {children}
        </main>
      </div>
    </div>
  );
};

