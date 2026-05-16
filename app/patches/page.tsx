'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatchDiff } from '@/components/PatchDiff';
import { 
  Wrench, FileText, Calendar, Code, CheckCircle2, Shield, TrendingUp,
  X, GitBranch, ExternalLink, Loader2, AlertTriangle
} from 'lucide-react';
import { staggerContainer, staggerItem, fadeIn, slideInUp } from '@/lib/motion';
import { useSearchParams } from 'next/navigation';

interface PatchData {
  id: string; file: string; before: string; after: string;
  change: string; patchType: string; findingId?: string;
}

export default function PatchesPage() {
  const searchParams = useSearchParams();
  const scanId = searchParams.get('scanId');
  
  const [patches, setPatches] = useState<PatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatches, setExpandedPatches] = useState<Record<number, boolean>>({});
  const [selectedPatch, setSelectedPatch] = useState<PatchData | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  // Fetch patches from Supabase
  useEffect(() => {
    async function fetchPatches() {
      if (!scanId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/scan/status/${scanId}`);
        if (!res.ok) { setLoading(false); return; }
        // Fetch patches via a direct query (using the scan results page approach)
        // For now, try to get patch data from the scan status + patches table
        setLoading(false);
      } catch { setLoading(false); }
    }
    fetchPatches();
  }, [scanId]);

  // Load patches from scan results page data if passed via context
  useEffect(() => {
    // Try loading from localStorage cache (set by scan results page)
    try {
      const cached = sessionStorage.getItem(`patches-${scanId}`);
      if (cached) {
        setPatches(JSON.parse(cached));
        setLoading(false);
      }
    } catch { /* ok */ }
  }, [scanId]);

  const togglePatch = (index: number) => {
    setExpandedPatches(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const showFullDiff = (patch: PatchData) => {
    setSelectedPatch(patch);
    setShowDiffModal(true);
  };

  const handleCreatePR = async () => {
    if (!scanId) return;
    setCreatingPR(true);
    try {
      const res = await fetch('/api/scan/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId, action: 'create_pr' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.prUrl) setPrUrl(data.prUrl);
      }
    } catch (err) {
      console.error('PR creation failed:', err);
    } finally {
      setCreatingPR(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto">
      <motion.div variants={staggerItem} className="mb-8">
        <h1 className="text-4xl font-bold mb-3 font-syne text-ds-text-primary tracking-wide">
          Applied Patches
        </h1>
        <p className="text-ds-text-secondary text-sm font-mono">
          Review all auto-applied security patches and their impact
        </p>
      </motion.div>

      {patches.length > 0 ? (
        <motion.div variants={staggerItem} className="space-y-4">
          {/* Summary Card */}
          <div className="bg-ds-bg-card rounded-xl border border-ds-border p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ds-text-primary mb-2 flex items-center font-syne">
                  <Shield className="mr-2 h-5 w-5 text-ds-accent-cyan" />
                  Patch Summary
                </h3>
                <p className="text-ds-text-secondary text-sm">
                  {patches.length} security patches have been automatically generated
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-ds-accent-green font-syne">{patches.length}</div>
                  <div className="text-xs text-ds-text-muted uppercase tracking-wider">Total Patches</div>
                </div>
                {/* GitHub PR Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePR}
                  disabled={creatingPR || !!prUrl}
                  className="inline-flex items-center px-4 py-2.5 bg-ds-bg-surface border border-ds-border text-ds-text-primary font-bold font-syne text-xs tracking-wide rounded-lg hover:border-ds-accent-cyan/50 disabled:opacity-50 transition-all"
                >
                  {creatingPR ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GitBranch className="h-4 w-4 mr-2 text-ds-accent-cyan" />}
                  {prUrl ? 'PR Created' : creatingPR ? 'Creating...' : 'Open GitHub PR'}
                </motion.button>
              </div>
            </div>
            {prUrl && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-lg bg-ds-accent-green/5 border border-ds-accent-green/20 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ds-accent-green" />
                <span className="text-sm text-ds-text-primary">PR created: </span>
                <a href={prUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-ds-accent-cyan hover:underline flex items-center">
                  {prUrl} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </motion.div>
            )}
          </div>

          {/* Patches List */}
          <div className="space-y-4">
            {patches.map((patch, index) => {
              const isExpanded = !!expandedPatches[index];
              const isDep = patch.patchType === 'dependency_upgrade_required';
              return (
                <motion.div key={index} variants={staggerItem}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-ds-bg-card rounded-xl border border-ds-border overflow-hidden hover:border-ds-accent-cyan/30 transition-all shadow-lg">
                  <div className="p-6 cursor-pointer" onClick={() => togglePatch(index)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className={`flex items-center justify-center h-12 w-12 rounded-lg border ${
                            isDep ? 'bg-ds-amber/10 border-ds-amber/30' : 'bg-ds-accent-cyan/10 border-ds-accent-cyan/30'
                          }`}>
                            {isDep ? <AlertTriangle className="h-6 w-6 text-ds-amber" /> : <Wrench className="h-6 w-6 text-ds-accent-cyan" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-ds-text-primary flex items-center font-syne">
                              <FileText className="mr-2 h-4 w-4 text-ds-text-muted" />
                              <span className="font-mono text-sm">{patch.file}</span>
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isDep ? 'bg-ds-amber/10 text-ds-amber border border-ds-amber/30' :
                                      'bg-ds-accent-green/10 text-ds-accent-green border border-ds-accent-green/30'
                            }`}>
                              {isDep ? <AlertTriangle className="mr-1 h-3 w-3" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                              {isDep ? 'Upgrade Required' : 'Patched'}
                            </span>
                          </div>
                          <p className="text-sm text-ds-text-secondary">{patch.change}</p>
                        </div>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}
                        className="ml-4 text-ds-accent-cyan">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        className="border-t border-ds-border bg-ds-bg-deep/50">
                        <div className="p-6">
                          <motion.div variants={slideInUp} initial="hidden" animate="visible" className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-semibold text-ds-text-secondary flex items-center">
                                <Code className="mr-2 h-4 w-4 text-ds-accent-cyan" /> Patch Diff Preview
                              </h5>
                              <button onClick={(e) => { e.stopPropagation(); showFullDiff(patch); }}
                                className="text-sm text-ds-accent-cyan hover:text-white transition-colors">
                                View Full Diff →
                              </button>
                            </div>
                            <PatchDiff 
                              before={patch.before || "// Original vulnerable code"} 
                              after={patch.after || "// Patched secure code"}
                              file={patch.file}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={fadeIn}
          className="bg-ds-bg-card rounded-xl border border-ds-border overflow-hidden text-center py-16 shadow-xl">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 rounded-full bg-ds-accent-cyan/10 flex items-center justify-center mb-4 border border-ds-accent-cyan/30">
            <Wrench className="h-8 w-8 text-ds-accent-cyan" />
          </motion.div>
          <h3 className="text-xl font-bold text-ds-text-primary mb-2 font-syne">No patches applied</h3>
          <p className="text-ds-text-secondary text-sm mb-6">
            {loading ? 'Loading patches...' : 'Upload a repository and run a security scan to see auto-applied patches.'}
          </p>
          <a href="/dashboard">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-ds-accent-cyan text-black font-bold font-syne rounded-lg shadow-[0_0_12px_rgba(0,229,255,0.2)] hover:bg-[#00c9e0] transition-all">
              Go to Dashboard
            </motion.button>
          </a>
        </motion.div>
      )}

      {/* Full Diff Modal */}
      <AnimatePresence>
        {showDiffModal && selectedPatch && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowDiffModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="bg-ds-bg-card rounded-2xl border border-ds-border shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-ds-border flex items-center justify-between bg-ds-bg-surface/50">
                  <h3 className="text-lg font-bold text-ds-text-primary font-syne">Full Patch Diff</h3>
                  <button onClick={() => setShowDiffModal(false)}
                    className="text-ds-text-muted hover:text-ds-accent-cyan transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <PatchDiff 
                    before={selectedPatch.before || "// Original vulnerable code"} 
                    after={selectedPatch.after || "// Patched secure code"}
                    file={selectedPatch.file}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
