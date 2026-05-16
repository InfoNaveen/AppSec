-- DevSentinel AI Database Schema
-- Run this SQL in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- This is automatically created by Supabase Auth, but we'll define it for reference
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  repo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  severity_counts JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vulnerabilities table
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  file_path TEXT NOT NULL,
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  code_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patches table
CREATE TABLE IF NOT EXISTS patches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE,
  before_code TEXT,
  after_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeline Events table
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Scans
CREATE POLICY "Users can view scans for their projects" ON scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scans.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert scans for their projects" ON scans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scans for their projects" ON scans
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scans.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scans for their projects" ON scans
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = scans.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Vulnerabilities
CREATE POLICY "Users can view vulnerabilities for their scans" ON vulnerabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN projects ON projects.id = scans.project_id
      WHERE scans.id = vulnerabilities.scan_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vulnerabilities for their scans" ON vulnerabilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN projects ON projects.id = scans.project_id
      WHERE scans.id = scan_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update vulnerabilities for their scans" ON vulnerabilities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN projects ON projects.id = scans.project_id
      WHERE scans.id = vulnerabilities.scan_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vulnerabilities for their scans" ON vulnerabilities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM scans 
      JOIN projects ON projects.id = scans.project_id
      WHERE scans.id = vulnerabilities.scan_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Patches
CREATE POLICY "Users can view patches for their vulnerabilities" ON patches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM vulnerabilities
      JOIN scans ON scans.id = vulnerabilities.scan_id
      JOIN projects ON projects.id = scans.project_id
      WHERE vulnerabilities.id = patches.vulnerability_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert patches for their vulnerabilities" ON patches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM vulnerabilities
      JOIN scans ON scans.id = vulnerabilities.scan_id
      JOIN projects ON projects.id = scans.project_id
      WHERE vulnerabilities.id = vulnerability_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update patches for their vulnerabilities" ON patches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM vulnerabilities
      JOIN scans ON scans.id = vulnerabilities.scan_id
      JOIN projects ON projects.id = scans.project_id
      WHERE vulnerabilities.id = patches.vulnerability_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete patches for their vulnerabilities" ON patches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM vulnerabilities
      JOIN scans ON scans.id = vulnerabilities.scan_id
      JOIN projects ON projects.id = scans.project_id
      WHERE vulnerabilities.id = patches.vulnerability_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Timeline Events
CREATE POLICY "Users can view timeline events for their projects" ON timeline_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert timeline events for their projects" ON timeline_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline events for their projects" ON timeline_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline events for their projects" ON timeline_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = timeline_events.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE projects TO authenticated;
GRANT ALL ON TABLE scans TO authenticated;
GRANT ALL ON TABLE vulnerabilities TO authenticated;
GRANT ALL ON TABLE patches TO authenticated;
GRANT ALL ON TABLE timeline_events TO authenticated;

-- Grant SELECT on users table (read-only)
GRANT SELECT ON TABLE users TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_project_id ON scans(project_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_scan_id ON vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_patches_vulnerability_id ON patches(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_project_id ON timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created_at ON timeline_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SecureForge AI schema
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sf_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_path TEXT,
  triggered_by TEXT DEFAULT 'manual',   -- 'webhook' | 'manual'
  status TEXT DEFAULT 'queued',          -- 'queued' | 'running' | 'completed' | 'failed' | 'clean'
  current_agent TEXT,                    -- name of agent currently running
  language TEXT,                         -- 'python' | 'node' | 'unknown'
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

CREATE TABLE IF NOT EXISTS sf_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES sf_scans(id) ON DELETE CASCADE,
  rule_id TEXT,
  severity TEXT,                         -- 'critical' | 'high' | 'medium' | 'low'
  file_path TEXT,
  line_start INT,
  line_end INT,
  description TEXT,
  vulnerable_code TEXT,
  exploitability_rationale TEXT,         -- Agent 3 LLM output
  cve_id TEXT,
  advisory_url TEXT,
  advisory_note TEXT,
  status TEXT DEFAULT 'open',            -- 'open' | 'patched' | 'false_positive'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sf_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES sf_scans(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES sf_findings(id),
  original_code TEXT,
  patched_code TEXT,
  file_path TEXT,
  patch_type TEXT DEFAULT 'code',        -- 'code' | 'dependency' | 'hardening'
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sf_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_patches ENABLE ROW LEVEL SECURITY;

-- Policies: users see only their own scans
CREATE POLICY "users_own_scans" ON sf_scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_findings" ON sf_findings FOR ALL
  USING (scan_id IN (SELECT id FROM sf_scans WHERE user_id = auth.uid()));
CREATE POLICY "users_own_patches" ON sf_patches FOR ALL
  USING (scan_id IN (SELECT id FROM sf_scans WHERE user_id = auth.uid()));

-- Service role bypass for background pipeline writes
CREATE POLICY "service_role_all_scans" ON sf_scans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_findings" ON sf_findings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_patches" ON sf_patches FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sf_scans_user_id ON sf_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_sf_scans_status ON sf_scans(status);
CREATE INDEX IF NOT EXISTS idx_sf_findings_scan_id ON sf_findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_sf_findings_severity ON sf_findings(severity);
CREATE INDEX IF NOT EXISTS idx_sf_patches_scan_id ON sf_patches(scan_id);