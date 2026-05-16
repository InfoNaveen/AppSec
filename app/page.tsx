'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Lock, Globe, Settings, Database, CheckCircle2, ArrowRight, Landmark, FileCheck, TrendingDown, Building2
} from 'lucide-react';
import { staggerContainer, staggerItem, fadeIn } from '@/lib/motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ds-bg-deep relative overflow-hidden">
      <div className="absolute top-0 w-full h-full bg-[url('/grid.svg')] bg-center opacity-[0.02] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="absolute top-0 w-full px-8 py-6 flex justify-between items-center z-50">
        <div className="text-2xl font-bold font-syne tracking-wide text-ds-text-primary flex items-center group">
          <Shield className="mr-3 h-7 w-7 text-ds-accent-cyan transition-transform group-hover:scale-110 duration-300 drop-shadow-[0_0_8px_var(--ds-accent-cyan-dim)]" />
          DevSentinel AI
        </div>
        <div className="hidden md:flex space-x-10 text-[11px] font-bold tracking-widest text-ds-text-secondary uppercase">
          <Link href="#solutions" className="hover:text-ds-accent-cyan transition-colors">Frameworks</Link>
          <Link href="#compliance" className="hover:text-ds-accent-cyan transition-colors">Intelligence</Link>
          <Link href="#financial-api" className="hover:text-ds-accent-cyan transition-colors">API Defense</Link>
          <Link href="#enterprise" className="hover:text-ds-accent-cyan transition-colors">Enterprise</Link>
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/login">
            <button className="text-[11px] font-bold tracking-widest text-ds-text-primary hover:text-ds-accent-cyan uppercase transition-colors">Secure Login</button>
          </Link>
          <Link href="/upload">
            <button className="bg-ds-accent-cyan hover:bg-[#00c9e0] text-black px-6 py-2.5 rounded text-[11px] font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_var(--ds-accent-cyan-dim)]">
              Initialize Audit
            </button>
          </Link>
        </div>
      </nav>

      <motion.main
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="pt-40 pb-20 px-6 max-w-7xl mx-auto relative z-10"
      >
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-40">
          <motion.div variants={staggerItem} className="text-left z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-0.5 w-10 bg-ds-accent-cyan glow-cyan" />
              <span className="text-ds-accent-cyan text-xs font-bold font-syne tracking-widest uppercase">Autonomous Vulnerability Engine</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-syne leading-[1.1] mb-8 text-ds-text-primary tracking-tight">
              ESTABLISH TRUST IN<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ds-text-primary via-ds-accent-cyan to-blue-500 drop-shadow-[0_0_10px_var(--ds-accent-cyan-dim)]">
                PRODUCTION LAYERS
              </span>
            </h1>

            <p className="text-ds-text-secondary font-mono text-sm md:text-base mb-10 max-w-xl leading-relaxed">
              DevSentinel AI operates an autonomous risk-prevention compiler for modern systems. Fortify backend architectures to eliminate injection vectors, stop zero-days natively, and enforce security policies before merging branches.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/upload">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 bg-ds-accent-cyan rounded text-black font-bold font-syne tracking-widest uppercase shadow-[0_0_20px_var(--ds-accent-cyan-dim)] hover:shadow-[0_0_30px_var(--ds-accent-cyan-dim)] transition-all flex items-center justify-center text-sm"
                >
                  Hardening Protocol <ArrowRight className="ml-2 h-4 w-4" />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-8 py-4 bg-ds-bg-surface rounded text-ds-text-primary font-bold font-syne tracking-widest uppercase border border-ds-border hover:bg-ds-border/50 transition-all flex items-center justify-center text-sm"
                >
                  Access Console
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="relative h-[500px] w-full perspective-1000 hidden lg:block">
            <div className="absolute inset-0 bg-ds-accent-cyan/10 blur-[100px] rounded-full opacity-60 pointer-events-none" />

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/4 right-0 bottom-0"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-ds-bg-card/80 backdrop-blur-xl rounded border border-ds-border flex flex-col items-center justify-center p-8 shadow-[0_0_50px_rgba(0,229,255,0.15)] z-20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-ds-accent-cyan to-transparent animate-[shimmer_2s_infinite]" />
                
                <div className="w-20 h-20 bg-ds-bg-surface border border-ds-border rounded flex items-center justify-center mb-8 shadow-inner glow-cyan relative">
                  <div className="absolute inset-0 bg-ds-accent-cyan/10 rounded" />
                  <Database className="text-ds-accent-cyan h-10 w-10 relative z-10" />
                </div>
                
                <div className="w-full space-y-6 font-mono text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                      <span className="text-ds-text-secondary">Path Traversal Validation</span>
                      <CheckCircle2 className="h-4 w-4 text-ds-accent-green glow-green" />
                    </div>
                    <div className="h-1 w-full bg-ds-bg-deep rounded-full overflow-hidden border border-ds-border/30">
                      <div className="h-full w-full bg-ds-accent-green drop-shadow-[0_0_5px_#00FF88]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs uppercase tracking-wider">
                      <span className="text-ds-text-secondary">Payload Injection Sweep</span>
                      <span className="text-ds-accent-cyan font-bold">100% CLEAR</span>
                    </div>
                    <div className="h-1 w-full bg-ds-bg-deep rounded-full overflow-hidden border border-ds-border/30">
                      <div className="h-full w-[100%] bg-ds-accent-cyan drop-shadow-[0_0_5px_#00E5FF]" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-ds-border/50 mt-6">
                    <div className="flex justify-between text-xs tracking-wider">
                      <span className="text-ds-text-muted">SYSTEM INTEGRITY SCORE</span>
                      <span className="text-ds-text-primary font-bold">A+ RATING</span>
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, 15, 0], x: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -right-12 top-20 w-48 p-4 bg-ds-bg-surface/90 backdrop-blur border border-ds-border rounded shadow-xl flex items-center space-x-4 z-30"
              >
                <div className="p-2.5 bg-ds-amber/10 border border-ds-amber/30 rounded">
                  <Lock className="h-5 w-5 text-ds-amber glow-yellow" />
                </div>
                <div>
                  <div className="text-ds-text-primary font-bold font-syne text-sm">Strict Zero-Trust</div>
                  <div className="text-ds-text-muted text-[10px] uppercase tracking-wider font-mono">Enforced Layer</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -15, 0], x: [0, -5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -left-16 bottom-32 w-56 p-4 bg-ds-bg-surface/90 backdrop-blur border border-ds-border rounded shadow-xl flex items-center space-x-4 z-30"
              >
                <div className="p-2.5 bg-ds-accent-cyan/10 border border-ds-accent-cyan/30 rounded">
                  <Globe className="h-5 w-5 text-ds-accent-cyan glow-cyan" />
                </div>
                <div>
                  <div className="text-ds-text-primary font-bold font-syne text-sm">Edge Validation</div>
                  <div className="text-ds-text-muted text-[10px] uppercase tracking-wider font-mono">Active Monitoring</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div variants={staggerItem} className="text-center mb-40 border-y border-ds-border/50 py-16 bg-ds-bg-surface/20">
          <p className="text-ds-text-muted text-xs font-bold tracking-widest uppercase font-syne mb-10">Trusted to harden enterprise production applications globally</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="text-xl font-bold font-syne text-white flex items-center tracking-wide"><Shield className="mr-3 h-6 w-6 text-ds-text-secondary" /> ARMORHQ</div>
            <div className="text-xl font-bold font-syne text-white flex items-center tracking-wide"><Globe className="mr-3 h-6 w-6 text-ds-text-secondary" /> NEXUS</div>
            <div className="text-xl font-bold font-syne text-white flex items-center tracking-wide"><Building2 className="mr-3 h-6 w-6 text-ds-text-secondary" /> FINCORP</div>
            <div className="text-xl font-bold font-syne text-white flex items-center tracking-wide"><Database className="mr-3 h-6 w-6 text-ds-text-secondary" /> VECTOR</div>
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-syne text-ds-text-primary mb-6 tracking-wide">Infrastructure Resiliency</h2>
            <p className="text-ds-text-secondary font-mono max-w-2xl mx-auto text-sm leading-relaxed">
              Guarantee absolute zero-knowledge verification frameworks that identify logical bypasses dynamically. We map structural AST vulnerabilities instantaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Data Extraction Prevention',
                desc: 'Safeguard backend arrays identifying logic paths directly mapping to SQL injection sequences.',
                icon: TrendingDown,
                color: 'text-ds-accent-green',
                border: 'var(--ds-accent-green)'
              },
              {
                title: 'Deep Dependency Scanning',
                desc: 'Audit remote package locks blocking tainted or malicious third-party dependencies immediately.',
                icon: FileCheck,
                color: 'text-[#00A8CC]',
                border: '#00A8CC'
              },
              {
                title: 'Auth Bypass Lockdowns',
                desc: 'Block faulty stateless token decoders and broken JWT implementations efficiently.',
                icon: Lock,
                color: 'text-ds-amber',
                border: '#FFB800'
              },
              {
                title: 'Live Exploitation Matrix',
                desc: 'Execute identical offensive maneuvers as malicious actors testing security bounds automatically.',
                icon: Shield,
                color: 'text-ds-accent-cyan',
                border: 'var(--ds-accent-cyan)'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-ds-bg-card p-8 rounded-xl border border-ds-border relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300">
                <div 
                  className={`absolute top-0 left-0 w-full h-1 opacity-60 group-hover:opacity-100 transition-opacity`}
                  style={{ background: `linear-gradient(90deg, transparent, ${item.border}, transparent)` }}
                />
                <div className={`p-3 bg-ds-bg-surface border border-ds-border rounded inline-block mb-6 ${item.color}`}>
                  <item.icon className={`h-6 w-6`} />
                </div>
                <h3 className="text-lg font-bold font-syne text-ds-text-primary mb-3 tracking-wide">{item.title}</h3>
                <p className="text-ds-text-secondary font-mono text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}
