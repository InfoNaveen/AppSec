# 🛡️ DevSentinel AI

**Autonomous AppSec Engineer — scans, reasons, patches, and hardens your codebase end-to-end, without a human in the loop.**

<p align="center">
  <pre align="center">
  ██████╗ ███████╗██╗   ██╗███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗
  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║
  ██║  ██║█████╗  ██║   ██║███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║
  ██║  ██║██╔══╝  ╚██╗ ██╔╝╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║
       ██████╔╝███████╗ ╚████╔╝ ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
       ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
                                                                     AI  ·  v1.0.0
  </pre>
</p>

<h3 align="center">
  🛡️ Autonomous, Secure-by-Design Development Platform
</h3>

<p align="center">
  Scan · Detect · Patch · Validate — powered by a collaborative multi-agent LLM pipeline.<br/>
  Built for the <strong>Techfest IIT Bombay AutoDev Hackathon</strong> & <strong>Anvil MMXXVI · P·03 · Omium Sponsored Track</strong>.
</p>

<p align="center">
  <a href="#-overview">Overview</a> ·
  <a href="#-architecture">Architecture</a> ·
  <a href="#-features">Features</a> ·
  <a href="#-tech-stack">Tech Stack</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-environment-variables">Env Vars</a> ·
  <a href="#-project-structure">Structure</a> ·
  <a href="#-multi-agent-pipeline">Agents</a> ·
  <a href="#-security-remediation-log">Security</a> ·
  <a href="#-deployment">Deploy</a>
</p>

---

## What It Does

DevSentinel AI is a fully autonomous, multi-agent security pipeline powered by LangGraph. Point it at any Python repository and it will:

1. **Map** — Walk the codebase, detect framework, identify attack surface via LLM
2. **Scan** — Run Semgrep, Bandit, pip-audit + LLM-powered analysis for logic flaws
3. **Triage** — LLM exploitability assessment with autonomous branching (clean repos skip to report)
4. **Patch** — Generate secure code replacements for critical/high vulnerabilities
5. **Harden** — Add rate limiting, security headers, CORS lockdown, secret management
6. **Report** — JSON + PDF report, Discord notification, GitHub PR with all fixes

All actions are traced via **Omium** for full observability.

---

## Architecture

```
GitHub Push → Webhook → Clone → LangGraph Pipeline
                                    ↓
                              [1] Mapper
                                    ↓
                              [2] Scanner (Semgrep + Bandit + pip-audit + LLM)
                                    ↓
                              [3] Triage (LLM exploitability analysis)
                                    ↓
                          ┌─── critical/high? ───┐
                          ↓                      ↓
                    [4] Remediator          [5] Hardener
                          ↓                      ↓
                          └──────────────────────┘
                                    ↓
                              [6] Reporter (PDF + Discord + GitHub PR)
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in at minimum: ANTHROPIC_API_KEY + SUPABASE keys

# Run development server
npm run dev

# Trigger a scan (manual)
curl -X POST http://localhost:3000/api/scan/trigger \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/your-org/vulnerable-flask-app"}'
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes* | Primary LLM provider |
| `GROQ_API_KEY` | Yes* | Backup LLM (free tier) |
| `OPENAI_API_KEY` | No | Optional fallback |
| `AZURE_OPENAI_API_KEY` | No | Optional fallback |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase |
| `GITHUB_TOKEN` | No | For automated PRs |
| `DISCORD_WEBHOOK_URL` | No | Scan notifications |
| `TAVILY_API_KEY` | No | CVE advisory search |
| `OMIUM_API_KEY` | No | Tracing (bonus points) |

\* At least one LLM key must be present.

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Pipeline**: LangGraph with SqliteSaver checkpointing
- **LLM**: Anthropic Claude / Groq Llama / OpenAI GPT-4o (fallback chain)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Tools**: Semgrep, Bandit, pip-audit
- **Tracing**: Omium
- **Notifications**: Discord Webhooks, GitHub PRs

---

## License

### Vercel (Recommended for Prototyping)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set all environment variables under **Settings → Environment Variables** in the Vercel dashboard. Never paste secrets into the CLI directly.

### Azure App Service (Recommended for Production)

```bash
# 1. Push to GitHub
git push origin main

