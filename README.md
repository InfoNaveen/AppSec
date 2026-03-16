<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-00E5FF?style=for-the-badge&logo=shield&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Azure_OpenAI-GPT--4o-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Security-Hardened-00FF88?style=for-the-badge&logo=springsecurity&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
</p>

<br />

<p align="center">
  <pre align="center">
  ██████╗ ███████╗██╗   ██╗███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗
  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║
  ██║  ██║█████╗  ██║   ██║███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║
  ██║  ██║██╔══╝  ╚██╗ ██╔╝╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║
       ██████╔╝███████╗ ╚████╔╝ ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
       ╚═════╝ ╚══════╝  ╚═══╝  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
                                                                     AI  ·  v1.0.0 ShieldX
  </pre>
</p>

<h3 align="center">
  🛡️ Autonomous, Secure-by-Design Development Platform
</h3>

<p align="center">
  Scan · Detect · Patch · Validate — powered by a collaborative multi-agent LLM pipeline.<br/>
  Built for the <strong>Techfest IIT Bombay AutoDev Hackathon</strong>.
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

## 🔭 Overview

**DevSentinel AI** is an enterprise-grade autonomous security platform that orchestrates a multi-agent LLM workflow to:

1. **Ingest** code repositories via ZIP upload or GitHub URL
2. **Scan** for vulnerabilities using a hybrid pattern-matching + LLM-assisted analysis engine
3. **Generate** AI-authored secure patches with before/after diff views
4. **Validate** patches using a NeuroSploit-inspired Red-Team gate — patches only ship when confirmed non-exploitable
5. **Commit** fixes as pull requests directly to your GitHub repository

> Built as a full-cycle prototype demonstrating a complete secure development pipeline — from repo ingestion to automated PR — with all agent outputs governed by **Azure AI Content Safety** (Prompt Shields + Protected Material Detection).

---

## 🏛️ Architecture

DevSentinel AI uses a **sequential multi-agent orchestration model** where each agent in the chain has a distinct, non-overlapping responsibility. No agent acts on unvalidated output from the previous stage.

```
  ┌──────────────────────────────────────────────────────────┐
  │               User Input Layer                           │
  │         ZIP Upload  ·  GitHub URL  ·  User Story         │
  └─────────────────────────┬────────────────────────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │         🏗️  Architect          │
            │  Maps project structure,        │
            │  identifies high-risk surfaces  │
            └────────────────┬───────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │         🔨  Builder            │
            │  Constructs a targeted,         │
            │  prioritized scanning strategy  │
            └────────────────┬───────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │         🔎  Critic             │
            │  Challenges assumptions,        │
            │  reduces false positives        │
            └────────────────┬───────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │         🛡️  Sentinel           │
            │  Executes hybrid scan:          │
            │  regex patterns + LLM analysis  │
            └────────────────┬───────────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │     ⚔️  Red-Team Gate          │
            │  NeuroSploit-inspired offensive │
            │  validation of all patches      │
            └────────────────┬───────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────┐
  │              Output Layer                                │
  │      Patch Report  ·  GitHub PR  ·  Timeline Event       │
  └──────────────────────────────────────────────────────────┘
```

All inter-agent communication is gated through **Azure AI Content Safety** — no raw LLM output reaches the user without Prompt Shield + Protected Material checks.

---

## ✨ Features

### 🔍 Intelligent Security Scanning
- **LLM-assisted vulnerability detection** — catches complex, context-dependent bugs that static analysis misses
- **OWASP Top 10 full coverage** — injection, broken auth, XSS, IDOR, security misconfiguration, and more
- **Severity classification** — every finding graded Critical / High / Medium / Low with CVSS-aligned rationale
- **Hybrid engine** — fast regex patterns for known signatures, deep LLM reasoning for novel attack vectors

### 🩹 Automated Patch Generation
- **AI-authored secure patches** with inline diff viewer (before/after comparison)
- **Automatic backup & restore** — every patch is reversible; original state is preserved
- **Export patched repository** as a downloadable ZIP

