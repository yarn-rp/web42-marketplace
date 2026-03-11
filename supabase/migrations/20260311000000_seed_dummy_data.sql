-- ============================================================
-- Seed: Dummy marketplace data for UI preview
-- ============================================================

-- 1. Seed tags
INSERT INTO public.tags (name) VALUES
  ('langchain'),
  ('openai'),
  ('gpt-4'),
  ('claude'),
  ('rag'),
  ('chat'),
  ('automation'),
  ('slack'),
  ('discord'),
  ('email'),
  ('typescript'),
  ('python'),
  ('multi-agent'),
  ('tool-use'),
  ('voice')
ON CONFLICT (name) DO NOTHING;

-- 2. Clean up any partial data from previous attempts
DELETE FROM public.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008'
);
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008'
);

-- 3. Seed auth users with raw_user_meta_data so the trigger creates correct public profiles
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Sarah Chen","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=sarah","user_name":"sarahchen"}', now() - interval '90 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Marcus Rivera","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=marcus","user_name":"mrivera"}', now() - interval '75 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'aiko@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Aiko Tanaka","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=aiko","user_name":"aikot"}', now() - interval '60 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'james@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"James Okafor","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=james","user_name":"jokafor"}', now() - interval '45 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Elena Petrov","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=elena","user_name":"elenapetrov"}', now() - interval '30 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dev@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Dev Patel","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=dev","user_name":"devp"}', now() - interval '20 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'luna@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Luna Kim","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=luna","user_name":"lunakim"}', now() - interval '15 days', now(), '', '', '', ''),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex@example.com', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWX', now(), '{"full_name":"Alex Moreno","avatar_url":"https://api.dicebear.com/9.x/notionists/svg?seed=alex","user_name":"alexm"}', now() - interval '10 days', now(), '', '', '', '');

-- 4. Update public profiles with bio/website/github that the trigger doesn't set
UPDATE public.users SET bio = 'Building AI agents for the real world. Ex-Google, now indie.', website = 'https://sarahchen.dev', github_handle = 'sarahchen' WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.users SET bio = 'Full-stack dev & AI enthusiast. Open source everything.', website = 'https://mrivera.io', github_handle = 'mrivera' WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.users SET bio = 'NLP researcher turned builder. Love shipping fast.', github_handle = 'aikot' WHERE id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.users SET bio = 'DevOps + AI. Making agents that actually work in production.', website = 'https://jokafor.com', github_handle = 'jokafor' WHERE id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.users SET bio = 'Healthcare AI specialist. Prev @Microsoft.', website = 'https://elenapetrov.com', github_handle = 'elenapetrov' WHERE id = 'a0000000-0000-0000-0000-000000000005';
UPDATE public.users SET bio = 'Obsessed with developer productivity. Building tools.', github_handle = 'devp' WHERE id = 'a0000000-0000-0000-0000-000000000006';
UPDATE public.users SET bio = 'Content & marketing automation. Making AI accessible.', website = 'https://lunakim.co', github_handle = 'lunakim' WHERE id = 'a0000000-0000-0000-0000-000000000007';
UPDATE public.users SET bio = 'Sales engineer. Building agents that close deals.', github_handle = 'alexm' WHERE id = 'a0000000-0000-0000-0000-000000000008';

-- 5. Seed agents
INSERT INTO public.agents (id, slug, name, description, readme, cover_image_url, manifest, owner_id, stars_count, remixes_count, installs_count, approved, featured, created_at) VALUES

