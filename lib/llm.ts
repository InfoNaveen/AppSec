/**
 * DevSentinel AI — Unified LLM Abstraction Layer
 * 
 * Priority fallback chain: Anthropic → Groq → OpenAI → Azure OpenAI
 * Selected by LLM_PROVIDER env var. If not set, auto-detect by checking
 * which key is present in env (in priority order above).
 */

import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';

// ── Provider detection ──────────────────────────────────────────────────

type Provider = 'anthropic' | 'groq' | 'openai' | 'azure';

const PROVIDER_PRIORITY: Provider[] = ['anthropic', 'groq', 'openai', 'azure'];

function detectProvider(): Provider {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase() as Provider | undefined;
  if (explicit && PROVIDER_PRIORITY.includes(explicit)) return explicit;

  // Auto-detect by checking which key is present
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.AZURE_OPENAI_API_KEY) return 'azure';

  return 'anthropic'; // default
}

function getProviderChain(): Provider[] {
  const primary = detectProvider();
  // Build chain: primary first, then remaining in priority order
  const chain = [primary, ...PROVIDER_PRIORITY.filter(p => p !== primary)];
  // Filter to only providers that have keys configured
  return chain.filter(p => {
    switch (p) {
      case 'anthropic': return !!process.env.ANTHROPIC_API_KEY;
      case 'groq': return !!process.env.GROQ_API_KEY;
      case 'openai': return !!process.env.OPENAI_API_KEY;
      case 'azure': return !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
      default: return false;
    }
  });
}

// ── Provider implementations ────────────────────────────────────────────

async function callAnthropic(systemPrompt: string, userPrompt: string, json: boolean): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const system = json
    ? systemPrompt + '\n\nIMPORTANT: Return only valid JSON. No markdown fences, no explanation text outside the JSON.'
    : systemPrompt;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type === 'text') return block.text;
  throw new Error('Anthropic returned non-text content');
}

async function callGroq(systemPrompt: string, userPrompt: string, json: boolean): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const system = json
    ? systemPrompt + '\n\nIMPORTANT: Return only valid JSON. No markdown fences, no explanation text outside the JSON.'
    : systemPrompt;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });

  return completion.choices[0]?.message?.content || '';
}

async function callOpenAI(systemPrompt: string, userPrompt: string, json: boolean): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const system = json
    ? systemPrompt + '\n\nIMPORTANT: Return only valid JSON. No markdown fences, no explanation text outside the JSON.'
    : systemPrompt;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });

  return completion.choices[0]?.message?.content || '';
}

async function callAzure(systemPrompt: string, userPrompt: string, json: boolean): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': '2024-02-15-preview' },
    defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY! },
  });

  const system = json
    ? systemPrompt + '\n\nIMPORTANT: Return only valid JSON. No markdown fences, no explanation text outside the JSON.'
    : systemPrompt;

  const completion = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });

  return completion.choices[0]?.message?.content || '';
}

// ── Exported callLLM function ───────────────────────────────────────────

const PROVIDER_FNS: Record<Provider, (s: string, u: string, j: boolean) => Promise<string>> = {
  anthropic: callAnthropic,
  groq: callGroq,
  openai: callOpenAI,
  azure: callAzure,
};

/**
 * Call LLM with automatic provider fallback chain.
 * 
 * @param systemPrompt - System instructions for the LLM
 * @param userPrompt - User/task prompt
 * @param options.json - If true, instruct model to return only valid JSON
 * @returns LLM response string
 * @throws Error if all providers fail
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: { json?: boolean }
): Promise<string> {
  const json = options?.json ?? false;
  const chain = getProviderChain();

  if (chain.length === 0) {
    throw new Error('All LLM providers failed: no API keys configured');
  }

  const errors: string[] = [];

  for (const provider of chain) {
    try {
      const result = await PROVIDER_FNS[provider](systemPrompt, userPrompt, json);
      return result;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`[callLLM] ${provider} failed: ${msg}`);
      errors.push(`${provider}: ${msg}`);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}