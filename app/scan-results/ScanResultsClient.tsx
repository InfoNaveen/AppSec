'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScan } from '@/components/ScanContext';
import { VulnerabilityTable } from '@/components/VulnerabilityTable';
import RedTeamTerminal from '@/components/RedTeamTerminal';
import {
  Download,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Shield,
  TrendingUp,
  FileCode,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { staggerContainer, staggerItem, fadeIn } from '@/lib/motion';

interface ScanResultsClientProps {
  initialScanResults: any[];
  initialPatches: any[];
  projectId: string;
}

export default function ScanResultsClient({ initialScanResults, initialPatches, projectId }: ScanResultsClientProps) {
  const { scanResults: contextScans } = useScan();
  const scanResults = initialScanResults.length > 0 ? initialScanResults : contextScans;
  const patches = initialPatches;

  const [animatedCounts, setAnimatedCounts] = useState({
    critical: 0,
    medium: 0,
    low: 0,
    patches: 0
  });

  const criticalIssues = scanResults.filter(f => f.severity === 'high' || f.severity === 'critical').length;
  const mediumIssues = scanResults.filter(f => f.severity === 'medium').length;
  const lowIssues = scanResults.filter(f => f.severity === 'low').length;
  const totalPatches = patches.length;

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;

    const animateValue = (start: number, end: number, callback: (val: number) => void) => {
      let current = start;
      const increment = (end - start) / steps;
      const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
          current = end;
          clearInterval(timer);
        }
        callback(Math.floor(current));
      }, interval);
    };

    animateValue(0, criticalIssues, (val) => setAnimatedCounts(prev => ({ ...prev, critical: val })));
    animateValue(0, mediumIssues, (val) => setAnimatedCounts(prev => ({ ...prev, medium: val })));
    animateValue(0, lowIssues, (val) => setAnimatedCounts(prev => ({ ...prev, low: val })));
    animateValue(0, totalPatches, (val) => setAnimatedCounts(prev => ({ ...prev, patches: val })));
  }, [criticalIssues, mediumIssues, lowIssues, totalPatches]);

  const totalIssues = criticalIssues + mediumIssues + lowIssues;
  const criticalPercent = totalIssues > 0 ? (criticalIssues / totalIssues) * 100 : 0;
  const mediumPercent = totalIssues > 0 ? (mediumIssues / totalIssues) * 100 : 0;
  const lowPercent = totalIssues > 0 ? (lowIssues / totalIssues) * 100 : 0;

  const handleExport = async () => {
    if (!projectId) return;

    try {
      const response = await fetch('/api/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, export: true }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'patched-code.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const statCards = [
    { title: "Critical Issues", count: animatedCounts.critical, severity: "critical", color: "text-ds-red", borderClass: "border-ds-red/50", glow: "glow-red" },
    { title: "Medium Issues", count: animatedCounts.medium, severity: "medium", color: "text-[#00A8CC]", borderClass: "border-[#00A8CC]/50", glow: "glow-blue" },
    { title: "Low Issues", count: animatedCounts.low, severity: "low", color: "text-ds-accent-green", borderClass: "border-ds-accent-green/50", glow: "glow-green" },
    { title: "Auto-Patches", count: animatedCounts.patches, severity: "patch", color: "text-ds-accent-cyan", borderClass: "border-ds-accent-cyan/50", glow: "glow-cyan", isPatch: true }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-7xl mx-auto pb-12"
    >
      <motion.div variants={staggerItem} className="mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-syne text-ds-text-primary tracking-wide mb-2 flex items-center">
              <Shield className="h-8 w-8 text-ds-accent-cyan mr-3" />
              Intelligence Report
            </h1>
            <p className="text-ds-text-secondary font-mono text-sm">
              Comprehensive structural analysis & automated vulnerability assessment.
            </p>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={!projectId}
              className="flex-1 md:flex-none inline-flex justify-center items-center px-5 py-2.5 bg-ds-accent-cyan text-black font-bold font-syne tracking-wide rounded-lg shadow-[0_0_15px_var(--ds-accent-cyan-dim)] hover:bg-[#00c9e0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Architecture
            </motion.button>
            <Link href={`/patches?scanId=${projectId}`} className="flex-1 md:flex-none">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full inline-flex justify-center items-center px-5 py-2.5 bg-ds-bg-surface border border-ds-border text-ds-text-primary font-bold font-syne tracking-wide rounded-lg hover:bg-ds-border/50 transition-all shadow-lg"
              >
                <Wrench className="mr-2 h-4 w-4 text-ds-accent-cyan" />
                Review Patches
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {scanResults.length > 0 ? (
        <>
          {/* Summary Cards directly matched to ShieldX specific tokens */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statCards.map((card, idx) => (
              <motion.div 
                key={idx}
                className={`bg-ds-bg-card rounded-xl p-6 border-t-[3px] shadow-lg relative overflow-hidden group ${card.borderClass}`}
              >
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${card.color}`}>
                  {card.isPatch ? <CheckCircle className="h-20 w-20" /> : <AlertTriangle className="h-20 w-20" />}
                </div>
                <div className="flex items-center relative z-10 mb-4">
                  <div className={`p-2.5 rounded-lg bg-ds-bg-surface border border-ds-border shadow-inner`}>
                    {card.isPatch ? <CheckCircle className={`h-5 w-5 ${card.color} ${card.glow}`} /> : <AlertTriangle className={`h-5 w-5 ${card.color} ${card.glow}`} />}
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-xs uppercase font-bold tracking-widest text-ds-text-muted mb-1">{card.title}</p>
                  <p className={`text-5xl font-bold font-syne ${card.color} ${card.glow}`}>{card.count}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Severity Heatmap & Distribution */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-ds-bg-card rounded-xl border border-ds-border p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <TrendingUp className="h-32 w-32 text-ds-text-muted" />
              </div>
              <h3 className="text-xl font-bold font-syne text-ds-text-primary mb-6 flex items-center tracking-wide">
                <Activity className="mr-3 h-5 w-5 text-ds-accent-cyan" />
                Risk Vector Topology
              </h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold tracking-wide uppercase text-ds-text-secondary">CRITICAL IMPACT</span>
                    <span className="text-lg font-bold font-syne text-ds-red">{criticalIssues}</span>
                  </div>
                  <div className="relative h-2 bg-ds-bg-surface rounded-full overflow-hidden border border-ds-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${criticalPercent}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="absolute inset-y-0 left-0 bg-ds-red glow-red"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold tracking-wide uppercase text-ds-text-secondary">MODERATE IMPACT</span>
                    <span className="text-lg font-bold font-syne text-[#00A8CC]">{mediumIssues}</span>
                  </div>
                  <div className="relative h-2 bg-ds-bg-surface rounded-full overflow-hidden border border-ds-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mediumPercent}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="absolute inset-y-0 left-0 bg-[#00A8CC] glow-blue"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold tracking-wide uppercase text-ds-text-secondary">LOW IMPACT</span>
                    <span className="text-lg font-bold font-syne text-ds-accent-green">{lowIssues}</span>
                  </div>
                  <div className="relative h-2 bg-ds-bg-surface rounded-full overflow-hidden border border-ds-border/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${lowPercent}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="absolute inset-y-0 left-0 bg-ds-accent-green glow-green"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-ds-bg-card rounded-xl border border-ds-border p-6 shadow-xl flex flex-col justify-center">
              <h3 className="text-lg font-bold font-syne text-ds-text-primary mb-4 flex items-center tracking-wide">
                <Shield className="mr-2 h-5 w-5 text-ds-accent-cyan" />
                Distribution
              </h3>
              <div className="relative w-full aspect-square flex items-center justify-center -my-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--ds-bg-surface)" strokeWidth="8" />
                  {totalIssues > 0 && (
                    <>
                      <motion.circle
                        cx="50" cy="50" r="40" fill="none" stroke="#FF3B5C" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - criticalPercent / 100)}`}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(255, 59, 92, 0.5))' }}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - criticalPercent / 100) }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                      <motion.circle
                        cx="50" cy="50" r="40" fill="none" stroke="#00A8CC" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (criticalPercent + mediumPercent) / 100)}`}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0, 168, 204, 0.5))' }}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (criticalPercent + mediumPercent) / 100) }}
                        transition={{ duration: 1, delay: 0.4 }}
                      />
                      <motion.circle
                        cx="50" cy="50" r="40" fill="none" stroke="#00FF88" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (criticalPercent + mediumPercent + lowPercent) / 100)}`}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0, 255, 136, 0.5))' }}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (criticalPercent + mediumPercent + lowPercent) / 100) }}
                        transition={{ duration: 1, delay: 0.6 }}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold font-syne text-ds-text-primary">{totalIssues}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-ds-text-muted mt-1">Total Hits</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Vulnerability Table */}
          <motion.div variants={staggerItem} className="mb-10">
            <div className="mb-4">
              <h3 className="text-xl font-bold font-syne text-ds-text-primary flex items-center tracking-wide">
                <FileCode className="mr-3 h-6 w-6 text-ds-accent-cyan" />
                Vulnerability Ledger
              </h3>
            </div>
            <VulnerabilityTable findings={scanResults} patches={patches} />
          </motion.div>

          {/* Red Team Terminal */}
          <motion.div variants={staggerItem} className="mt-8">
            <RedTeamTerminal projectPath={projectId} />
          </motion.div>
        </>
      ) : (
        <motion.div
          variants={fadeIn}
          className="bg-ds-bg-card rounded-2xl border border-ds-border overflow-hidden text-center py-24 shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ds-accent-green/5 to-transparent pointer-events-none" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-ds-accent-green/10 flex items-center justify-center mb-6 border border-ds-accent-green/30 glow-green shadow-[0_0_30px_var(--ds-accent-green-dim)]"
          >
            <CheckCircle className="h-10 w-10 text-ds-accent-green" />
          </motion.div>
          <h3 className="text-2xl font-bold font-syne text-ds-text-primary mb-3 tracking-wide">Zero Vulnerabilities Detected</h3>
          <p className="text-ds-text-secondary font-mono mb-8 max-w-md mx-auto">
            Deep structural analysis resolved completely. Project topology conforms to security matrix standards safely.
          </p>
          <Link href="/upload">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-3 bg-ds-accent-cyan text-black font-bold font-syne tracking-wide rounded-lg shadow-[0_0_15px_var(--ds-accent-cyan-dim)] hover:shadow-[0_0_25px_var(--ds-accent-cyan-dim)] hover:bg-[#00c9e0] transition-all"
            >
              Analyze Novel Repository
            </motion.button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