### 🔗 GitHub Integration
- **One-click PR creation** — commit fixes directly to your repository as a pull request
- **Token-based auth** — no secrets embedded in code; tokens are scoped and never logged

### 📊 Enterprise Dashboard
- **Project analytics** — vulnerability trends, severity distribution, patch coverage over time
- **Security timeline** — chronological event log of every scan, patch, and commit
- **Real-time feedback** — live scan progress with agent-by-agent status
- **Drag-and-drop ingestion** — ZIP upload and GitHub URL both supported from the same UI
- **Dark mode · Responsive · WCAG 2.1 AA compliant**

### ⚔️ Red-Team Validation Terminal
- Visual attack log showing exploit attempts and mitigation outcomes in real time
- NeuroSploit-inspired offensive techniques confirm patches are genuinely non-exploitable — not just syntactically different
- Every resolved vulnerability carries a "confirmed patched" attestation

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript | UI, routing, SSR |
| **Styling** | Tailwind CSS, shadcn/ui | Component library & design system |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **AI Orchestration** | Azure OpenAI (GPT-4o & o1-preview) | Multi-agent pipeline |
| **Content Safety** | Azure AI Content Safety | Prompt shields, protected material detection |
| **Secret Management** | Azure Key Vault | Production secret storage |
| **Database & Auth** | Supabase (PostgreSQL + GoTrue) | Persistence, RLS, user auth |
| **Rate Limiting** | Upstash Redis + `@upstash/ratelimit` | Abuse prevention |
| **File Handling** | AdmZip, Node.js fs | ZIP ingestion, extraction |
| **GitHub API** | `@octokit/rest` | PR creation, commit automation |
| **Hosting** | Vercel / Azure App Service | Edge & serverless deployment |
| **CI/CD** | GitHub Actions | Automated build, test, deploy |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| npm / yarn | latest |
| Supabase account | — |
| Azure OpenAI access | GPT-4o deployment |
| Upstash Redis | (for rate limiting) |

### Installation

**1 — Clone the repository**

```bash
git clone https://github.com/InfoNaveen/DEVSENTINEL-AI.git
cd DEVSENTINEL-AI
```

**2 — Install dependencies**

```bash
npm install
```

**3 — Configure environment variables**

```bash
cp .env.local.example .env.local
# Open .env.local and fill in all required keys (see Environment Variables below)
```

**4 — Apply the Supabase schema**

