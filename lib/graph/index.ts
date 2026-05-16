/**
 * SecureForge AI — LangGraph Pipeline Definition
 * 
 * Graph: mapper → scanner → triage → [remediator ‖ hardener] → reporter
 * Conditional edge at triage: if clean → skip to reporter.
 */
import { StateGraph } from '@langchain/langgraph';
import { MemorySaver } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentState } from './state';
import { agent1Mapper } from './nodes/agent1_mapper';
import { agent2Scanner } from './nodes/agent2_scanner';
import { agent3Triage } from './nodes/agent3_triage';
import { agent4Remediator } from './nodes/agent4_remediator';
import { agent5Hardener } from './nodes/agent5_hardener';
import { agent6Reporter } from './nodes/agent6_reporter';
import { initTrace, startSpan, endSpan } from '../omium';
import { createClient } from '@supabase/supabase-js';

// Build the graph
const checkpointer = new MemorySaver();

const graph = new StateGraph(AgentStateAnnotation)
  .addNode('mapper', agent1Mapper)
  .addNode('scanner', agent2Scanner)
  .addNode('triage', agent3Triage)
  .addNode('remediator', agent4Remediator)
  .addNode('hardener', agent5Hardener)
  .addNode('reporter', agent6Reporter)
  .addEdge('__start__', 'mapper')
  .addEdge('mapper', 'scanner')
  .addEdge('scanner', 'triage')
  .addConditionalEdges('triage', (state) => {
    if (state.status === 'clean') return 'reporter';
    // Route to both remediator and hardener
    return 'remediator';
  })
  .addEdge('remediator', 'hardener')
  .addEdge('hardener', 'reporter')
  .addEdge('reporter', '__end__')
  .compile({ checkpointer });

/**
 * Run the full SecureForge AI pipeline.
 * This function should be called fire-and-forget from API routes.
 */
export async function runPipeline(input: {
  scanId: string;
  repoPath: string;
  repoUrl: string;
  triggeredBy: 'webhook' | 'manual';
  omiumTraceId: string;
}): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // Initialize Omium trace
    await initTrace(input.omiumTraceId, {
      repoUrl: input.repoUrl,
      triggeredBy: input.triggeredBy,
    });

    // Start pipeline-level span
    const pipelineSpanId = await startSpan(input.omiumTraceId, 'pipeline', {
      agentName: 'SecureForge AI Pipeline',
      metadata: { scanId: input.scanId },
    });

    // Update scan status to running
    await supabase.from('scans').update({
      status: 'running',
      updated_at: new Date().toISOString(),
    }).eq('id', input.scanId);

    // Build initial state
    const initialState: AgentState = {
      scanId: input.scanId,
      repoPath: input.repoPath,
      repoUrl: input.repoUrl,
      language: 'unknown',
      architectureMap: null,
      findings: [],
      triageResults: [],
      patches: [],
      hardeningApplied: [],
      reportPath: null,
      prUrl: null,
      errors: [],
      status: 'running',
      omiumTraceId: input.omiumTraceId,
      currentAgent: 'starting',
    };

    // Stream graph execution
    const config = { configurable: { thread_id: input.scanId } };

    for await (const event of await graph.stream(initialState, config)) {
      // Each streamed event contains the node name and its output
      const nodeName = Object.keys(event)[0];
      const nodeOutput = (event as any)[nodeName];

      console.log(`[Pipeline] ${nodeName} completed`);

      // Update Supabase with progress
      if (nodeOutput?.currentAgent) {
        await supabase.from('scans').update({
          current_agent: nodeOutput.currentAgent,
          findings_count: nodeOutput.findings?.length ?? undefined,
          patches_count: nodeOutput.patches?.length ?? undefined,
          updated_at: new Date().toISOString(),
        }).eq('id', input.scanId);
      }
    }

    // End pipeline span
    await endSpan(pipelineSpanId, {
      status: 'success',
      output: { scanId: input.scanId },
    });

    console.log(`[Pipeline] Scan ${input.scanId} completed successfully`);
  } catch (err: any) {
    console.error(`[Pipeline] Scan ${input.scanId} failed:`, err);

    // Update scan as failed
    await supabase.from('scans').update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    }).eq('id', input.scanId);

    // End Omium trace with failure
    const { endTrace } = await import('../omium');
    await endTrace(input.omiumTraceId, {
      status: 'failed',
      findingsCount: 0,
      patchesCount: 0,
      hardeningCount: 0,
    });
  }
}
