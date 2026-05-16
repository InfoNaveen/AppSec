'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VulnerabilityTable } from '@/components/VulnerabilityTable';
import {
  Download, Wrench, AlertTriangle, CheckCircle, Shield, TrendingUp,
  FileCode, Activity, Crosshair, ExternalLink, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { staggerContainer, staggerItem, fadeIn } from '@/lib/motion';

interface ScanResultsClientProps {
  initialScanResults: any[];
  initialPatches: any[];
  projectId: string;
  scanData?: any;
  hardeningRecords?: any[];
}

export default function ScanResultsClient({
  initialScanResults,
  initialPatches,
  projectId,
  scanData,
  hardeningRecords = [],
}: ScanResultsClientProps) {
  const scanResults = initialScanResults;
  const patches = initialPatches;

  const [animatedCounts, setAnimatedCounts] = useState({
    critical: 0, high: 0, medium: 0, low: 0, patches: 0
  });

  const criticalIssues = scanResults.filter(f => f.severity === 'critical').length;
  const highIssues = scanResults.filter(f => f.severity === 'high').length;
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
          current = end; clearInterval(timer);
        }
        callback(Math.floor(current));
      }, interval);
    };
    animateValue(0, criticalIssues, (val) => setAnimatedCounts(prev => ({ ...prev, critical: val })));
    animateValue(0, highIssues, (val) => setAnimatedCounts(prev => ({ ...prev, high: val })));
    animateValue(0, mediumIssues, (val) => setAnimatedCounts(prev => ({ ...prev, medium: val })));
    animateValue(0, lowIssues, (val) => setAnimatedCounts(prev => ({ ...prev, low: val })));
    animateValue(0, totalPatches, (val) => setAnimatedCounts(prev => ({ ...prev, patches: val })));
  }, [criticalIssues, highIssues, mediumIssues, lowIssues, totalPatches]);

  const totalIssues = criticalIssues + highIssues + mediumIssues + lowIssues;
  const critHighPercent = totalIssues > 0 ? ((criticalIssues + highIssues) / totalIssues) * 100 : 0;
  const mediumPercent = totalIssues > 0 ? (mediumIssues / totalIssues) * 100 : 0;
  const lowPercent = totalIssues > 0 ? (lowIssues / totalIssues) * 100 : 0;

  // Findings with exploitability rationale (from triage)
  const triagedFindings = scanResults.filter((f: any) => f.exploitabilityRationale);

  // Findings that have a corresponding patch
  const patchedFindingIds = new Set(patches.map((p: any) => p.findingId).filter(Boolean));

  const statCards = [
    { title: "Critical", count: animatedCounts.critical, color: "text-ds-red", borderClass: "border-ds-red/50", glow: "glow-red" },
    { title: "High", count: animatedCounts.high, color: "text-ds-amber", borderClass: "border-ds-amber/50", glow: "glow-yellow" },
    { title: "Medium", count: animatedCounts.medium, color: "text-[#00A8CC]", borderClass: "border-[#00A8CC]/50", glow: "glow-blue" },
    { title: "Low", count: animatedCounts.low, color: "text-ds-accent-green", borderClass: "border-ds-accent-green/50", glow: "glow-green" },
    { title: "Auto-Patches", count: animatedCounts.patches, color: "text-ds-accent-cyan", borderClass: "border-ds-accent-cyan/50", glow: "glow-cyan", isPatch: true },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto pb-12">
      <motion.div variants={staggerItem} className="mb-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold font-syne text-ds-text-primary tracking-wide mb-2 flex items-center">
              <Shield className="h-8 w-8 text-ds-accent-cyan mr-3" />
              Intelligence Report
            </h1>
            <p className="text-ds-text-secondary font-mono text-sm">
              {scanData?.repo_url ? `Repository: ${scanData.repo_url.split('/').pop()?.replace('.git', '')}` : 'Comprehensive vulnerability assessment'}
              {scanData?.language ? ` · ${scanData.language}` : ''}
            </p>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <Link href={`/patches?scanId=${projectId}`} className="flex-1 md:flex-none">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-full inline-flex justify-center items-center px-5 py-2.5 bg-ds-bg-surface border border-ds-border text-ds-text-primary font-bold font-syne tracking-wide rounded-lg hover:bg-ds-border/50 transition-all shadow-lg">
                <Wrench className="mr-2 h-4 w-4 text-ds-accent-cyan" />
                Review Patches
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {scanResults.length > 0 ? (
        <>
          {/* Summary Cards */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {statCards.map((card, idx) => (
              <motion.div key={idx}
                className={`bg-ds-bg-card rounded-xl p-5 border-t-[3px] shadow-lg relative overflow-hidden group ${card.borderClass}`}>
                <div className="relative z-10">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-ds-text-muted mb-1">{card.title}</p>
                  <p className={`text-4xl font-bold font-syne ${card.color} ${card.glow}`}>{card.count}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Risk Vector + Distribution */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-ds-bg-card rounded-xl border border-ds-border p-6 shadow-xl">
              <h3 className="text-xl font-bold font-syne text-ds-text-primary mb-6 flex items-center tracking-wide">
                <Activity className="mr-3 h-5 w-5 text-ds-accent-cyan" />
                Risk Vector Topology
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'CRITICAL + HIGH', count: criticalIssues + highIssues, pct: critHighPercent, color: 'bg-ds-red', glow: 'glow-red', textColor: 'text-ds-red' },
                  { label: 'MODERATE IMPACT', count: mediumIssues, pct: mediumPercent, color: 'bg-[#00A8CC]', glow: 'glow-blue', textColor: 'text-[#00A8CC]' },
                  { label: 'LOW IMPACT', count: lowIssues, pct: lowPercent, color: 'bg-ds-accent-green', glow: 'glow-green', textColor: 'text-ds-accent-green' },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold tracking-wide uppercase text-ds-text-secondary">{bar.label}</span>
                      <span className={`text-lg font-bold font-syne ${bar.textColor}`}>{bar.count}</span>
                    </div>
                    <div className="relative h-2 bg-ds-bg-surface rounded-full overflow-hidden border border-ds-border/50">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`absolute inset-y-0 left-0 ${bar.color} ${bar.glow}`} />
                    </div>
                  </div>
                ))}
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
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#FF3B5C" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - critHighPercent / 100) }}
                        transition={{ duration: 1 }} style={{ filter: 'drop-shadow(0 0 4px rgba(255,59,92,0.5))' }} />
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#00A8CC" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (critHighPercent + mediumPercent) / 100) }}
                        transition={{ duration: 1, delay: 0.2 }} style={{ filter: 'drop-shadow(0 0 4px rgba(0,168,204,0.5))' }} />
                      <motion.circle cx="50" cy="50" r="40" fill="none" stroke="#00FF88" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (critHighPercent + mediumPercent + lowPercent) / 100) }}
                        transition={{ duration: 1, delay: 0.4 }} style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.5))' }} />
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

          {/* Severity Triage Section (replaces RedTeamTerminal) */}
          {triagedFindings.length > 0 && (
            <motion.div variants={staggerItem} className="mb-10">
              <div className="bg-ds-bg-card rounded-xl border border-ds-border overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-ds-border bg-ds-bg-surface/50 flex items-center">
                  <Crosshair className="h-5 w-5 text-ds-accent-cyan mr-3" />
                  <h3 className="text-lg font-bold font-syne text-ds-text-primary tracking-wide">Severity Triage — LLM Exploitability Analysis</h3>
                </div>
                <div className="divide-y divide-ds-border/30">
                  {triagedFindings.slice(0, 15).map((finding: any, idx: number) => (
                    <div key={idx} className="px-6 py-4 hover:bg-ds-bg-surface/20 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              finding.severity === 'critical' ? 'bg-ds-red/15 text-ds-red border border-ds-red/30' :
                              finding.severity === 'high'     ? 'bg-ds-amber/15 text-ds-amber border border-ds-amber/30' :
                              finding.severity === 'medium'   ? 'bg-[#00A8CC]/15 text-[#00A8CC] border border-[#00A8CC]/30' :
                                                                'bg-ds-accent-green/15 text-ds-accent-green border border-ds-accent-green/30'
                            }`}>{finding.severity}</span>
                            <span className="font-mono text-xs text-ds-text-secondary truncate">{finding.file}:{finding.line}</span>
                            {patchedFindingIds.has(finding.id) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-ds-accent-green/15 text-ds-accent-green border border-ds-accent-green/30">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" /> PATCHED
                              </span>
                            )}
                            {finding.cveId && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-ds-bg-surface text-ds-text-muted border border-ds-border">
                                {finding.cveId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-ds-text-primary mb-1">{finding.description}</p>
                          <p className="text-xs text-ds-text-muted italic">
                            <Crosshair className="h-3 w-3 inline mr-1 text-ds-accent-cyan" />
                            {finding.exploitabilityRationale}
                          </p>
                          {finding.advisoryUrl && (
                            <a href={finding.advisoryUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center text-xs text-ds-accent-cyan hover:underline mt-1">
                              <ExternalLink className="h-3 w-3 mr-1" /> Advisory
                            </a>
                          )}
                        </div>
                        {finding.confidence && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-ds-text-muted">Confidence</div>
                            <div className={`text-sm font-bold font-syne ${
                              finding.confidence >= 0.7 ? 'text-ds-red' :
                              finding.confidence >= 0.4 ? 'text-ds-amber' : 'text-ds-text-muted'
                            }`}>{Math.round(finding.confidence * 100)}%</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Hardening Applied Section */}
          {hardeningRecords.length > 0 && (
            <motion.div variants={staggerItem} className="mb-10">
              <div className="bg-ds-bg-card rounded-xl border border-ds-border overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-ds-border bg-ds-bg-surface/50 flex items-center">
                  <ShieldCheck className="h-5 w-5 text-ds-accent-green mr-3" />
                  <h3 className="text-lg font-bold font-syne text-ds-text-primary tracking-wide">Security Hardening Applied</h3>
                </div>
                <div className="p-6 space-y-3">
                  {hardeningRecords.map((record: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-ds-accent-green/5 border border-ds-accent-green/20">
                      <CheckCircle className="h-4 w-4 text-ds-accent-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-ds-text-primary">{record.hardening_type}</p>
                        {record.description && <p className="text-xs text-ds-text-secondary mt-0.5">{record.description}</p>}
                        {record.file_path && <p className="text-xs font-mono text-ds-text-muted mt-0.5">{record.file_path}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div variants={fadeIn}
          className="bg-ds-bg-card rounded-2xl border border-ds-border overflow-hidden text-center py-24 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-ds-accent-green/5 to-transparent pointer-events-none" />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 rounded-full bg-ds-accent-green/10 flex items-center justify-center mb-6 border border-ds-accent-green/30 glow-green shadow-[0_0_30px_var(--ds-accent-green-dim)]">
            <CheckCircle className="h-10 w-10 text-ds-accent-green" />
          </motion.div>
          <h3 className="text-2xl font-bold font-syne text-ds-text-primary mb-3 tracking-wide">Zero Vulnerabilities Detected</h3>
          <p className="text-ds-text-secondary font-mono mb-8 max-w-md mx-auto">
            Deep structural analysis resolved completely. Project conforms to security standards.
          </p>
          <Link href="/upload">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-8 py-3 bg-ds-accent-cyan text-black font-bold font-syne tracking-wide rounded-lg shadow-[0_0_15px_var(--ds-accent-cyan-dim)] hover:bg-[#00c9e0] transition-all">
              Analyze Novel Repository
            </motion.button>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
