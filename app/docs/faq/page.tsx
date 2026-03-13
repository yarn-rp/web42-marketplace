"use client"

import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function DocsFaqPage() {
  const code = "rounded bg-muted px-1.5 py-0.5 font-mono text-sm"

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground">
          Common questions about the Web42 marketplace and agent ecosystem.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">General</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="general-1">
            <AccordionTrigger>What is Web42?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Web42 is an AI agent marketplace where engineers publish, share,
                and sell agentic solutions. Agents are platform-native packages
                that you install via the Web42 CLI. Think of it like npm, but
                for AI agents.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="general-2">
            <AccordionTrigger>Which platforms are supported?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                OpenClaw is currently the only active platform. OpenCode, Claude
                Code, and Codex are on the roadmap. Each agent targets a
                specific platform, declared in its{" "}
                <code className={code}>manifest.json</code>. See the{" "}
                <Link
                  href="/docs/platforms"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Platforms
                </Link>{" "}
                page for more details.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Installing agents</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="install-1">
            <AccordionTrigger>How do I install the CLI?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Run <code className={code}>npm install -g web42</code>. Requires
                Node.js 18 or later. The CLI is required for all marketplace
                operations — installing agents, publishing, searching, and more.
                See the{" "}
                <Link
                  href="/docs/cli"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  CLI docs
                </Link>{" "}
                for full usage.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="install-2">
            <AccordionTrigger>How do I install an agent?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                First authenticate with{" "}
                <code className={code}>web42 auth login</code>, then run{" "}
                <code className={code}>
                  web42 openclaw install @username/agent-name
                </code>
                . The CLI creates a workspace, prompts for any required config
                variables (API keys, tokens), and the agent is ready to use.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="install-3">
            <AccordionTrigger>What happens during install?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                The CLI creates a workspace directory in your OpenClaw
                environment, merges the agent&apos;s configuration, and prompts
                you for any config variables the agent needs (like API keys). An
                onboarding skill runs automatically to guide first-time setup.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Publishing agents</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="publish-1">
            <AccordionTrigger>How do I publish an agent?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Run <code className={code}>web42 init</code> to create a
                manifest and scaffold your agent files, build and customize your
                agent, then run <code className={code}>web42 push</code> to
                upload it to the marketplace. Your agent starts as private —
                configure it on the marketplace (readme, tags, pricing,
                visibility) and publish when ready. See the{" "}
                <Link
                  href="/docs/publishing"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Publishing guide
                </Link>{" "}
                for a walkthrough.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="publish-2">
            <AccordionTrigger>
              What files does <code className={code}>web42 init</code> create?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                It creates <code className={code}>manifest.json</code> (package
                metadata) and scaffolds platform-specific files:{" "}
                <code className={code}>AGENTS.md</code> (operating manual),{" "}
                <code className={code}>IDENTITY.md</code> (persona),{" "}
                <code className={code}>SOUL.md</code> (personality),{" "}
                <code className={code}>TOOLS.md</code> (local notes),{" "}
                <code className={code}>USER.md</code> (human info),{" "}
                <code className={code}>HEARTBEAT.md</code> (periodic tasks), and{" "}
                <code className={code}>BOOTSTRAP.md</code> (first-run setup).
                Existing files are not overwritten except{" "}
                <code className={code}>USER.md</code>. Skills in{" "}
                <code className={code}>skills/*/SKILL.md</code> are
                auto-detected.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="publish-3">
            <AccordionTrigger>What are skills?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Skills are self-contained capabilities for your agent, defined in{" "}
                <code className={code}>skills/&lt;name&gt;/SKILL.md</code>{" "}
                files. They&apos;re automatically detected during{" "}
                <code className={code}>web42 init</code> and{" "}
                <code className={code}>web42 pack</code>. The skill name is
                parsed from the first markdown heading and the description from
                the body. Skills can reference config variables that users
                provide during install.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="publish-4">
            <AccordionTrigger>How do config variables work?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Config variables are values that differ per user, like API keys
                or tokens. Define them in{" "}
                <code className={code}>manifest.json</code> under{" "}
                <code className={code}>configVariables</code> with a key, label,
                description, and whether they&apos;re required. They&apos;re
                also auto-extracted from skills during{" "}
                <code className={code}>web42 pack</code>. When someone installs
                your agent, the CLI prompts them for each variable. Values are
                stored locally in{" "}
                <code className={code}>.web42.config.json</code> and never
                uploaded.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Monetization</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="monetization-1">
            <AccordionTrigger>How does pricing work?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Agents can be free or paid. Paid agents have a minimum price of
                $5 USD. Creators keep 90% of each sale — Web42 takes a 10%
                platform fee. All payments are processed through Stripe. See the{" "}
                <Link
                  href="/docs/monetization"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Monetization docs
                </Link>{" "}
                for details.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="monetization-2">
            <AccordionTrigger>How do I set up Stripe?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Go to Settings &gt; Payouts on the Web42 marketplace and click
                &ldquo;Connect with Stripe.&rdquo; This creates a Stripe Express
                account. Complete Stripe&apos;s onboarding (identity
                verification and bank details) to enable payouts. You must
                finish onboarding before selling paid agents.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="monetization-3">
            <AccordionTrigger>Can buyers get a refund?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Yes, within 7 days of purchase. Buyers can request a refund from
                their order history. On refund, Stripe processes the return, the
                buyer&apos;s access to the agent is revoked, and the order is
                marked as refunded. After 7 days, sales are final.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Security</h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="security-1">
            <AccordionTrigger>Is my agent code secure?</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Yes. During <code className={code}>web42 pack</code>, secrets
                and API keys in your skill files are automatically stripped and
                replaced with placeholders. Buyers provide their own credentials
                during install. On the server side, row-level security (RLS)
                enforces access control on all data. Paid agents are gated
                behind purchase — only users with access can view files or
                install.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="security-2">
            <AccordionTrigger>
              Who can see my agent&apos;s files?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Only users with access. For free agents, access is granted when
                someone clicks &ldquo;Get for Free.&rdquo; For paid agents,
                access requires a purchase. The agent owner always has full
                access. Private and unlisted agents are not discoverable in
                search or explore.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  )
}
