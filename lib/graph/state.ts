/**
 * SecureForge AI — LangGraph State Definition
 */
import { Annotation } from '@langchain/langgraph';

// ── Data types ──────────────────────────────────────────────────────────

export interface Finding {
  id: string;
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  filePath: string;
  lineStart: number;
  lineEnd: number;
  description: string;
  vulnerableCode: string;
  cveId?: string;
  advisoryUrl?: string;
  advisoryNote?: string;
  status: 'open' | 'patched' | 'false_positive';
}

export interface TriagedFinding extends Finding {
  exploitabilityRationale: string;
  reachable: boolean;
  confidence: number; // 0-1
}

export interface Patch {
  findingId: string;
  originalCode: string;
  patchedCode: string;
  filePath: string;
  patchType: 'code' | 'dependency' | 'hardening';
}

// ── Agent State ─────────────────────────────────────────────────────────

export interface AgentState {
  scanId: string;
  repoPath: string;
  repoUrl: string;
  language: 'python' | 'node' | 'unknown';
  architectureMap: object | null;
  findings: Finding[];
  triageResults: TriagedFinding[];
  patches: Patch[];
  hardeningApplied: string[];
  reportPath: string | null;
  prUrl: string | null;
  errors: string[];
  status: 'running' | 'completed' | 'failed' | 'clean';
  omiumTraceId: string;
  currentAgent: string;
}

// ── LangGraph Annotation ────────────────────────────────────────────────

export const AgentStateAnnotation = Annotation.Root({
  scanId: Annotation<string>,
  repoPath: Annotation<string>,
  repoUrl: Annotation<string>,
  language: Annotation<'python' | 'node' | 'unknown'>,
  architectureMap: Annotation<object | null>,
  findings: Annotation<Finding[]>,
  triageResults: Annotation<TriagedFinding[]>,
  patches: Annotation<Patch[]>,
  hardeningApplied: Annotation<string[]>,
  reportPath: Annotation<string | null>,
  prUrl: Annotation<string | null>,
  errors: Annotation<string[]>,
  status: Annotation<'running' | 'completed' | 'failed' | 'clean'>,
  omiumTraceId: Annotation<string>,
  currentAgent: Annotation<string>,
});