-- Agent 1: Featured, top stars
('b0000000-0000-0000-0000-000000000001',
 'support-hero',
 'Support Hero',
 'A production-ready customer support agent that handles tickets, escalates issues, and learns from your knowledge base. Integrates with Slack, email, and Zendesk.',
 '# Support Hero

A complete customer support agent setup that handles L1/L2 tickets autonomously.

## What it does

- **Ticket triage**: Automatically categorizes and prioritizes incoming support requests
- **Knowledge base Q&A**: Answers common questions from your docs using RAG
- **Smart escalation**: Knows when to hand off to a human and includes full context
- **Multi-channel**: Works across Slack, email, and web chat simultaneously

## Setup

1. Install the agent: `web42 install @sarahchen/support-hero`
2. Configure your knowledge base path in `config.yaml`
3. Add your Slack webhook URL
4. Run `web42 start`

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `KNOWLEDGE_BASE_PATH` | Path to your docs directory | Yes |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | No |
| `ESCALATION_EMAIL` | Email for escalated tickets | Yes |
| `MAX_RETRIES` | Number of retries before escalation | No |

## Architecture

The agent uses a multi-step pipeline:

1. **Classifier** - Determines intent and urgency
2. **Retriever** - Pulls relevant context from knowledge base
3. **Responder** - Generates a helpful response
4. **Evaluator** - Checks quality before sending

## Performance

- 87% first-response resolution rate
- Average response time: 1.2 seconds
- Handles 500+ concurrent conversations',
 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?w=1200&h=500&fit=crop',
 '{"name":"support-hero","description":"Production-ready customer support agent","version":"2.1.0","author":"sarahchen","channels":["slack","email","web"],"skills":["ticket-triage","knowledge-qa","escalation"],"plugins":["zendesk","slack-webhook"],"modelPreferences":{"primary":"gpt-4o","fallback":"claude-3-haiku"},"tags":["support","rag","multi-channel"]}',
 'a0000000-0000-0000-0000-000000000001',
 342, 28, 1847, true, true,
 now() - interval '85 days'),

-- Agent 2: Featured
('b0000000-0000-0000-0000-000000000002',
 'code-reviewer',
 'Code Reviewer Pro',
 'AI-powered code review agent that analyzes PRs, suggests improvements, catches bugs, and enforces your team style guide. Plugs into GitHub Actions.',
 '# Code Reviewer Pro

Automated code review that actually understands your codebase.

## Features

- **Style enforcement**: Learns your team conventions and enforces them consistently
- **Bug detection**: Catches common patterns that lead to bugs
- **Security scanning**: Identifies potential vulnerabilities in new code
- **Performance hints**: Suggests optimizations for hot paths
- **Auto-summaries**: Generates clear PR descriptions from diffs

## Quick Start

```bash
web42 install @devp/code-reviewer
cd code-reviewer
cp .env.example .env  # Add your GitHub token
web42 start
```

## How It Works

The agent watches for new PRs via GitHub webhooks, then:

1. Fetches the diff and full file context
2. Runs analysis through multiple specialized reviewers
3. Posts inline comments on specific lines
4. Adds a summary comment with overall assessment

## Supported Languages

TypeScript, JavaScript, Python, Go, Rust, Java',
 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=500&fit=crop',
 '{"name":"code-reviewer","description":"AI code review agent for GitHub","version":"1.4.2","author":"devp","channels":["github"],"skills":["code-analysis","style-check","security-scan"],"plugins":["github-actions"],"modelPreferences":{"primary":"claude-3.5-sonnet","fallback":"gpt-4o"},"tags":["developer-tools","code-review","github"]}',
 'a0000000-0000-0000-0000-000000000006',
 287, 45, 2103, true, true,
 now() - interval '18 days'),

-- Agent 3: Featured
('b0000000-0000-0000-0000-000000000003',
 'sales-copilot',
 'Sales Copilot',
 'Your AI sales assistant that researches prospects, drafts personalized outreach, and prepares meeting briefs. Built for B2B SaaS teams.',
 '# Sales Copilot

An AI-powered sales assistant that helps you close more deals with less manual work.

## Capabilities

- **Prospect Research**: Automatically researches companies and contacts from LinkedIn and Crunchbase
- **Personalized Outreach**: Drafts cold emails that feel human and reference real signals
- **Meeting Prep**: Creates detailed briefs before every call with talking points
- **CRM Sync**: Updates Salesforce/HubSpot with call notes and next steps
- **Pipeline Insights**: Weekly digest of deal health and recommended actions

## Getting Started

```bash
web42 install @alexm/sales-copilot
```

Configure your CRM credentials in the manifest and you are ready to go.

## Results

Teams using Sales Copilot report:
- 3x more personalized touches per rep per day
- 40% higher response rates on outreach
- 2 hours saved per rep daily on research',
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=500&fit=crop',
 '{"name":"sales-copilot","description":"AI sales assistant for B2B teams","version":"1.2.0","author":"alexm","channels":["email","slack"],"skills":["prospect-research","email-drafting","meeting-prep"],"plugins":["salesforce","hubspot","linkedin"],"modelPreferences":{"primary":"gpt-4o"},"tags":["sales","outreach","crm"]}',
 'a0000000-0000-0000-0000-000000000008',
 198, 15, 923, true, true,
 now() - interval '9 days'),

