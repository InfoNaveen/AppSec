'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, ChevronDown, Shield, LogOut, Plus } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function Navbar({ 
  sidebarOpen, 
  setSidebarOpen
}: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabaseBrowser().auth.signOut();
      if (error) throw error;
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/' },
    { name: 'Scans', href: '/scan-results' },
    { name: 'Activity', href: '/timeline' },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-30 flex h-16 flex-shrink-0 transition-all duration-300 border-t border-ds-border ${
        scrolled ? 'backdrop-blur-xl bg-[rgba(7,11,20,0.8)] shadow-lg' : 'bg-ds-bg-deep'
      }`}
    >
      <div className="flex flex-1 items-center justify-between px-4 md:px-8">
        {/* Left Section - Logo */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="rounded-lg p-2 text-ds-text-muted hover:text-ds-accent-cyan hover:bg-ds-accent-cyan-dim focus:outline-none transition-all md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <Link href="/" className="hidden md:flex items-center space-x-3 group">
            <div className="relative">
              <Shield className="h-7 w-7 text-ds-accent-cyan transition-transform group-hover:scale-110 duration-300" />
              <div className="absolute inset-0 bg-ds-accent-cyan opacity-20 blur-md rounded-full pointer-events-none group-hover:opacity-40 transition-opacity" />
            </div>
            <span className="text-xl font-bold font-syne text-ds-text-primary tracking-wide">ShieldX</span>
          </Link>
        </div>

        {/* Center Section - Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className="relative py-2 text-sm font-medium transition-colors group"
              >
                <span className={`${isActive ? 'text-ds-text-primary' : 'text-ds-text-secondary group-hover:text-ds-text-primary'}`}>
                  {link.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-ds-accent-cyan glow-cyan"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-5">
          <Link href="/upload" className="flex items-center space-x-2 bg-ds-accent-cyan hover:bg-[#00c9e0] transition-colors text-black px-4 py-2 rounded-md font-semibold text-sm shadow-[0_0_15px_var(--ds-accent-cyan-dim)]">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Scan</span>
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-2 rounded-lg py-1 focus:outline-none hover:opacity-80 transition-opacity"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-ds-bg-surface border border-ds-border flex items-center justify-center overflow-hidden">
                <User className="h-4 w-4 text-ds-text-primary" />
              </div>
            </button>
            
            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-ds-bg-card border border-ds-border shadow-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-ds-border">
                      <p className="text-sm font-semibold font-syne text-ds-text-primary">Admin User</p>
                      <p className="text-xs text-ds-text-muted mt-0.5">admin@shieldx.ai</p>
                    </div>
                    <div className="py-1">
                      <a
                        href="/settings"
                        className="block px-4 py-2 text-sm text-ds-text-secondary hover:bg-ds-bg-surface hover:text-ds-text-primary transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </a>
                      <button
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-ds-red hover:bg-ds-red/10 transition-colors flex items-center"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
