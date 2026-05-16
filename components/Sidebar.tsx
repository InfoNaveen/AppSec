'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Upload, ShieldAlert, Clock, Wrench, Settings, ChevronLeft, Shield, Activity
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload & Scan', href: '/upload', icon: Upload },
  { name: 'Scan Results', href: '/scan-results', icon: ShieldAlert },
  { name: 'Security Timeline', href: '/timeline', icon: Clock },
  { name: 'Patches', href: '/patches', icon: Wrench },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void; 
}) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 80, x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -240 : 0) }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-ds-bg-card border-r border-ds-border md:static md:translate-x-0 overflow-hidden shadow-2xl`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between h-16 px-4 border-b border-ds-border/50">
            <AnimatePresence mode="wait">
              {sidebarOpen ? (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-3 w-full"
                >
                  <Shield className="h-6 w-6 text-ds-accent-cyan" />
                  <span className="text-lg font-bold font-syne text-ds-text-primary tracking-wide">DevSentinel AI</span>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center w-full"
                >
                  <Shield className="h-6 w-6 text-ds-accent-cyan" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              className="md:hidden ml-2 flex-shrink-0 rounded-md text-ds-text-muted hover:text-ds-accent-cyan focus:outline-none transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex-1 px-0 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-ds-accent-cyan bg-ds-bg-surface'
                      : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-ds-accent-cyan glow-cyan"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-ds-accent-cyan' : 'text-ds-text-muted group-hover:text-ds-text-primary'
                    } transition-colors`}
                  />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 truncate whitespace-nowrap"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Security Score Ring */}
          <div className="p-4 border-t border-ds-border/50 bg-ds-bg-card">
            <AnimatePresence>
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col items-center justify-center space-y-4 py-2"
                >
                  <p className="text-xs text-ds-text-muted uppercase tracking-widest font-semibold font-syne">Security Score</p>
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="46" stroke="var(--ds-bg-surface)" strokeWidth="6" fill="none" />
                      <motion.circle 
                        cx="56" cy="56" r="46" 
                        stroke="var(--ds-accent-cyan)" 
                        strokeWidth="6" 
                        fill="none" 
                        strokeDasharray="289"
                        initial={{ strokeDashoffset: 289 }}
                        animate={{ strokeDashoffset: 289 * (1 - 0.94) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 0 6px var(--ds-accent-cyan-dim))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold font-syne text-ds-text-primary">94</span>
                      <span className="text-[10px] text-ds-accent-green font-bold">A+</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center"
                >
                  <Activity className="h-6 w-6 text-ds-accent-cyan" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
