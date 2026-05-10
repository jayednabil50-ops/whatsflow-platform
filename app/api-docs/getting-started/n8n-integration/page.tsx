import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsPageNav } from "@/components/docs/docs-page-nav";
import { DocsToc } from "@/components/docs/docs-toc";

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "step-1-access-token", label: "Step 1: Personal Access Token" },
  { id: "step-2-install-node", label: "Step 2: Install the Node" },
  { id: "step-3-use-node", label: "Step 3: Using the Node" },
];

const PKG_NAME = `n8n-nodes-hotsapeapi`;

export default function N8nIntegrationPage() {
  return (
    <div className="flex gap-8 px-6 py-10 md:px-10 xl:px-14">
      {/* ── Main content ─────────────────────────────────────── */}
      <article className="min-w-0 flex-1 pb-16">
        {/* Breadcrumb */}
        <DocsBreadcrumb
          crumbs={[
            { label: "Getting Started" },
            { label: "n8n Integration" },
          ]}
        />

        {/* Badge + Title */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-xs font-semibold text-emerald-400">
            Getting Started
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
            NEW
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          n8n Integration (Community Node)
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">
          Easily automate your WhatsApp workflows using our official n8n community node. Extremely
          user-friendly with no API knowledge required.
        </p>

        <hr className="my-8 border-white/[0.06]" />

        {/* ── Introduction ────────────────────────────────── */}
        <section id="introduction" className="scroll-mt-24">
          <h2 className="text-xl font-semibold text-white">Introduction</h2>
          <p className="mt-3 text-sm leading-7 text-white/50">
            We are thrilled to announce our official{" "}
            <strong className="font-semibold text-white/80">n8n Community Node</strong>! This node
            makes it incredibly easy to integrate HotSape API into your n8n workflows. It is
            extremely user-friendly and completely bypasses the need for deep API knowledge or
            complex HTTP requests.
          </p>

          {/* NPM package pill */}
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-[#cb3837]/20 text-xs font-bold text-[#cb3837]">
              npm
            </div>
            <div>
              <p className="text-[11px] text-white/30">NPM Package</p>
              <p className="font-mono text-sm font-semibold text-emerald-400">{PKG_NAME}</p>
            </div>
          </div>
        </section>

        <hr className="my-10 border-white/[0.06]" />

        {/* ── Step 1 ──────────────────────────────────────── */}
        <section id="step-1-access-token" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-black">
              1
            </span>
            <h2 className="text-xl font-semibold text-white">Get Your Personal Access Token</h2>
          </div>

          <p className="text-sm leading-7 text-white/50">
            To use the n8n node, you need to authenticate using your{" "}
            <strong className="font-semibold text-white/80">Personal Access Token</strong>. This
            token allows the node to manage your sessions, fetch dynamic lists, and send messages
            seamlessly.
          </p>

          <DocsCallout variant="warning">
            <strong>Important:</strong> Do <em>NOT</em> use a Session API Key for the n8n node.
            You must use the <strong>Personal Access Token</strong>.
          </DocsCallout>

          <ol className="mt-4 space-y-3">
            {[
              <>
                Log into your{" "}
                <strong className="font-semibold text-white/80">HotSape API dashboard</strong>
              </>,
              <>
                Navigate to{" "}
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
                  Settings
                </span>{" "}
                →{" "}
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[12px]">
                  Personal Access Token
                </span>
              </>,
              <>
                Click <strong className="font-semibold text-white/80">Generate</strong> to create
                a new token
              </>,
              <>
                Copy the token and keep it secure — you will need this inside n8n
              </>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-7 text-white/50">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] font-semibold text-white/50">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <hr className="my-10 border-white/[0.06]" />

        {/* ── Step 2 ──────────────────────────────────────── */}
        <section id="step-2-install-node" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-black">
              2
            </span>
            <h2 className="text-xl font-semibold text-white">Install the Node in n8n</h2>
          </div>

          <p className="text-sm leading-7 text-white/50">
            Installing a community node in n8n is quick and easy directly from the UI:
          </p>

          <ol className="mt-4 space-y-3">
            {[
              "Open your n8n instance",
              <>
                Navigate to{" "}
                <strong className="font-semibold text-white/80">Settings</strong> (gear icon on
                left sidebar) →{" "}
                <strong className="font-semibold text-white/80">Community Nodes</strong>
              </>,
              <>
                Click{" "}
                <strong className="font-semibold text-white/80">Install a community node</strong>
              </>,
              <>
                Enter the exact package name:
                <div className="mt-2">
                  <DocsCodeBlock code={PKG_NAME} lang="plaintext" />
                </div>
              </>,
              <>
                Check the{" "}
                <span className="italic">"I understand the risks"</span> box and click{" "}
                <strong className="font-semibold text-white/80">Install</strong>
              </>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-7 text-white/50">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] font-semibold text-white/50">
                  {i + 1}
                </span>
                <div className="flex-1">{step}</div>
              </li>
            ))}
          </ol>

          <DocsCallout variant="info">
            <strong>Self-hosted Docker users:</strong> Add{" "}
            <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-emerald-300">
              n8n-nodes-hotsapeapi
            </code>{" "}
            to your{" "}
            <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[12px] text-emerald-300">
              N8N_CUSTOM_EXTENSIONS
            </code>{" "}
            environment variable.
          </DocsCallout>
        </section>

        <hr className="my-10 border-white/[0.06]" />

        {/* ── Step 3 ──────────────────────────────────────── */}
        <section id="step-3-use-node" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-black">
              3
            </span>
            <h2 className="text-xl font-semibold text-white">Using the Node in Your Workflow</h2>
          </div>

          <p className="text-sm leading-7 text-white/50">
            Once installed, start building powerful automations immediately:
          </p>

          <ol className="mt-4 space-y-3">
            {[
              <>
                Open a workflow and click{" "}
                <strong className="font-semibold text-white/80">+ Add node</strong>
              </>,
              <>
                Search for <strong className="font-semibold text-white/80">HotSape API</strong>{" "}
                and add it to your canvas
              </>,
              "Click the node to open its configuration panel",
              <>
                Under <strong className="font-semibold text-white/80">Credentials</strong>,
                select{" "}
                <span className="italic">"Create New Credential"</span> → paste your Personal
                Access Token
              </>,
              <>
                Select the <strong className="font-semibold text-white/80">Resource</strong>{" "}
                (Message, Session, Contact, Group) and the{" "}
                <strong className="font-semibold text-white/80">Operation</strong> (Send Message,
                Create Session, etc.)
              </>,
              <>
                Fill in the required fields — the node will{" "}
                <strong className="font-semibold text-emerald-400">
                  dynamically load your active sessions!
                </strong>
              </>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-7 text-white/50">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] text-[11px] font-semibold text-white/50">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <DocsCallout variant="success">
            The node automatically fetches your active sessions so you never have to copy-paste
            session IDs manually.
          </DocsCallout>
        </section>

        {/* ── Prev / Next ───────────────────────────────── */}
        <DocsPageNav
          prev={{
            label: "Using Proxies",
            href: "/api-docs/getting-started/proxies",
          }}
          next={{
            label: "Official SDKs – Node.js, Python & Laravel",
            href: "/api-docs/developer-sdks/official-sdks",
          }}
        />
      </article>

      {/* ── Right TOC ────────────────────────────────────────── */}
      <DocsToc items={TOC} />
    </div>
  );
}