-- Agent 4
('b0000000-0000-0000-0000-000000000004',
 'doc-writer',
 'Doc Writer',
 'Generates and maintains technical documentation from your codebase. Watches for changes and auto-updates API docs, guides, and changelogs.',
 '# Doc Writer

Keep your docs in sync with your code, automatically.

## Features

- Scans your codebase and generates API reference docs
- Watches for file changes and updates docs in real-time
- Generates changelogs from git commits
- Creates getting-started guides from README templates
- Supports Markdown, MDX, and OpenAPI output

## Usage

```bash
web42 install @mrivera/doc-writer
web42 start --watch
```

The agent will scan your project and generate docs in the `./docs` directory.',
 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1200&h=500&fit=crop',
 '{"name":"doc-writer","description":"Auto-generate docs from code","version":"0.9.1","author":"mrivera","channels":["cli"],"skills":["code-parsing","doc-generation","changelog"],"plugins":["openapi","markdown"],"modelPreferences":{"primary":"claude-3.5-sonnet"},"tags":["documentation","developer-tools"]}',
 'a0000000-0000-0000-0000-000000000002',
 156, 22, 678, true, false,
 now() - interval '50 days'),

-- Agent 5
('b0000000-0000-0000-0000-000000000005',
 'meeting-scribe',
 'Meeting Scribe',
 'Records, transcribes, and summarizes meetings. Extracts action items and sends follow-ups to all participants automatically.',
 '# Meeting Scribe

Never take meeting notes again.

## What It Does

- Joins your Google Meet / Zoom calls
- Transcribes in real-time with speaker identification
- Generates structured summaries with key decisions
- Extracts action items and assigns owners
- Sends follow-up emails to all participants
- Syncs action items to Linear/Jira

## Setup

Requires a Google Workspace or Zoom admin token for calendar access.',
 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?w=1200&h=500&fit=crop',
 '{"name":"meeting-scribe","description":"AI meeting notes and action items","version":"1.0.3","author":"aikot","channels":["google-meet","zoom"],"skills":["transcription","summarization","action-extraction"],"plugins":["google-calendar","linear","jira"],"modelPreferences":{"primary":"gpt-4o","fallback":"whisper"},"tags":["productivity","meetings","transcription"]}',
 'a0000000-0000-0000-0000-000000000003',
 221, 31, 1456, true, false,
 now() - interval '55 days'),

-- Agent 6
('b0000000-0000-0000-0000-000000000006',
 'patient-intake',
 'Patient Intake Bot',
 'HIPAA-aware intake agent for healthcare clinics. Collects patient information, medical history, and insurance details conversationally.',
 '# Patient Intake Bot

Streamline patient onboarding with a conversational AI agent.

## Features

- Conversational patient data collection
- Medical history gathering with smart follow-ups
- Insurance verification integration
- Multilingual support (EN, ES, ZH, KO)
- HIPAA-compliant data handling
- EHR integration (Epic, Cerner)

## Compliance

All data is encrypted at rest and in transit. No PHI is stored in model context. Audit logging enabled by default.

## Getting Started

```bash
web42 install @elenapetrov/patient-intake
```

Configure your EHR credentials and compliance settings in the manifest.',
 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=500&fit=crop',
 '{"name":"patient-intake","description":"HIPAA-aware patient intake agent","version":"1.1.0","author":"elenapetrov","channels":["web","phone"],"skills":["data-collection","insurance-verify","multilingual"],"plugins":["epic-ehr","cerner"],"modelPreferences":{"primary":"gpt-4o"},"tags":["healthcare","hipaa","intake"]}',
 'a0000000-0000-0000-0000-000000000005',
 89, 5, 312, true, false,
 now() - interval '28 days'),

