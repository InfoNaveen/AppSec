/**
 * SecureForge AI — Startup validation
 * Ensures at least one LLM API key is configured before the app starts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasAzure = !!process.env.AZURE_OPENAI_API_KEY;

    if (!hasAnthropic && !hasGroq && !hasOpenAI && !hasAzure) {
      console.error(
        '\n⚠️  SecureForge AI: No LLM API key found!\n' +
        '   Set at least one of: ANTHROPIC_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, AZURE_OPENAI_API_KEY\n'
      );
      // Don't throw — allow app to start for UI development, but warn loudly
    } else {
      const active = [
        hasAnthropic && 'Anthropic',
        hasGroq && 'Groq',
        hasOpenAI && 'OpenAI',
        hasAzure && 'Azure',
      ].filter(Boolean);
      console.log(`✅ SecureForge AI: LLM providers available: ${active.join(', ')}`);
    }
  }
}
