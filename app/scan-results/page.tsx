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

  const supabase = await createSupabaseServerClient();

  // Fetch scan details
  const { data: scan, error: scanError } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .single();

  if (scanError || !scan) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ds-text-primary mb-4 font-syne">Scan Not Found</h1>
          <p className="text-ds-text-secondary mb-6">The requested scan could not be found.</p>
          <Link href="/dashboard">
            <button className="px-5 py-2.5 bg-ds-accent-cyan text-black font-bold font-syne rounded-lg">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Fetch findings from new findings table
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('scan_id', scanId)
    .order('severity', { ascending: false });

  // Fetch patches
  const { data: patches } = await supabase
    .from('patches')
    .select('*')
    .eq('scan_id', scanId);

  // Map findings for client component
  const mappedFindings = (findings || []).map(f => ({
    id: f.id,
    type: f.rule_id || f.description,
    severity: f.severity as 'low' | 'medium' | 'high' | 'critical',
    file: f.file_path,
    line: f.line_start,
    snippet: f.vulnerable_code || '',
    description: f.description,
    exploitabilityRationale: f.exploitability_rationale,
    cveId: f.cve_id,
    advisoryUrl: f.advisory_url,
    advisoryNote: f.advisory_note,
    confidence: f.confidence,
    status: f.status,
  }));

  const mappedPatches = (patches || []).map(p => ({
    id: p.id,
    file: p.file_path,
    before: p.original_code,
    after: p.patched_code,
    change: p.patch_type === 'dependency_upgrade_required' ? 'Dependency upgrade required' : 'Security patch applied',
    patchType: p.patch_type,
    findingId: p.finding_id,
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