-- Agent 7
('b0000000-0000-0000-0000-000000000007',
 'deploy-guard',
 'Deploy Guard',
 'CI/CD safety agent that reviews deployments, checks for breaking changes, runs smoke tests, and can auto-rollback if issues are detected.',
 '# Deploy Guard

Never ship a broken deploy again.

## How It Works

1. Hooks into your CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
2. Analyzes the diff for potential breaking changes
3. Runs automated smoke tests against staging
4. Monitors error rates post-deploy
5. Auto-rollbacks if anomalies detected

## Supported Platforms

- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

## Configuration

```yaml
thresholds:
  error_rate_increase: 5%
  latency_increase: 200ms
  rollback_window: 10m
```',
 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=500&fit=crop',
 '{"name":"deploy-guard","description":"CI/CD safety and auto-rollback agent","version":"0.8.0","author":"jokafor","channels":["github","gitlab"],"skills":["diff-analysis","smoke-testing","monitoring","rollback"],"plugins":["datadog","pagerduty"],"modelPreferences":{"primary":"claude-3.5-sonnet"},"tags":["devops","ci-cd","monitoring"]}',
 'a0000000-0000-0000-0000-000000000004',
 174, 19, 891, true, false,
 now() - interval '40 days'),

-- Agent 8
('b0000000-0000-0000-0000-000000000008',
 'content-engine',
 'Content Engine',
 'Multi-format content creation agent. Generates blog posts, social media threads, newsletters, and video scripts from a single brief.',
 '# Content Engine

One brief in, content everywhere out.

## Output Formats

- **Blog posts**: SEO-optimized long-form content
- **Twitter/X threads**: Engaging thread breakdowns
- **LinkedIn posts**: Professional tone adaptation
- **Newsletters**: Email-ready HTML content
- **Video scripts**: YouTube-ready scripts with timestamps

## Workflow

1. Submit a content brief (topic, audience, tone)
2. Agent researches and outlines
3. Generates drafts in all requested formats
4. You review and approve
5. Auto-publishes to connected platforms

## Integrations

WordPress, Ghost, Substack, Buffer, Typefully',
 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=500&fit=crop',
 '{"name":"content-engine","description":"Multi-format content creation agent","version":"1.3.0","author":"lunakim","channels":["web","slack"],"skills":["writing","seo","social-media","email"],"plugins":["wordpress","ghost","buffer"],"modelPreferences":{"primary":"claude-3.5-sonnet","fallback":"gpt-4o"},"tags":["content","marketing","writing"]}',
 'a0000000-0000-0000-0000-000000000007',
 245, 37, 1678, true, true,
 now() - interval '12 days'),

-- Agent 9
('b0000000-0000-0000-0000-000000000009',
 'data-analyst',
 'Data Analyst Agent',
 'Ask questions about your data in plain English. Connects to SQL databases, generates queries, creates visualizations, and explains insights.',
 '# Data Analyst Agent

Talk to your database like you talk to a colleague.

## Features

- Natural language to SQL query generation
- Automatic visualization suggestions
- Trend detection and anomaly alerts
- Scheduled report generation
- Supports PostgreSQL, MySQL, BigQuery, Snowflake

## Example

> "What were our top 10 customers by revenue last quarter?"

The agent will generate the SQL, run it safely (read-only), and present results with a chart.

## Safety

- Read-only database access by default
- Query review mode for sensitive environments
- Row-level access controls',
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=500&fit=crop',
 '{"name":"data-analyst","description":"Natural language data analysis agent","version":"0.7.2","author":"aikot","channels":["slack","web"],"skills":["sql-generation","visualization","reporting"],"plugins":["postgresql","bigquery","snowflake"],"modelPreferences":{"primary":"gpt-4o"},"tags":["data","analytics","sql"]}',
 'a0000000-0000-0000-0000-000000000003',
 132, 11, 534, true, false,
 now() - interval '42 days'),

