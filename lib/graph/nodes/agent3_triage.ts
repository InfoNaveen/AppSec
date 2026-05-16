/**
 * Agent 3 — Severity Triage Agent
 * LLM exploitability analysis with autonomous branching decision.
 * THIS IS THE BRANCHING DECISION POINT.
 */
import { AgentState, TriagedFinding } from '../state';
import { callLLM } from '../../llm';
import { startSpan, endSpan, logToolCall } from '../../omium';
import { createClient } from '@supabase/supabase-js';

export async function agent3Triage(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent3_triage', {
    agentName: 'Severity Triage Agent',
  });

  try {
    console.log(`[Agent3] Triaging ${state.findings.length} findings...`);
    const triageResults: TriagedFinding[] = [];

    for (const finding of state.findings) {
      const t0 = Date.now();
      try {
        const llmResult = await callLLM(
          'You are an AppSec engineer performing exploitability triage. Return JSON only. Be critical — most findings are medium risk.',
          `Finding: ${JSON.stringify(finding)}\n\nArchitecture context: ${JSON.stringify(state.architectureMap)}`,
          { json: true }
        );
        await logToolCall(spanId, {
          name: 'callLLM',
          input: { findingId: finding.id, ruleId: finding.ruleId },
          output: { raw: llmResult.slice(0, 200) },
          durationMs: Date.now() - t0,
        });

        const parsed = JSON.parse(llmResult);

        // If LLM marks as false positive, update status
        if (parsed.falsePositive) {
          triageResults.push({
            ...finding,
            severity: parsed.severity || finding.severity,
            exploitabilityRationale: parsed.exploitabilityRationale || 'Marked as false positive by triage agent',
            reachable: parsed.reachable ?? false,
            confidence: parsed.confidence ?? 0,
            status: 'false_positive',
          });
        } else {
          triageResults.push({
            ...finding,
            severity: parsed.severity || finding.severity,
            exploitabilityRationale: parsed.exploitabilityRationale || 'No rationale provided',
            reachable: parsed.reachable ?? true,
            confidence: parsed.confidence ?? 0.5,
            status: finding.status,
          });
        }
      } catch (err: any) {
        // On LLM failure, keep finding as-is with default triage
        console.error(`[Agent3] Triage failed for ${finding.id}:`, err.message);
        triageResults.push({
          ...finding,
          exploitabilityRationale: 'Triage LLM call failed — keeping original severity',
          reachable: true,
          confidence: 0.5,
        });
      }
    }

    // Filter: keep only findings where confidence >= 0.4 AND not false positive
    const filtered = triageResults.filter(
      f => f.confidence >= 0.4 && f.status !== 'false_positive'
    );

    // BRANCHING LOGIC — autonomous decision
    const criticalCount = filtered.filter(f => f.severity === 'critical').length;
    const highCount = filtered.filter(f => f.severity === 'high').length;

    let newStatus: AgentState['status'];
    if (criticalCount === 0 && highCount === 0) {
      newStatus = 'clean';
      console.log('[Agent3] No critical/high severity findings. Marking repo as clean. Skipping remediation.');
      await endSpan(spanId, {
        status: 'success',
        output: { decision: 'clean', reason: 'no_critical_high', totalTriaged: filtered.length },
      });
    } else {
      newStatus = 'running';
      console.log(`[Agent3] Decision: REMEDIATE (${criticalCount} critical, ${highCount} high)`);
      await endSpan(spanId, {
        status: 'success',
        output: { criticalCount, highCount, decision: 'remediate', totalTriaged: filtered.length },
      });
    }

    // Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    await supabase.from('scans').update({
      current_agent: 'agent3_triage',
      findings_count: filtered.length,
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    console.log(`[Agent3] ✅ Complete — ${filtered.length} actionable findings, decision: ${newStatus === 'clean' ? 'CLEAN' : 'REMEDIATE'}`);
    return {
      triageResults: filtered,
      status: newStatus,
      currentAgent: 'agent3_triage',
    };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    return {
      triageResults: [],
      status: 'failed',
      errors: [...state.errors, `agent3_triage: ${err.message}`],
      currentAgent: 'agent3_triage',
    };
  }
}