- Create a new project on [supabase.com](https://supabase.com/)
- Copy your project URL and API keys into `.env.local`
- Open the SQL editor in your Supabase dashboard and run:

```sql
-- Paste the contents of supabase/schema.sql
```

**5 — Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the dashboard is live.

> **Verify your LLM connection before your first scan:**
> ```bash
> curl http://localhost:3000/api/test-llm
> ```

---

## 🔐 Environment Variables

Create `.env.local` from the example file. Azure variables take priority; fallback LLM keys are used when Azure is unavailable.

```bash
# ─── Azure OpenAI (Primary Orchestration) ───────────────────────────────────
AZURE_OPENAI_API_KEY=                    # Your Azure OpenAI resource key
AZURE_OPENAI_ENDPOINT=                   # https://<resource>.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=            # e.g. gpt-4o

# ─── Azure AI Content Safety ────────────────────────────────────────────────
AZURE_CONTENT_SAFETY_KEY=
AZURE_CONTENT_SAFETY_ENDPOINT=

# ─── Azure Key Vault (Production Secret Management) ─────────────────────────
AZURE_KEY_VAULT_NAME=                    # Future: rotate secrets without redeployment

# ─── Application ────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Supabase ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=               # Server-side only — never expose to client

# ─── Upstash Redis (Rate Limiting) ──────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── Fallback LLM Keys (used when Azure is unavailable) ─────────────────────
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
TOGETHER_API_KEY=
```

> [!WARNING]
> **Never commit `.env*` files to version control.** The `.gitignore` already excludes them. Rotate any key that is accidentally exposed — treat exposure as a full compromise.

> [!NOTE]
> All keys are validated at server startup via `instrumentation.ts`. The server will throw a descriptive error and refuse to start if any required key is missing — there are no silent fallbacks in production.

---

## 📁 Project Structure

```
DEVSENTINEL-AI/
│
├── app/                              # Next.js 14 App Router
│   ├── api/                          # API route handlers (all auth-gated)
│   │   ├── upload/route.ts           # ZIP & GitHub repo ingestion
│   │   ├── scan/route.ts             # Scan orchestration trigger
│   │   ├── patch/route.ts            # Patch application
│   │   ├── commit/route.ts           # GitHub PR creation
│   │   ├── red-team-scan/route.ts    # Offensive validation endpoint
│   │   └── timeline/add/route.ts     # Timeline event logging
│   │
│   ├── dashboard/page.tsx            # Main analytics dashboard
│   ├── upload/page.tsx               # Repo ingestion UI
│   ├── scan-results/                 # Vulnerability results
│   │   ├── page.tsx
│   │   └── ScanResultsClient.tsx
│   ├── patches/page.tsx              # Patch management
│   ├── timeline/page.tsx             # Security event timeline
│   ├── settings/page.tsx             # User & integration settings
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx                    # Root layout (fonts, providers)
│
├── components/                       # Reusable UI components
│   ├── Navbar.tsx                    # Top navigation bar
│   ├── Sidebar.tsx                   # Collapsible side navigation
│   ├── RedTeamTerminal.tsx           # Live attack log viewer
│   ├── VulnerabilityCard.tsx         # Expandable finding card
│   ├── VulnerabilityTable.tsx        # Sortable findings table
│   ├── PatchDiff.tsx                 # Before/after code diff viewer
│   ├── Timeline.tsx                  # Chronological event feed
│   ├── ScanContext.tsx               # Global scan state provider
│   └── UploadForm.tsx                # Drag-and-drop upload
│
├── lib/                              # Core business logic
│   ├── orchestrator.ts               # Multi-agent pipeline coordinator
│   ├── sentinel.ts                   # Security scanning engine
│   ├── patcher.ts                    # Patch generation & application
│   ├── llm.ts                        # LLM provider abstraction layer
│   ├── github.ts                     # GitHub PR & commit integration
│   ├── extractZip.ts                 # Hardened ZIP extraction (Zip Slip safe)
│   ├── auth-utils.ts                 # Server-side auth helpers
│   ├── security-auditor-agent.ts     # LLM-based deep audit agent
│   ├── sanitizeUrl.ts                # URL credential scrubbing utility
│   ├── storage-utils.ts              # Supabase Storage helpers
│   ├── supabase.ts                   # Supabase client factory (server-only)
│   └── supabase-server.ts            # SSR Supabase client
│
├── services/
│   └── offensive_engine/             # Red-Team validation modules
│       ├── neurosploit-integration.ts
│       ├── osint-collector.ts
│       └── offensive-tools.ts
│
├── supabase/
│   └── schema.sql                    # Full database schema
│
├── middleware.ts                     # Edge auth + CSRF + rate-limit layer
├── instrumentation.ts                # Startup env validation
├── next.config.js                    # Security headers (CSP, HSTS, etc.)
├── tailwind.config.js
├── .env.local.example
└── package.json
```

---

## 🤖 Multi-Agent Pipeline

Each agent is a discrete, stateless unit. Agents communicate via structured JSON — no agent can directly mutate another agent's output.

### 🏗️ Architect Agent
Ingests the repository and builds a structural risk map. Identifies high-risk entry points (user-controlled inputs, exec calls, crypto operations), dependency chains, and sensitive file paths. Output: a ranked list of areas requiring deep scanning.

### 🔨 Builder Agent
Consumes the Architect's risk map and generates a **targeted, prioritized scanning strategy** — deciding which vulnerability classes to check for in which files, in which order. Eliminates coverage gaps while preventing redundant analysis.

### 🔎 Critic Agent
Independently reviews the Builder's scanning plan. Challenges assumptions, identifies likely false positive sources, and refines the approach before any code is actually analyzed. Acts as a quality gate on the strategy itself.

### 🛡️ Sentinel Agent
Executes the approved scanning plan using a **hybrid approach**:
- **Pattern engine** — high-speed regex rules for known vulnerability signatures (SQL injection patterns, hardcoded secrets, unsafe `eval()` usage, etc.)
- **LLM engine** — context-aware deep analysis for complex, multi-step vulnerabilities that pattern matching cannot detect

### ⚔️ Red-Team Validation Gate
After patches are generated, this gate uses **NeuroSploit-inspired offensive techniques** to actively attempt to exploit the patched code. A vulnerability is only marked **Resolved** when the exploit attempt definitively fails. This prevents the common failure mode of patches that change syntax without removing exploitability.

---

## 🔒 Security Remediation Log (ShieldX V1)

This release includes a comprehensive security overhaul. All vulnerabilities below were identified via the deep-scan audit and remediated before v1.0.0 shipped.

| Severity | Vulnerability | File(s) | Status |
|---|---|---|---|
| 🔴 Critical | **Zip Slip / Path Traversal** — crafted archives could overwrite arbitrary server files | `lib/extractZip.ts` | ✅ Fixed |
| 🔴 Critical | **Command Injection** — GitHub token interpolated into shell string via `exec()` | `app/api/upload/route.ts` | ✅ Fixed |
| 🔴 Critical | **Path Traversal** — `projectPath` user input not canonicalized before file ops | `app/api/red-team-scan/route.ts` | ✅ Fixed |
| 🔴 Critical | **Shell Injection** — OSINT `target` string interpolated into `echo "${target}" \| gf` | `services/offensive_engine/osint-collector.ts` | ✅ Fixed |
| 🔴 Critical | **Auth Bypass** — middleware matcher excluded all `/api/**` routes from JWT checks | `middleware.ts` | ✅ Fixed |
| 🟠 High | **API Key Hardcoded Fallbacks** — `MISSING_X_API_KEY` strings baked into source | `lib/llm.ts` | ✅ Fixed |
| 🟠 High | **No File Type Validation** — any file accepted as ZIP, no magic byte / size check | `app/api/upload/route.ts` | ✅ Fixed |
| 🟠 High | **Token Leak in Error Responses** — GitHub token forwarded in JSON error body | `app/api/upload/route.ts` | ✅ Fixed |
| 🟠 High | **Vulnerable Test Files Committed** — working exploit patterns in repo root | `vulnerable-test.js` | ✅ Removed |
| 🟠 High | **Service Role Key Scope** — Supabase service role accessible from client contexts | `lib/supabase.ts` | ✅ Fixed |
| 🟡 Medium | **No Rate Limiting** — expensive LLM/clone ops had no per-user throttle | All `/api/*` routes | ✅ Fixed |
| 🟡 Medium | **CSRF on Mutation Routes** — no Origin validation on commit/patch endpoints | `api/commit`, `api/patch` | ✅ Fixed |
| 🟡 Medium | **PII in LLM Prompts** — raw source code (with secrets) sent to third-party LLMs unredacted | `lib/orchestrator.ts` | ✅ Fixed |
| 🟡 Medium | **Temp Dir Leak on Crash** — cloned dirs not cleaned in `finally` block | `app/api/upload/route.ts` | ✅ Fixed |
| 🟢 Low | **Missing Security Headers** — no CSP, HSTS, X-Frame-Options in config | `next.config.js` | ✅ Fixed |
| 🟢 Low | **render.yaml Exposed** — deployment topology committed publicly | `render.yaml` | ✅ Redacted |

**Remediation highlights:**

- All shell execution migrated from `exec()` to `execFile()` — arguments are passed as arrays, zero shell interpolation possible
- ZIP extraction now validates `path.resolve(entryPath).startsWith(path.resolve(extractTo))` for every entry before write
- Env key validation moved to `instrumentation.ts` — server refuses to start if any required key is absent
- Upstash Redis rate limiting: `/api/upload` = 10 req/hr/user, `/api/scan` = 5 req/hr/user
- Supabase service role client is `'use server'` scoped with a runtime `window !== undefined` guard
- Security headers added to `next.config.js`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`

---

## 🚢 Deployment

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
