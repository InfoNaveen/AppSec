/**
 * SecureForge AI — Omium Tracing Layer
 * 
 * All functions are async no-ops when OMIUM_API_KEY is not set.
 * Every function wraps in try/catch — never propagates errors.
 */

const OMIUM_BASE = 'https://api.omium.ai/api/v1';

function getKey(): string | null {
  return process.env.OMIUM_API_KEY || null;
}

function getProjectId(): string {
  return process.env.OMIUM_PROJECT_ID || 'secureforge-ai';
}

async function omiumFetch(path: string, body: object): Promise<any> {
  const key = getKey();
  if (!key) return null;

  const res = await fetch(`${OMIUM_BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[Omium] ${path} returned ${res.status}`);
    return null;
  }

  return res.json();
}

// ── Exported functions ──────────────────────────────────────────────────

export async function initTrace(
  traceId: string,
  metadata: { repoUrl: string; triggeredBy: string; language?: string }
): Promise<void> {
  try {
    await omiumFetch('/traces', {
      traceId,
      projectId: getProjectId(),
      metadata,
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Omium] initTrace error:', err);
  }
}

export async function startSpan(
  traceId: string,
  spanName: string,
  options?: { parentSpanId?: string; agentName?: string; metadata?: object }
): Promise<string> {
  const spanId = `span-${spanName}-${Date.now()}`;
  try {
    await omiumFetch('/spans', {
      traceId,
      spanId,
      spanName,
      parentSpanId: options?.parentSpanId,
      agentName: options?.agentName,
      metadata: options?.metadata,
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Omium] startSpan error:', err);
  }
  return spanId;
}

export async function endSpan(
  spanId: string,
  result: { status: 'success' | 'failed'; output?: object; errorMessage?: string }
): Promise<void> {
  try {
    await omiumFetch('/spans/end', {
      spanId,
      ...result,
      endedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Omium] endSpan error:', err);
  }
}

export async function logToolCall(
  spanId: string,
  tool: { name: string; input: object; output: object; durationMs: number }
): Promise<void> {
  try {
    await omiumFetch('/tools', {
      spanId,
      ...tool,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Omium] logToolCall error:', err);
  }
}

export async function endTrace(
  traceId: string,
  summary: {
    status: 'completed' | 'failed';
    findingsCount: number;
    patchesCount: number;
    hardeningCount: number;
  }
): Promise<void> {
  try {
    await omiumFetch('/traces/end', {
      traceId,
      ...summary,
      endedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Omium] endTrace error:', err);
  }
}