-- Agent 10
('b0000000-0000-0000-0000-000000000010',
 'onboarding-buddy',
 'Onboarding Buddy',
 'New hire onboarding agent that guides employees through their first 90 days with personalized tasks, introductions, and check-ins.',
 '# Onboarding Buddy

Make every new hire feel like they belong from day one.

## Capabilities

- Personalized 30/60/90 day onboarding plans
- Automated introductions to team members
- IT setup checklist tracking
- Policy and handbook Q&A
- Weekly check-in conversations
- Manager notifications on progress

## Setup

Connect to your HRIS (BambooHR, Workday, etc.) and Slack workspace.',
 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=500&fit=crop',
 '{"name":"onboarding-buddy","description":"AI-powered new hire onboarding","version":"1.0.0","author":"sarahchen","channels":["slack","email"],"skills":["task-management","scheduling","q-and-a"],"plugins":["bamboohr","slack"],"modelPreferences":{"primary":"gpt-4o"},"tags":["hr","onboarding","productivity"]}',
 'a0000000-0000-0000-0000-000000000001',
 98, 8, 445, true, false,
 now() - interval '70 days'),

-- Agent 11
('b0000000-0000-0000-0000-000000000011',
 'discord-mod',
 'Discord Moderator',
 'Community moderation agent for Discord. Handles spam, enforces rules, answers FAQs, and manages ticket channels. Keeps your server clean 24/7.',
 '# Discord Moderator

Set it and forget it community moderation.

## Features

- Spam and raid detection
- Rule enforcement with configurable actions
- FAQ auto-responder from your docs
- Ticket channel management
- User reputation tracking
- Moderation analytics dashboard

## Quick Start

```bash
web42 install @mrivera/discord-mod
# Add your Discord bot token to .env
web42 start
```',
 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1200&h=500&fit=crop',
 '{"name":"discord-mod","description":"AI Discord community moderator","version":"2.0.1","author":"mrivera","channels":["discord"],"skills":["moderation","faq","ticketing"],"plugins":["discord-bot"],"modelPreferences":{"primary":"gpt-4o-mini"},"tags":["community","discord","moderation"]}',
 'a0000000-0000-0000-0000-000000000002',
 167, 26, 1234, true, false,
 now() - interval '65 days'),

-- Agent 12
('b0000000-0000-0000-0000-000000000012',
 'finance-tracker',
 'Finance Tracker',
 'Personal finance agent that categorizes transactions, tracks budgets, sends spending alerts, and generates monthly financial reports.',
 '# Finance Tracker

Your AI-powered personal CFO.

## What It Does

- Connects to your bank via Plaid
- Auto-categorizes every transaction
- Tracks budgets with smart alerts
- Monthly spending reports with insights
- Tax-deduction flagging for freelancers
- Natural language budget queries

## Privacy

Your financial data never leaves your infrastructure. The agent runs locally and only calls the LLM with anonymized category queries.',
 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=500&fit=crop',
 '{"name":"finance-tracker","description":"AI personal finance assistant","version":"0.6.0","author":"jokafor","channels":["web","slack"],"skills":["categorization","budgeting","reporting"],"plugins":["plaid","stripe"],"modelPreferences":{"primary":"gpt-4o-mini"},"tags":["finance","budgeting","personal"]}',
 'a0000000-0000-0000-0000-000000000004',
 76, 4, 289, true, false,
 now() - interval '35 days'),

