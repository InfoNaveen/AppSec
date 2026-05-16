// Local in-memory mock DB for Demo Survival Mode
export const mockDb = {
  scans: new Map<string, any>(),
  findings: new Map<string, any[]>(),
  patches: new Map<string, any[]>(),
  startTime: new Map<string, number>(),
};

export const MOCK_FINDINGS = [
  {
    id: 'finding-1',
    ruleId: 'PYSEC-2021-233',
    severity: 'critical',
    filePath: 'requirements.txt',
    lineStart: 10,
    lineEnd: 10,
    description: 'Vulnerable dependency: Flask<2.0.0',
    vulnerableCode: 'Flask==1.1.2',
    exploitabilityRationale: 'High exploitability due to known CVE in this version.',
    status: 'patched',
  },
  {
    id: 'finding-2',
    ruleId: 'bandit-B602',
    severity: 'high',
    filePath: 'app.py',
    lineStart: 45,
    lineEnd: 46,
    description: 'Command injection vulnerability in subprocess call.',
    vulnerableCode: 'subprocess.call(user_input, shell=True)',
    exploitabilityRationale: 'Attacker controls user_input allowing arbitrary code execution.',
    status: 'patched',
  },
  {
    id: 'finding-3',
    ruleId: 'semgrep-hardcoded-secret',
    severity: 'medium',
    filePath: 'config.py',
    lineStart: 5,
    lineEnd: 5,
    description: 'Hardcoded JWT secret detected.',
    vulnerableCode: 'SECRET_KEY = "my_super_secret_key"',
    exploitabilityRationale: 'Easily accessible to anyone with repository access.',
    status: 'open',
  }
];

export const MOCK_PATCHES = [
  {
    findingId: 'finding-1',
    originalCode: 'Flask==1.1.2',
    patchedCode: 'Flask>=2.0.1',
    filePath: 'requirements.txt',
    patchType: 'dependency',
  },
  {
    findingId: 'finding-2',
    originalCode: 'subprocess.call(user_input, shell=True)',
    patchedCode: 'subprocess.call(shlex.split(user_input), shell=False)',
    filePath: 'app.py',
    patchType: 'code',
  }
];

export function getMockScanProgression(scanId: string) {
  const start = mockDb.startTime.get(scanId);
  if (!start) return null;

  const elapsed = (Date.now() - start) / 1000;
  
  let current_agent = 'mapper';
  let status = 'running';
  let findings_count = 0;
  let patches_count = 0;

  if (elapsed > 2) current_agent = 'scanner';
  if (elapsed > 6) { current_agent = 'triage'; findings_count = 3; }
  if (elapsed > 9) { current_agent = 'remediator'; findings_count = 3; }
  if (elapsed > 12) { current_agent = 'hardener'; patches_count = 2; }
  if (elapsed > 15) current_agent = 'reporter';
  if (elapsed > 18) {
    status = 'completed';
    current_agent = 'completed';
  }

  return {
    ...mockDb.scans.get(scanId),
    status,
    current_agent,
    findings_count,
    patches_count,
  };
}
