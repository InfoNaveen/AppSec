'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, AlertTriangle, CheckCircle, Play, RotateCcw, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExploitLog {
  id: string;
  timestamp: Date;
  type: string;
  target: string;
  payload: string;
  success: boolean;
  output: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RedTeamTerminalProps {
  projectPath?: string;
  onScanComplete?: (results: any) => void;
}

const RedTeamTerminal: React.FC<RedTeamTerminalProps> = ({ projectPath, onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<ExploitLog[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'results'>('logs');
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const runRedTeamScan = async () => {
    if (!projectPath) {
      console.error('Project path is required to run red team scan');
      return;
    }

    setIsScanning(true);
    setLogs([]);

    try {
      const response = await fetch('/api/red-team-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectPath }),
      });

      if (!response.ok) {
        throw new Error(`Red team scan failed: ${response.statusText}`);
      }

      const results = await response.json();
      
      const newLogs: ExploitLog[] = results.exploits.map((exploit: any) => ({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        type: exploit.exploitType,
        target: exploit.target,
        payload: exploit.payload,
        success: exploit.success,
        output: exploit.output,
        severity: exploit.severity
      }));

      setLogs(newLogs);
      
      if (onScanComplete) {
        onScanComplete(results);
      }
    } catch (error) {
      console.error('Error running red team scan:', error);
      
      setLogs([{
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        type: 'Error',
        target: 'System',
        payload: 'N/A',
        success: false,
        output: `Red team scan failed: ${(error as Error).message}`,
        severity: 'high'
      }]);
    } finally {
      setIsScanning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'text-ds-red';
      case 'medium':
        return 'text-ds-amber';
      case 'low':
        return 'text-ds-accent-cyan';
      default:
        return 'text-ds-text-muted';
    }
  };

  const getSeverityIcon = (success: boolean, severity: string) => {
    if (!success) {
      return <CheckCircle className="w-4 h-4 text-ds-accent-green" />;
    }
    
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-ds-red" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-ds-amber" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-ds-accent-cyan" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-ds-text-muted" />;
    }
  };

  return (
    <div className="bg-ds-bg-deep rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-ds-border overflow-hidden">
      {/* Terminal Header */}
      <div className="bg-ds-bg-surface px-5 py-3 border-b border-ds-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Terminal className="w-5 h-5 text-ds-red" />
          <h3 className="font-bold font-syne text-ds-text-primary tracking-wide">Red-Team Terminal</h3>
          <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-ds-red/10 border border-ds-red/30 text-ds-red rounded-full glow-red whitespace-nowrap">
            OFFENSIVE MODE
          </span>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={runRedTeamScan}
            disabled={isScanning}
            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 text-xs font-bold font-syne uppercase tracking-wider rounded-lg text-black bg-ds-red hover:bg-[#ff1f43] transition-all glow-red disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,59,92,0.3)]"
          >
            {isScanning ? (
              <span className="flex items-center">
                <div className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin mr-1.5" />
                Attacking...
              </span>
            ) : (
              <span className="flex items-center">
                <Crosshair className="w-3.5 h-3.5 mr-1.5" />
                Execute Attack
              </span>
            )}
          </button>
          <button
            onClick={clearLogs}
            className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-ds-border text-xs font-bold rounded-lg text-ds-text-primary bg-ds-bg-card hover:bg-ds-bg-surface transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex border-b border-ds-border/30 bg-ds-bg-card font-syne text-sm font-semibold tracking-wide">
        <button
          className={`flex-1 py-3 px-4 transition-colors ${
            activeTab === 'logs'
              ? 'border-b-2 border-ds-red text-ds-red bg-ds-bg-surface/30 shadow-[inset_0_-10px_20px_-15px_rgba(255,59,92,0.3)]'
              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface/20'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          Active Attack Logs
        </button>
        <button
          className={`flex-1 py-3 px-4 transition-colors ${
            activeTab === 'results'
              ? 'border-b-2 border-ds-red text-ds-red bg-ds-bg-surface/30 shadow-[inset_0_-10px_20px_-15px_rgba(255,59,92,0.3)]'
              : 'text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface/20'
          }`}
          onClick={() => setActiveTab('results')}
        >
          Exploit Report
        </button>
      </div>

      <div className="h-96 overflow-auto font-mono custom-scrollbar p-2" ref={terminalRef}>
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[url('/grid.svg')] bg-center backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <Crosshair className="w-16 h-16 text-ds-red/30 mb-6" />
              <h4 className="text-xl font-bold font-syne text-ds-text-primary mb-3 tracking-wide">Autonomous Exploit Engine</h4>
              <p className="text-ds-text-secondary text-sm mb-4 max-w-md">
                Initialize dynamic payload validations to verify your code against weaponized attack vectors.
              </p>
              <div className="px-4 py-2 rounded-md bg-ds-bg-surface border border-ds-border/50 text-xs text-ds-text-muted max-w-sm">
                This process validates that structural vulnerabilities are genuinely patched and practically non-exploitable by simulating real breaches.
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  key={log.id} 
                  className={`p-4 rounded-xl border relative overflow-hidden ${
                    log.success 
                      ? 'bg-ds-red/5 border-ds-red/20' 
                      : 'bg-ds-accent-green/5 border-ds-accent-green/20'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.success ? 'bg-ds-red' : 'bg-ds-accent-green'}`} />
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5">
                      {getSeverityIcon(log.success, log.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`font-bold tracking-wide uppercase text-xs ${getSeverityStyles(log.severity)}`}>
                            {log.type}
                          </span>
                          {log.success ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-ds-red/20 text-ds-red uppercase tracking-wider">
                              System Compromised
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-ds-accent-green/20 text-ds-accent-green uppercase tracking-wider">
                              Vector Mitigated
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-ds-text-muted">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-ds-text-primary font-mono grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <div className="bg-[#0b101c] py-1.5 px-3 rounded border border-ds-border/30">
                          <span className="text-ds-text-muted mr-2">Target:</span>
                          <span className="text-ds-accent-cyan truncate">{log.target}</span>
                        </div>
                        <div className="bg-[#0b101c] py-1.5 px-3 rounded border border-ds-border/30 overflow-x-auto whitespace-nowrap custom-scrollbar">
                          <span className="text-ds-text-muted mr-2">Payload:</span>
                          <span className="text-ds-amber">{log.payload}</span>
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] text-[#a8b8d0] leading-relaxed p-3 rounded-lg bg-[#0b101c] border border-ds-border/50 overflow-x-auto whitespace-pre-wrap">
                        {log.output || "No output generated by payload execution."}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-ds-bg-surface/50 border-t border-ds-border/50 flex items-center shadow-inner relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ds-red to-transparent animate-[shimmer_2s_infinite]" />
            <div className="w-2 h-2 rounded-full bg-ds-red animate-ping mr-3" />
            <span className="text-xs font-mono text-ds-red">
              Injecting autonomous exploit vectors into system nodes...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RedTeamTerminal;