-- Agent 13
('b0000000-0000-0000-0000-000000000013',
 'tutor-ai',
 'Tutor AI',
 'Adaptive learning agent that creates personalized lesson plans, quizzes, and explanations. Supports K-12 math, science, and language arts.',
 '# Tutor AI

Personalized education at scale.

## Features

- Adaptive difficulty based on student performance
- Step-by-step problem solving with explanations
- Quiz generation with instant feedback
- Progress tracking and parent reports
- Supports multiple learning styles
- Available in 8 languages

## Subjects

- Mathematics (K-12)
- Science (Biology, Chemistry, Physics)
- Language Arts
- History
- Computer Science basics',
 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&h=500&fit=crop',
 '{"name":"tutor-ai","description":"Adaptive AI tutoring agent","version":"1.5.0","author":"elenapetrov","channels":["web"],"skills":["lesson-planning","quiz-generation","adaptive-learning"],"plugins":[],"modelPreferences":{"primary":"gpt-4o"},"tags":["education","tutoring","k12"]}',
 'a0000000-0000-0000-0000-000000000005',
 203, 14, 967, true, false,
 now() - interval '25 days'),

-- Agent 14
('b0000000-0000-0000-0000-000000000014',
 'api-tester',
 'API Tester',
 'Generates comprehensive API test suites from your OpenAPI spec. Creates edge cases, load tests, and regression tests automatically.',
 '# API Tester

Generate complete test suites from your API spec in seconds.

## Capabilities

- Reads OpenAPI/Swagger specs
- Generates unit tests for every endpoint
- Creates edge case and error path tests
- Load testing scenarios
- Regression test baselines
- Outputs in Jest, Pytest, or Go test format

## Usage

```bash
web42 install @devp/api-tester
web42 run --spec ./openapi.yaml --output ./tests
```',
 NULL,
 '{"name":"api-tester","description":"Auto-generate API tests from specs","version":"0.4.0","author":"devp","channels":["cli"],"skills":["test-generation","spec-parsing","load-testing"],"plugins":["openapi"],"modelPreferences":{"primary":"claude-3.5-sonnet"},"tags":["testing","api","developer-tools"]}',
 'a0000000-0000-0000-0000-000000000006',
 118, 9, 523, true, false,
 now() - interval '14 days'),

-- Agent 15
('b0000000-0000-0000-0000-000000000015',
 'seo-optimizer',
 'SEO Optimizer',
 'Analyzes your website content and provides actionable SEO recommendations. Monitors rankings, suggests content updates, and generates meta tags.',
 '# SEO Optimizer

Data-driven SEO recommendations powered by AI.

## Features

- Full site content audit
- Keyword gap analysis
- Meta tag generation
- Content optimization suggestions
- Competitor monitoring
- Weekly ranking reports
- Internal linking recommendations

## Integrations

Google Search Console, Google Analytics, Ahrefs, SEMrush',
 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=1200&h=500&fit=crop',
 '{"name":"seo-optimizer","description":"AI-powered SEO analysis and optimization","version":"1.0.0","author":"lunakim","channels":["web","slack"],"skills":["content-audit","keyword-analysis","reporting"],"plugins":["google-search-console","ahrefs"],"modelPreferences":{"primary":"gpt-4o"},"tags":["seo","marketing","content"]}',
 'a0000000-0000-0000-0000-000000000007',
 145, 12, 687, true, false,
 now() - interval '8 days')

ON CONFLICT (id) DO NOTHING;

-- 5. Link agents to categories
-- Get category IDs
DO $$
DECLARE
  cat_support UUID;
  cat_healthcare UUID;
  cat_devtools UUID;
  cat_assistant UUID;
  cat_sales UUID;
  cat_marketing UUID;
  cat_education UUID;
  cat_finance UUID;
  cat_content UUID;
  cat_productivity UUID;