# 2. Configure GitHub Actions (see .github/workflows/)
# 3. Set env vars in: App Service → Configuration → Application Settings
# 4. Deploy via Azure CLI
az webapp up --name devsentinel-ai --resource-group <rg> --runtime "NODE:18-lts"
```

Integrate **Azure Application Insights** for real-time monitoring, alerting, and distributed tracing across the agent pipeline.

### Local Production Build

```bash
npm run build    # Compiles and validates — will throw on missing env vars
npm start        # Runs the compiled output
```

---

## 🔧 Troubleshooting

<details>
<summary><strong>LLM API errors / no response from agents</strong></summary>

Verify your Azure OpenAI or fallback keys are correctly set in `.env.local`. Test the LLM connection directly:
```bash
curl http://localhost:3000/api/test-llm
```
Check that `AZURE_OPENAI_DEPLOYMENT_NAME` matches the deployment name in your Azure portal (not the model name — these differ).
</details>

<details>
<summary><strong>Supabase connection failures</strong></summary>

Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. Verify the schema from `supabase/schema.sql` has been applied in the SQL editor. Check that Row Level Security policies are enabled on all tables.
</details>

<details>
<summary><strong>GitHub integration / PR creation fails</strong></summary>

Your Personal Access Token requires the `repo` and `pull_requests` scopes. Fine-grained tokens must have **Contents: Read & Write** and **Pull requests: Read & Write** permissions on the target repository. Tokens are never logged — if you see a token in logs, update immediately (see Security section).
</details>

<details>
<summary><strong>Rate limiting (429 responses)</strong></summary>

If you're hitting 429s in development, set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`. Without these, the rate limiter is skipped in development mode but will be enforced in production.
</details>

<details>
<summary><strong>File upload or extraction errors</strong></summary>

Uploads are limited to **50MB** per file with a **10,000 entry** cap and a **500MB max uncompressed size**. Files must be valid ZIP archives (magic bytes `PK\x03\x04`). The server will reject non-ZIP files even if renamed with a `.zip` extension.
</details>

<details>
<summary><strong>Server startup fails / missing env var error</strong></summary>

DevSentinel AI validates all required environment variables at startup via `instrumentation.ts`. The error message will name exactly which key is missing. Add it to `.env.local` and restart.
</details>

---

## 📜 License

DevSentinel AI is open-source software licensed under the **MIT License**.

Originally built during the **Techfest IIT Bombay AutoDev Hackathon** and evolved through the ShieldX V1 security hardening sprint.

---

## 🙏 Acknowledgements

| Resource | Contribution |
|---|---|
| [OWASP Top 10](https://owasp.org/www-project-top-ten/) | Vulnerability classification framework |
| [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service) | Multi-agent LLM orchestration |
| [Azure AI Content Safety](https://azure.microsoft.com/en-us/products/ai-services/ai-content-safety) | Responsible AI guardrails |
| [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/) | Secure secret management |
| [NeuroSploit](https://github.com/CyberSecurityUP/NeuroSploit) | Offensive security skill framework |
| [Supabase](https://supabase.com/) | Database, auth, and storage |
| [Next.js](https://nextjs.org/) | React application framework |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Upstash Redis](https://upstash.com/) | Serverless rate limiting |
| [LangChain / AutoGen](https://www.langchain.com/) | Agentic workflow concepts |

---

<p align="center">
  Made with ⚡ by the DevSentinel AI Team &nbsp;·&nbsp;
  <a href="https://github.com/InfoNaveen/DEVSENTINEL-AI/issues">Report a Bug</a> &nbsp;·&nbsp;
  <a href="https://github.com/InfoNaveen/DEVSENTINEL-AI/discussions">Discussions</a>
</p>

<p align="center">
  <sub>⭐ Star this repo if DevSentinel AI helps you ship more secure code.</sub>
</p>
