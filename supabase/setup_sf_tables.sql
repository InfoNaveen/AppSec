-- 1. Create sf_scans table
CREATE TABLE IF NOT EXISTS sf_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_path TEXT,
  triggered_by TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'queued',
  current_agent TEXT,
  language TEXT,
  findings_count INT DEFAULT 0,
  patches_count INT DEFAULT 0,
  hardening_count INT DEFAULT 0,
  report_url TEXT,
  pr_url TEXT,
  omium_trace_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. Create sf_findings table
CREATE TABLE IF NOT EXISTS sf_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES sf_scans(id) ON DELETE CASCADE,
  rule_id TEXT,
  severity TEXT,
  file_path TEXT,
  line_start INT,
  line_end INT,
  description TEXT,
  vulnerable_code TEXT,
  exploitability_rationale TEXT,
  cve_id TEXT,
  advisory_url TEXT,
  advisory_note TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create sf_patches table
CREATE TABLE IF NOT EXISTS sf_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES sf_scans(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES sf_findings(id),
  original_code TEXT,
  patched_code TEXT,
  file_path TEXT,
  patch_type TEXT DEFAULT 'code',
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE sf_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_patches ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "users_own_scans" ON sf_scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_findings" ON sf_findings FOR ALL USING (scan_id IN (SELECT id FROM sf_scans WHERE user_id = auth.uid()));
CREATE POLICY "users_own_patches" ON sf_patches FOR ALL USING (scan_id IN (SELECT id FROM sf_scans WHERE user_id = auth.uid()));

CREATE POLICY "service_role_all_scans" ON sf_scans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_findings" ON sf_findings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_patches" ON sf_patches FOR ALL USING (auth.role() = 'service_role');

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
