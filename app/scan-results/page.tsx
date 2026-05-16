import { createSupabaseServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import ScanResultsClient from './ScanResultsClient';

// Server component - fetches data from new findings/patches tables
export default async function ScanResultsServerPage({ searchParams }: { searchParams: { scanId?: string } }) {
  const scanId = searchParams.scanId;

  if (!scanId) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ds-text-primary mb-4 font-syne">Scan Results Not Found</h1>
          <p className="text-ds-text-secondary mb-6">
            Please select a scan to view results.
          </p>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-ds-accent-cyan text-black font-bold font-syne rounded-lg">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // MOCK DEMO MODE
  const { mockDb, MOCK_FINDINGS, MOCK_PATCHES } = require('@/lib/mock-db');
  const scan = mockDb.scans.get(scanId) || {
    id: scanId,
    repo_url: 'https://github.com/InfoNaveen/vulnerable-demo-app',
    status: 'completed'
  };

  const findings = mockDb.findings.get(scanId) || MOCK_FINDINGS;
  const patches = mockDb.patches.get(scanId) || MOCK_PATCHES;

  // Map findings for client component
  const mappedFindings = (findings || []).map((f: any) => ({
    id: f.id,
    type: f.rule_id || f.ruleId || f.description,
    severity: f.severity as 'low' | 'medium' | 'high' | 'critical',
    file: f.file_path || f.filePath,
    line: f.line_start || f.lineStart,
    snippet: f.vulnerable_code || f.vulnerableCode || '',
    description: f.description,
    exploitabilityRationale: f.exploitability_rationale || f.exploitabilityRationale,
    cveId: f.cve_id || f.cveId,
    advisoryUrl: f.advisory_url || f.advisoryUrl,
    advisoryNote: f.advisory_note || f.advisoryNote,
    confidence: f.confidence,
    status: f.status,
  }));

  const mappedPatches = (patches || []).map((p: any) => ({
    id: p.id,
    file: p.file_path || p.filePath,
    before: p.original_code || p.originalCode,
    after: p.patched_code || p.patchedCode,
    change: (p.patch_type || p.patchType) === 'dependency' ? 'Dependency upgrade required' : 'Security patch applied',
    patchType: p.patch_type || p.patchType,
    findingId: p.finding_id || p.findingId,
  }));

  return (
    <ScanResultsClient
      initialScanResults={mappedFindings}
      initialPatches={mappedPatches}
      projectId={scanId}
      scanData={scan}
      hardeningRecords={[]}
    />
  );
}