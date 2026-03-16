'use client';

import { 
  Shield, AlertTriangle, Wrench, Activity, CheckCircle2, AlertCircle, Eye, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Hardcoded mock data strictly for display based on redesign requirements
const mockStats = [
  { name: 'Total Scans', value: '1,248', change: '+12%', icon: Shield, color: 'text-ds-accent-cyan', spark: [10, 25, 15, 40, 35, 60] },
  { name: 'Critical Issues', value: '3', change: '-4', icon: AlertTriangle, color: 'text-ds-red', spark: [30, 20, 15, 10, 5, 3] },
  { name: 'Patches Applied', value: '412', change: '+28%', icon: Wrench, color: 'text-ds-accent-green', spark: [20, 30, 45, 60, 55, 80] },
  { name: 'Security Score', value: '94/100', change: '+2', icon: Activity, color: 'text-ds-accent-cyan', spark: [80, 85, 82, 90, 88, 94] },
];

const mockRecentScans = [
  { id: '1', project: 'auth-service', date: '2 mins ago', status: 'Completed', critical: 1, high: 2, medium: 4, low: 12 },
  { id: '2', project: 'payment-gateway', date: '1 hour ago', status: 'Completed', critical: 0, high: 1, medium: 2, low: 8 },
  { id: '3', project: 'user-portal-ui', date: '3 hours ago', status: 'Completed', critical: 0, high: 0, medium: 5, low: 15 },
  { id: '4', project: 'legacy-api-v1', date: 'Yesterday', status: 'Completed', critical: 2, high: 5, medium: 10, low: 22 },
];

function Sparkline({ data, colorClass }: { data: number[], colorClass: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d - min) / (max - min)) * 100}`).join(' ');
  
  // Extract explicit color for stroke based on class
  let strokeColor = '#00E5FF';
  if (colorClass.includes('red')) strokeColor = '#FF3B5C';
  if (colorClass.includes('green')) strokeColor = '#00FF88';

  return (
    <svg className="w-16 h-8" viewBox="0 -10 100 120" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold font-syne text-ds-text-primary tracking-wide">Command Center</h1>
        <p className="mt-2 text-ds-text-secondary font-mono text-sm">Welcome to your ShieldX autonomous security operations dashboard.</p>
      </div>

      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {mockStats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
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
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold font-syne text-ds-text-primary">
                  {stat.value}
                </span>
                <span className={`flex items-center text-xs font-semibold ${stat.change.startsWith('+') ? 'text-ds-accent-cyan' : 'text-ds-accent-green'}`}>
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {stat.change}
                </span>
              </div>
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
            Active Surveillance Logs
          </h3>
          <Link href="/scan-results" className="text-sm text-ds-accent-cyan hover:text-white transition-colors flex items-center font-semibold">
            <span>View Directory</span>
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-ds-bg-surface border-b border-ds-border text-xs uppercase tracking-widest text-ds-text-muted font-semibold">
                <th className="px-6 py-4">Target Repository</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Security Posture</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border/50">
              {mockRecentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-ds-bg-surface/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded bg-ds-bg-deep border border-ds-border flex items-center justify-center mr-3 shadow-inner">
                        <Shield className="h-4 w-4 text-ds-text-secondary" />
                      </div>
                      <span className="font-mono text-sm text-ds-text-primary group-hover:text-ds-accent-cyan transition-colors">{scan.project}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-ds-text-secondary">{scan.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                       {scan.critical > 0 && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-ds-red/10 text-ds-red border border-ds-red/30 glow-red">
                           C: {scan.critical}
                         </span>
                       )}
                       {scan.high > 0 && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-ds-amber/10 text-ds-amber border border-ds-amber/30 glow-yellow">
                           H: {scan.high}
                         </span>
                       )}
                       {scan.medium > 0 && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#00A8CC]/10 text-[#00A8CC] border border-[#00A8CC]/30">
                           M: {scan.medium}
                         </span>
                       )}
                       <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-ds-accent-green/10 text-ds-accent-green border border-ds-accent-green/30 glow-green">
                         L: {scan.low}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-ds-text-secondary hover:text-ds-accent-cyan transition-colors p-2 rounded-md hover:bg-ds-bg-surface">
                      <Eye className="h-4 w-4" />
                    </button>
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