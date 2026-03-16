'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScan } from '@/components/ScanContext';
import { useRouter } from 'next/navigation';
import {
  Upload as UploadIcon,
  Github,
  FileText,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Zap,
  Activity
} from 'lucide-react';

type ScanPhase = 'idle' | 'fetching' | 'analyzing' | 'patching' | 'reporting' | 'complete';

export default function UploadPage() {
  const router = useRouter();
  const {
    appState,
    setAppState,
    setProjectId,
    setScanResults,
    setPatches,
    setErrorMessage,
    errorMessage
  } = useScan();

  const [file, setFile] = useState<File | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [userStory, setUserStory] = useState('');
  const [projectName, setProjectName] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'zip' | 'github' | 'user_story'>('zip');
  const [isDragging, setIsDragging] = useState(false);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.zip')) {
        setFile(droppedFile);
      }
    }
  };

  const simulateProgress = () => {
    const phases: ScanPhase[] = ['fetching', 'analyzing', 'patching', 'reporting', 'complete'];
    let currentPhaseIndex = 0;

    const interval = setInterval(() => {
      if (currentPhaseIndex < phases.length) {
        setScanPhase(phases[currentPhaseIndex]);
        setProgress((currentPhaseIndex + 1) * 25);
        currentPhaseIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push('/scan-results');
        }, 1000);
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppState('uploading');
    setErrorMessage(null);
    setProgress(0);

    try {
      if (uploadMethod === 'zip' && file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Upload failed');
        }

        setProjectId(uploadData.projectId);
        setAppState('scanning');
        setScanPhase('fetching');
        simulateProgress();

        const scanResponse = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId: uploadData.projectId }),
        });

        const scanData = await scanResponse.json();
        if (!scanResponse.ok || !scanData.success) {
          throw new Error(scanData.error || 'Scan failed');
        }

        setScanResults(scanData.findings);
        setPatches(scanData.patches);
        setAppState('showing-results');
      } else if (uploadMethod === 'github' && repoUrl) {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repoUrl }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Repository clone failed');
        }

        setProjectId(data.projectId);
        setAppState('scanning');
        setScanPhase('fetching');
        simulateProgress();

        const scanResponse = await fetch('/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId: data.projectId }),
        });

        const scanData = await scanResponse.json();
        if (!scanResponse.ok || !scanData.success) {
          throw new Error(scanData.error || 'Scan failed');
        }

        setScanResults(scanData.findings);
        setPatches(scanData.patches);
        setAppState('showing-results');
      } else if (uploadMethod === 'user_story' && userStory && projectName) {
        const formData = new FormData();
        formData.append('userStory', userStory);
        formData.append('projectName', projectName);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'User story upload failed');
        }

        setProjectId(uploadData.projectId);
        setAppState('scanning');
        setScanPhase('fetching');
        simulateProgress();

        const orchestrateResponse = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: uploadData.projectId,
            userStory: userStory
          }),
        });

        const orchestrateData = await orchestrateResponse.json();
        if (!orchestrateResponse.ok || !orchestrateData.success) {
          throw new Error(orchestrateData.error || 'Code generation and scan failed');
        }

        setScanResults(orchestrateData.findings);
        setPatches(orchestrateData.patches);
        setAppState('showing-results');
      }
    } catch (error: any) {
      console.error("Upload/Scan error:", error);
      setErrorMessage(error.message || 'An unexpected error occurred during the scan process.');
      setAppState('error');
    }
  };

  const phaseLabels: Record<ScanPhase, string> = {
    idle: 'Ready to Scan',
    fetching: 'Fetching Repository',
    analyzing: 'Analyzing Code',
    patching: 'Applying Patches',
    reporting: 'Generating Report',
    complete: 'Scan Complete'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-12"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-syne text-ds-text-primary tracking-wide flex items-center mb-3">
          <UploadIcon className="h-8 w-8 text-ds-accent-cyan mr-3" />
          Ingest & Validate
        </h1>
        <p className="text-ds-text-secondary text-lg font-mono">
          Initiate deep learning structural vulnerability audits for modern codebases.
        </p>
      </div>

      <motion.div className="bg-ds-bg-card rounded-2xl border border-ds-border p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Shield className="h-64 w-64 text-ds-accent-cyan" />
        </div>

        {/* Method Toggle */}
        <div className="flex space-x-2 mb-8 p-1.5 bg-ds-bg-surface rounded-xl border border-ds-border/50 relative z-10">
          <button
            type="button"
            onClick={() => setUploadMethod('zip')}
            className={`flex-1 flex justify-center items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${uploadMethod === 'zip'
              ? 'bg-ds-accent-cyan text-black shadow-[0_0_15px_var(--ds-accent-cyan-dim)]'
              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-white/5'
              }`}
          >
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload ZIP
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('github')}
            className={`flex-1 flex justify-center items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${uploadMethod === 'github'
              ? 'bg-ds-accent-cyan text-black shadow-[0_0_15px_var(--ds-accent-cyan-dim)]'
              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-white/5'
              }`}
          >
            <Github className="mr-2 h-4 w-4" />
            GitHub Repo
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('user_story')}
            className={`flex-1 flex justify-center items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${uploadMethod === 'user_story'
              ? 'bg-ds-accent-cyan text-black shadow-[0_0_15px_var(--ds-accent-cyan-dim)]'
              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-white/5'
              }`}
          >
            <FileText className="mr-2 h-4 w-4" />
            User Story
          </button>
        </div>

        {/* Progress Indicator */}
        <AnimatePresence>
          {(appState === 'uploading' || appState === 'scanning') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 relative z-10"
            >
              <div className="space-y-4 p-5 rounded-xl border border-ds-border bg-ds-bg-surface/50 backdrop-blur-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ds-text-secondary font-mono flex items-center">
                    <Activity className="h-4 w-4 text-ds-accent-cyan mr-2 animate-pulse" />
                    {phaseLabels[scanPhase]}
                  </span>
                  <span className="text-ds-accent-cyan font-bold font-syne text-lg">{progress}%</span>
                </div>
                <div className="relative h-2 bg-ds-bg-deep rounded-full overflow-hidden border border-ds-border/50">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-ds-accent-cyan"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs text-ds-text-muted font-mono">
                  <Loader2 className="h-3 w-3 animate-spin text-ds-accent-cyan" />
                  <span>Scanning engine actively inspecting artifact trees...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {appState === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-xl bg-ds-red/10 border border-ds-red/30 p-5 relative z-10 glow-red"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-ds-red flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-ds-red mb-1 font-syne tracking-wide">Operation Aborted</h3>
                  <p className="text-sm text-ds-red/80 font-mono">{errorMessage}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative z-10">
          {uploadMethod === 'user_story' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <label htmlFor="project-name" className="block text-sm font-semibold text-ds-text-secondary mb-2 uppercase tracking-wide">
                  Project Name
                </label>
                <input
                  type="text"
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="E.g., ShieldX Secure Portal"
                  className="block w-full px-4 py-3 bg-ds-bg-deep border border-ds-border rounded-lg focus:outline-none focus:border-ds-accent-cyan text-ds-text-primary placeholder-ds-text-muted transition-colors font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="user-story" className="block text-sm font-semibold text-ds-text-secondary mb-2 uppercase tracking-wide">
                  Architectural Narrative
                </label>
                <textarea
                  id="user-story"
                  value={userStory}
                  onChange={(e) => setUserStory(e.target.value)}
                  placeholder="Describe the application features. ShieldX will scaffold the secure variant structure."
                  rows={8}
                  className="block w-full px-4 py-3 bg-ds-bg-deep border border-ds-border rounded-lg focus:outline-none focus:border-ds-accent-cyan text-ds-text-primary placeholder-ds-text-muted transition-colors resize-none font-mono text-sm"
                  required
                />
                <p className="mt-2 text-xs text-ds-text-muted font-mono">
                  Input user stories to orchestrate AI-generated structurally secure templates.
                </p>
              </div>
            </motion.div>
          ) : uploadMethod === 'zip' ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`relative border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${isDragging
                ? 'border-ds-accent-cyan bg-ds-accent-cyan-dim scale-[1.02] shadow-2xl'
                : 'border-ds-border hover:border-ds-accent-cyan/50 hover:bg-ds-bg-surface'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <motion.div
                animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-ds-accent-cyan opacity-20 blur-2xl rounded-full" />
                  <UploadIcon className="relative h-16 w-16 text-ds-accent-cyan" />
                </div>
                <h3 className="text-xl font-bold font-syne text-ds-text-primary mb-2">
                  {isDragging ? 'Drop Artifact Here' : 'Drag & Drop ZIP Archive'}
                </h3>
                <p className="text-ds-text-muted font-mono text-sm mb-8">
                  Or select index explicitly from local filesystem
                </p>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-8 py-3 bg-ds-accent-cyan text-black font-bold font-syne tracking-wide rounded-lg shadow-[0_0_20px_var(--ds-accent-cyan-dim)] hover:shadow-[0_0_30px_var(--ds-accent-cyan-dim)] hover:bg-[#00c9e0] transition-all cursor-pointer truncate max-w-full"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Select Source Artifact
                </label>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex items-center justify-center space-x-3 text-sm text-ds-accent-cyan bg-ds-bg-surface px-5 py-3 rounded-xl border border-ds-border shadow-inner"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-mono tracking-tight font-medium max-w-[200px] truncate">{file.name}</span>
                    <CheckCircle2 className="h-4 w-4 text-ds-accent-green" />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div>
                <label htmlFor="repo-url" className="block text-sm font-semibold text-ds-text-secondary mb-2 uppercase tracking-wide">
                  Repository URI (HTTPS)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Github className="h-5 w-5 text-ds-text-muted" />
                  </div>
                  <input
                    type="text"
                    id="repo-url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/organization/secure-repo.git"
                    className="block w-full pl-12 pr-4 py-3 bg-ds-bg-deep border border-ds-border rounded-lg focus:outline-none focus:border-ds-accent-cyan text-ds-text-primary placeholder-ds-text-muted transition-colors font-mono text-sm"
                    required
                  />
                  {repoUrl && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                    >
                      <div className="h-2 w-2 bg-ds-accent-green rounded-full glow-green" />
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="bg-ds-bg-surface rounded-xl border border-ds-border p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-ds-accent-cyan glow-cyan" />
                <div className="flex items-start space-x-3 pl-2">
                  <AlertCircle className="h-5 w-5 text-ds-accent-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-ds-text-primary mb-1 tracking-wide">
                      Public Scope Policy
                    </h3>
                    <p className="text-sm text-ds-text-secondary font-mono leading-relaxed mt-1 line-clamp-2 md:line-clamp-none">
                      The current tier handles unauthenticated, open-source repositories exclusively. Private Git structures require explicitly injecting PAT configurations in user settings.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <button
              type="submit"
              disabled={appState === 'uploading' || appState === 'scanning' || (uploadMethod === 'zip' && !file) || (uploadMethod === 'github' && !repoUrl)}
              className="w-full flex items-center justify-center py-4 px-6 bg-ds-accent-cyan text-black font-bold font-syne text-lg tracking-wide rounded-xl shadow-[0_0_20px_var(--ds-accent-cyan-dim)] hover:shadow-[0_0_30px_var(--ds-accent-cyan-dim)] hover:bg-[#00c9e0] disabled:opacity-50 disabled:cursor-not-allowed transition-all group overflow-hidden relative"
            >
              {appState === 'uploading' || appState === 'scanning' ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin text-black/80" />
                  <span>Processing Artifacts...</span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Zap className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform relative z-10" />
                  <span className="relative z-10">Execute Security Scan</span>
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1.5 transition-transform relative z-10" />
                </>
              )}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}
