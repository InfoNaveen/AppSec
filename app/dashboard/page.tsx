'use client';

import { 
  Shield, AlertTriangle, Wrench, Activity, CheckCircle2, AlertCircle, Eye, ArrowUpRight,
  Play, Loader2, Cpu, Search, Crosshair, FileCode, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

// ── Agent Flow Visualizer ───────────────────────────────────────────────────

const AGENTS = [
  { id: 'mapper', name: 'Mapper', icon: Cpu, desc: 'Codebase Intelligence' },
  { id: 'scanner', name: 'Scanner', icon: Search, desc: 'Vulnerability Analysis' },
  { id: 'triage', name: 'Triage', icon: Crosshair, desc: 'Severity Classification' },
  { id: 'remediator', name: 'Remediator', icon: Wrench, desc: 'Auto-Patching' },
  { id: 'hardener', name: 'Hardener', icon: Shield, desc: 'Security Hardening' },
  { id: 'reporter', name: 'Reporter', icon: FileCode, desc: 'Report Generation' },
];

const AGENT_ORDER = ['queued', 'mapper', 'scanner', 'triage', 'remediator', 'hardener', 'reporter', 'completed'];

function getAgentStatus(agentId: string, currentAgent: string, scanStatus: string) {
  if (scanStatus === 'completed') return 'done';
  if (scanStatus === 'failed') {
    const ci = AGENT_ORDER.indexOf(currentAgent);
    const ai = AGENT_ORDER.indexOf(agentId);
    if (ai < ci) return 'done';
    if (ai === ci) return 'failed';
    return 'pending';
  }
  const ci = AGENT_ORDER.indexOf(currentAgent);
  const ai = AGENT_ORDER.indexOf(agentId);
  if (ai < ci) return 'done';
  if (ai === ci) return 'active';
  return 'pending';
}

function AgentFlowVisualizer({ currentAgent, status }: { currentAgent: string; status: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {AGENTS.map((agent, i) => {
        const s = getAgentStatus(agent.id, currentAgent, status);
        return (
          <div key={agent.id} className="flex items-center">
            <motion.div
              animate={s === 'active' ? { scale: [1, 1.05, 1] } : {}}
              transition={s === 'active' ? { repeat: Infinity, duration: 1.5 } : {}}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold font-syne uppercase tracking-wider transition-all ${
                s === 'done'   ? 'bg-ds-accent-green/10 border-ds-accent-green/40 text-ds-accent-green' :
                s === 'active' ? 'bg-ds-accent-cyan/10 border-ds-accent-cyan/50 text-ds-accent-cyan shadow-[0_0_12px_rgba(0,229,255,0.15)]' :
                s === 'failed' ? 'bg-ds-red/10 border-ds-red/40 text-ds-red' :
                                 'bg-ds-bg-surface border-ds-border text-ds-text-muted'
              }`}
            >
              {s === 'active' ? <Loader2 className="h-3 w-3 animate-spin" /> :
               s === 'done'   ? <CheckCircle2 className="h-3 w-3" /> :
               s === 'failed' ? <AlertCircle className="h-3 w-3" /> :
                                <agent.icon className="h-3 w-3" />}
              <span>{agent.name}</span>
            </motion.div>
            {i < AGENTS.length - 1 && (
              <div className={`w-4 h-px mx-1 ${
                s === 'done' ? 'bg-ds-accent-green' : 'bg-ds-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Active Scan Card ────────────────────────────────────────────────────────

interface ScanData {
  id: string; repo_url: string; status: string; current_agent: string;
  findings_count: number; patches_count: number; triggered_by: string;
  created_at: string; updated_at: string;
}

function ActiveScanCard({ scan }: { scan: ScanData }) {
  const repoName = scan.repo_url?.split('/').pop()?.replace('.git', '') || 'Unknown';
  const elapsed = Math.round((Date.now() - new Date(scan.created_at).getTime()) / 1000);
  const elapsedStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;

  return (
    <Link href={`/scan-results?scanId=${scan.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-ds-bg-card rounded-xl border border-ds-border p-5 shadow-lg hover:border-ds-accent-cyan/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              scan.status === 'completed' ? 'bg-ds-accent-green/10 border-ds-accent-green/30' :
              scan.status === 'failed'    ? 'bg-ds-red/10 border-ds-red/30' :
                                            'bg-ds-accent-cyan/10 border-ds-accent-cyan/30'
            }`}>
              {scan.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-ds-accent-green" /> :
               scan.status === 'failed'    ? <AlertCircle className="h-4 w-4 text-ds-red" /> :
                                             <Loader2 className="h-4 w-4 text-ds-accent-cyan animate-spin" />}
            </div>
            <div>
              <p className="font-mono text-sm text-ds-text-primary font-semibold">{repoName}</p>
              <p className="text-[10px] text-ds-text-muted uppercase tracking-wider">{scan.triggered_by} · {elapsedStr} ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-ds-text-muted">Findings: <span className="text-ds-text-primary font-bold">{scan.findings_count}</span></span>
            <span className="text-ds-text-muted">Patches: <span className="text-ds-accent-green font-bold">{scan.patches_count}</span></span>
          </div>
        </div>
        <AgentFlowVisualizer currentAgent={scan.current_agent || 'queued'} status={scan.status} />
      </motion.div>
    </Link>
  );
}

// ── Stat Cards ──────────────────────────────────────────────────────────────

function Sparkline({ data, colorClass }: { data: number[], colorClass: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / (max - min || 1)) * 100}`).join(' ');
  let strokeColor = '#00E5FF';
  if (colorClass.includes('red')) strokeColor = '#FF3B5C';
  if (colorClass.includes('green')) strokeColor = '#00FF88';
  return (
    <svg className="w-16 h-8" viewBox="0 -10 100 120" preserveAspectRatio="none">
      <polyline fill="none" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  const [activeScans, setActiveScans] = useState<ScanData[]>([]);
  const [triggerUrl, setTriggerUrl] = useState('');
  const [triggering, setTriggering] = useState(false);

  // Poll for active scans
  const fetchScans = useCallback(async () => {
    try {
      // Fetch recent scans from Supabase via a simple client query
      const res = await fetch('/api/scan/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setActiveScans(data);
      }
    } catch { /* polling failure is ok */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchScans();
    const interval = setInterval(fetchScans, 3000);
    return () => clearInterval(interval);
  }, [fetchScans]);

  const handleTriggerScan = async () => {
    if (!triggerUrl.trim()) return;
    setTriggering(true);
    try {
      const res = await fetch('/api/scan/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: triggerUrl.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTriggerUrl('');
        // Immediately poll
        setTimeout(fetchScans, 500);
      }
    } catch (err) {
      console.error('Trigger failed:', err);
    } finally {
      setTriggering(false);
    }
  };

  if (!mounted) return null;

  const mockStats = [
    { name: 'Total Scans', value: String(activeScans.length || 0), change: '+', icon: Shield, color: 'text-ds-accent-cyan', spark: [10, 25, 15, 40, 35, 60] },
    { name: 'Critical Issues', value: String(activeScans.reduce((s, sc) => s + (sc.findings_count || 0), 0)), change: '-', icon: AlertTriangle, color: 'text-ds-red', spark: [30, 20, 15, 10, 5, 3] },
    { name: 'Patches Applied', value: String(activeScans.reduce((s, sc) => s + (sc.patches_count || 0), 0)), change: '+', icon: Wrench, color: 'text-ds-accent-green', spark: [20, 30, 45, 60, 55, 80] },
    { name: 'Security Score', value: '—', change: '+', icon: Activity, color: 'text-ds-accent-cyan', spark: [80, 85, 82, 90, 88, 94] },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-syne text-ds-text-primary tracking-wide">Command Center</h1>
        <p className="mt-2 text-ds-text-secondary font-mono text-sm">DevSentinel AI autonomous security operations dashboard.</p>
      </div>

      {/* Manual Trigger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-ds-bg-card rounded-xl p-5 border border-ds-border mb-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-3">
          <Zap className="h-5 w-5 text-ds-accent-cyan" />
          <h3 className="font-bold font-syne text-ds-text-primary text-sm tracking-wide">Trigger New Scan</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={triggerUrl}
            onChange={(e) => setTriggerUrl(e.target.value)}
            placeholder="https://github.com/owner/repo.git"
            className="flex-1 px-4 py-2.5 bg-ds-bg-deep border border-ds-border rounded-lg text-sm font-mono text-ds-text-primary placeholder:text-ds-text-muted focus:border-ds-accent-cyan focus:outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTriggerScan}
            disabled={triggering || !triggerUrl.trim()}
            className="inline-flex items-center px-5 py-2.5 bg-ds-accent-cyan text-black font-bold font-syne text-sm tracking-wide rounded-lg shadow-[0_0_12px_rgba(0,229,255,0.2)] hover:bg-[#00c9e0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {triggering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {triggering ? 'Cloning...' : 'Scan'}
          </motion.button>
        </div>
      </motion.div>

      {/* Active Scans Panel */}
      {activeScans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h3 className="text-lg font-bold font-syne text-ds-text-primary mb-4 flex items-center">
            <Activity className="h-5 w-5 text-ds-accent-cyan mr-2" />
            Active Scans
          </h3>
          <div className="space-y-4">
            {activeScans.map((scan) => (
              <ActiveScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {mockStats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
            key={stat.name} 
            className="bg-ds-bg-card rounded-xl p-6 border border-ds-border relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-ds-accent-cyan via-ds-accent-cyan to-transparent opacity-80" />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-ds-bg-surface border border-ds-border ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <Sparkline data={stat.spark} colorClass={stat.color} />
            </div>
            <div>
              <p className="text-sm font-medium text-ds-text-muted mb-1">{stat.name}</p>
              <span className="text-4xl font-bold font-syne text-ds-text-primary">{stat.value}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Scans Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-ds-bg-card rounded-xl border border-ds-border overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-ds-border flex justify-between items-center bg-ds-bg-surface/50">
          <h3 className="text-lg font-bold font-syne text-ds-text-primary flex items-center">
            <Activity className="h-5 w-5 text-ds-accent-cyan mr-2" />
            Pipeline Execution Log
          </h3>
          <Link href="/scan-results" className="text-sm text-ds-accent-cyan hover:text-white transition-colors flex items-center font-semibold">
            <span>View All</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ds-bg-surface border-b border-ds-border text-xs uppercase tracking-widest text-ds-text-muted font-semibold">
                <th className="px-6 py-4">Repository</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Findings</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border/50">
              {activeScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ds-text-muted text-sm">
                    No scans yet. Trigger a scan above or push to a webhook-connected repo.
                  </td>
                </tr>
              ) : activeScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-ds-bg-surface/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-ds-bg-deep border border-ds-border flex items-center justify-center mr-3 shadow-inner">
                        <Shield className="h-4 w-4 text-ds-text-secondary" />
                      </div>
                      <span className="font-mono text-sm text-ds-text-primary group-hover:text-ds-accent-cyan transition-colors">
                        {scan.repo_url?.split('/').pop()?.replace('.git', '') || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      scan.status === 'completed' ? 'bg-ds-accent-green/10 text-ds-accent-green border border-ds-accent-green/30' :
                      scan.status === 'failed'    ? 'bg-ds-red/10 text-ds-red border border-ds-red/30' :
                      scan.status === 'running'   ? 'bg-ds-accent-cyan/10 text-ds-accent-cyan border border-ds-accent-cyan/30' :
                                                    'bg-ds-bg-surface text-ds-text-muted border border-ds-border'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-ds-text-secondary">{scan.current_agent || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ds-text-primary">{scan.findings_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/scan-results?scanId=${scan.id}`}>
                      <button className="text-ds-text-secondary hover:text-ds-accent-cyan transition-colors p-2 rounded-md hover:bg-ds-bg-surface">
                        <Eye className="h-4 w-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}