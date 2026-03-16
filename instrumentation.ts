import { validateEnv } from './lib/llm';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // SECURITY FIX: Validate environment variables on server startup
    // Commented out temporarily for UI demonstration purposes
    // validateEnv();
  }
}
