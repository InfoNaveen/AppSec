/**
 * GET /api/test-llm — Test LLM connectivity (uses new callLLM signature)
 */
import { NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function GET() {
  try {
    const response = await callLLM(
      'You are a test assistant.',
      'Reply with exactly: "DevSentinel AI LLM OK"'
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      response: response.trim(),
    });
  } catch (error) {
    console.error('LLM test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}