BEGIN
  SELECT id INTO cat_support FROM public.categories WHERE name = 'Customer Support';
  SELECT id INTO cat_healthcare FROM public.categories WHERE name = 'Healthcare';
  SELECT id INTO cat_devtools FROM public.categories WHERE name = 'Developer Tools';
  SELECT id INTO cat_assistant FROM public.categories WHERE name = 'Personal Assistant';
  SELECT id INTO cat_sales FROM public.categories WHERE name = 'Sales';
  SELECT id INTO cat_marketing FROM public.categories WHERE name = 'Marketing';
  SELECT id INTO cat_education FROM public.categories WHERE name = 'Education';
  SELECT id INTO cat_finance FROM public.categories WHERE name = 'Finance';
  SELECT id INTO cat_content FROM public.categories WHERE name = 'Content Creation';
  SELECT id INTO cat_productivity FROM public.categories WHERE name = 'Productivity';

  -- Support Hero -> Customer Support
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', cat_support)
  ON CONFLICT DO NOTHING;

  -- Code Reviewer -> Developer Tools
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000002', cat_devtools)
  ON CONFLICT DO NOTHING;

  -- Sales Copilot -> Sales
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000003', cat_sales)
  ON CONFLICT DO NOTHING;

  -- Doc Writer -> Developer Tools
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000004', cat_devtools)
  ON CONFLICT DO NOTHING;

  -- Meeting Scribe -> Productivity
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000005', cat_productivity)
  ON CONFLICT DO NOTHING;

  -- Patient Intake -> Healthcare
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000006', cat_healthcare)
  ON CONFLICT DO NOTHING;

  -- Deploy Guard -> Developer Tools
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000007', cat_devtools)
  ON CONFLICT DO NOTHING;

  -- Content Engine -> Content Creation, Marketing
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000008', cat_content),
    ('b0000000-0000-0000-0000-000000000008', cat_marketing)
  ON CONFLICT DO NOTHING;

  -- Data Analyst -> Productivity
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000009', cat_productivity)
  ON CONFLICT DO NOTHING;

  -- Onboarding Buddy -> Personal Assistant
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000010', cat_assistant)
  ON CONFLICT DO NOTHING;

  -- Discord Mod -> Customer Support
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000011', cat_support)
  ON CONFLICT DO NOTHING;

  -- Finance Tracker -> Finance
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000012', cat_finance)
  ON CONFLICT DO NOTHING;

  -- Tutor AI -> Education
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000013', cat_education)
  ON CONFLICT DO NOTHING;

  -- API Tester -> Developer Tools
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000014', cat_devtools)
  ON CONFLICT DO NOTHING;

  -- SEO Optimizer -> Marketing
  INSERT INTO public.agent_categories (agent_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000015', cat_marketing)
  ON CONFLICT DO NOTHING;
END $$;

-- 6. Link agents to tags
DO $$
DECLARE
  tag_langchain UUID;
  tag_openai UUID;
  tag_gpt4 UUID;
  tag_claude UUID;
  tag_rag UUID;
  tag_chat UUID;
  tag_automation UUID;
  tag_slack UUID;
  tag_discord UUID;
  tag_email UUID;
  tag_typescript UUID;
  tag_python UUID;
  tag_multiagent UUID;
  tag_tooluse UUID;
  tag_voice UUID;
BEGIN
  SELECT id INTO tag_langchain FROM public.tags WHERE name = 'langchain';
  SELECT id INTO tag_openai FROM public.tags WHERE name = 'openai';
  SELECT id INTO tag_gpt4 FROM public.tags WHERE name = 'gpt-4';
  SELECT id INTO tag_claude FROM public.tags WHERE name = 'claude';
  SELECT id INTO tag_rag FROM public.tags WHERE name = 'rag';
  SELECT id INTO tag_chat FROM public.tags WHERE name = 'chat';
  SELECT id INTO tag_automation FROM public.tags WHERE name = 'automation';
  SELECT id INTO tag_slack FROM public.tags WHERE name = 'slack';
  SELECT id INTO tag_discord FROM public.tags WHERE name = 'discord';
  SELECT id INTO tag_email FROM public.tags WHERE name = 'email';
  SELECT id INTO tag_typescript FROM public.tags WHERE name = 'typescript';
  SELECT id INTO tag_python FROM public.tags WHERE name = 'python';
  SELECT id INTO tag_multiagent FROM public.tags WHERE name = 'multi-agent';
  SELECT id INTO tag_tooluse FROM public.tags WHERE name = 'tool-use';
  SELECT id INTO tag_voice FROM public.tags WHERE name = 'voice';

  INSERT INTO public.agent_tags (agent_id, tag_id) VALUES
    -- Support Hero
    ('b0000000-0000-0000-0000-000000000001', tag_rag),
    ('b0000000-0000-0000-0000-000000000001', tag_slack),
    ('b0000000-0000-0000-0000-000000000001', tag_email),
    ('b0000000-0000-0000-0000-000000000001', tag_openai),
    ('b0000000-0000-0000-0000-000000000001', tag_chat),
    -- Code Reviewer
    ('b0000000-0000-0000-0000-000000000002', tag_claude),
    ('b0000000-0000-0000-0000-000000000002', tag_typescript),
    ('b0000000-0000-0000-0000-000000000002', tag_automation),
    ('b0000000-0000-0000-0000-000000000002', tag_tooluse),
    -- Sales Copilot
    ('b0000000-0000-0000-0000-000000000003', tag_openai),
    ('b0000000-0000-0000-0000-000000000003', tag_email),
    ('b0000000-0000-0000-0000-000000000003', tag_automation),
    -- Doc Writer
    ('b0000000-0000-0000-0000-000000000004', tag_claude),
    ('b0000000-0000-0000-0000-000000000004', tag_automation),
    ('b0000000-0000-0000-0000-000000000004', tag_typescript),
    -- Meeting Scribe
    ('b0000000-0000-0000-0000-000000000005', tag_openai),
    ('b0000000-0000-0000-0000-000000000005', tag_voice),
    ('b0000000-0000-0000-0000-000000000005', tag_automation),
    -- Patient Intake
    ('b0000000-0000-0000-0000-000000000006', tag_openai),
    ('b0000000-0000-0000-0000-000000000006', tag_chat),
    ('b0000000-0000-0000-0000-000000000006', tag_multiagent),
    -- Deploy Guard
    ('b0000000-0000-0000-0000-000000000007', tag_claude),
    ('b0000000-0000-0000-0000-000000000007', tag_automation),
    ('b0000000-0000-0000-0000-000000000007', tag_tooluse),
    -- Content Engine
    ('b0000000-0000-0000-0000-000000000008', tag_claude),
    ('b0000000-0000-0000-0000-000000000008', tag_openai),
    ('b0000000-0000-0000-0000-000000000008', tag_automation),
    -- Data Analyst
    ('b0000000-0000-0000-0000-000000000009', tag_openai),
    ('b0000000-0000-0000-0000-000000000009', tag_python),
    ('b0000000-0000-0000-0000-000000000009', tag_tooluse),
    -- Onboarding Buddy
    ('b0000000-0000-0000-0000-000000000010', tag_slack),
    ('b0000000-0000-0000-0000-000000000010', tag_chat),
    ('b0000000-0000-0000-0000-000000000010', tag_automation),
    -- Discord Mod
    ('b0000000-0000-0000-0000-000000000011', tag_discord),
    ('b0000000-0000-0000-0000-000000000011', tag_chat),
    ('b0000000-0000-0000-0000-000000000011', tag_automation),
    -- Finance Tracker
    ('b0000000-0000-0000-0000-000000000012', tag_openai),
    ('b0000000-0000-0000-0000-000000000012', tag_automation),
    -- Tutor AI
    ('b0000000-0000-0000-0000-000000000013', tag_openai),
    ('b0000000-0000-0000-0000-000000000013', tag_chat),
    -- API Tester
    ('b0000000-0000-0000-0000-000000000014', tag_claude),
    ('b0000000-0000-0000-0000-000000000014', tag_typescript),
    ('b0000000-0000-0000-0000-000000000014', tag_tooluse),
    -- SEO Optimizer
    ('b0000000-0000-0000-0000-000000000015', tag_openai),
    ('b0000000-0000-0000-0000-000000000015', tag_automation)
  ON CONFLICT DO NOTHING;
END $$;
