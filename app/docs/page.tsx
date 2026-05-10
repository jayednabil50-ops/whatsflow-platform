import { headers } from "next/headers";
import {
  BookOpen,
  CheckCircle2,
  KeyRound,
  QrCode,
  Send,
  ShieldCheck,
  Webhook,
  Workflow,
  Zap
} from "lucide-react";
import { Nav } from "@/components/nav";
import { CodeBlock } from "@/components/ui/code-block";
import { DataTable } from "@/components/ui/data-table";
import { BRAND } from "@/lib/brand";
import { resolveServerPublicBaseUrl } from "@/lib/platform/public-base-url.server";
import {
  codeSamples,
  docsNav,
  endpointRows,
  webhookEvents,
  webhookPayload
} from "@/lib/mocks/data";

const quickstartSteps = [
  {
    id: "create-a-session",
    icon: BookOpen,
    title: "1. Create a session",
    body: "Create a WhatsApp session from the dashboard or POST to `/api/whatsapp/sessions` with a name, country code, phone number, and optional webhook URL."
  },
  {
    id: "connect-qr",
    icon: QrCode,
    title: "2. Connect the phone",
    body: "Call `/api/whatsapp/sessions/{id}/qr`, then scan the QR from WhatsApp > Linked Devices. The status route will switch from `connecting` to `connected`."
  },
  {
    id: "send-text",
    icon: Send,
    title: "3. Generate a session API key",
    body: "Create or rotate the session API key from `/api/whatsapp/sessions/{id}/api-key`. Use that key as the Bearer token for `/api/send-message`."
  },
  {
    id: "typing-and-seen",
    icon: Zap,
    title: "4. Copy the typing and seen endpoints",
    body: "Use `/api/send-presence-update` or `/api/send-typing` for presence signals, and `/api/send-seen` with the webhook `message.id` to mark a chat as seen."
  },
  {
    id: "webhook-setup",
    icon: Webhook,
    title: "5. Save a webhook endpoint",
    body: "POST the endpoint URL to `/api/whatsapp/sessions/{id}/webhook`. Inbound replies are delivered with signed JSON payloads and retry tracking."
  },
  {
    id: "contacts",
    icon: Workflow,
    title: "6. Lookup contacts and numbers",
    body: "Use `/api/contacts`, `/api/check-number/{phoneNumber}`, `/api/lid-from-pn/{pn}`, and `/api/pn-from-lid/{lid}` to resolve WhatsApp identities inside your automations."
  }
];

const webhookHeaders = [
  ["X-WhatsFlow-Delivery", "Unique delivery id for tracing one webhook attempt."],
  ["X-WhatsFlow-Event", "Event name such as `message.received` or `message.sent`."],
  ["X-WhatsFlow-Timestamp", "Unix timestamp in milliseconds used for replay protection."],
  ["X-WhatsFlow-Signature", "HMAC SHA-256 signature in the format `sha256=<digest>`."]
];

const troubleshootingNotes = [
  "If the QR appears but the session never connects, refresh the QR so stale device keys are cleared before linking again.",
  "If incoming replies do not reach your webhook, confirm the webhook is saved on the same session that scanned the QR.",
  "If `/api/send-message` returns a session connection error, reconnect the session or rotate the QR after a server restart.",
  "If `/api/send-seen` fails, pass the inbound `message.id` from your webhook payload or let the route fall back to the latest saved inbound message.",
  "If Google sign-in fails, confirm the Google OAuth provider and callback URL are enabled in your Supabase project."
];

const copyReadyCurlBlocks = [
  {
    title: "Send a WhatsApp message",
    description: "Paste this into cURL or an n8n HTTP Request node to reply to the same contact that triggered your webhook.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "{{ $json.body.data.replyTarget || $json.body.data.remoteJid }}",
    "text": "Hello! We received your message."
  }'`
  },
  {
    title: "Presence update",
    description: "Use this before the reply request if you want WhatsApp to show typing, recording, or paused state.",
    code: `curl -X POST https://your-domain.com/api/send-presence-update \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "{{ $json.body.data.replyTarget || $json.body.data.remoteJid }}",
    "presence": "composing",
    "durationMs": 4000
  }'`
  },
  {
    title: "Seen animation",
    description: "Mark the inbound chat as seen by passing the message id from your webhook payload.",
    code: `curl -X POST https://your-domain.com/api/send-seen \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "{{ $json.body.data.replyTarget || $json.body.data.remoteJid }}",
    "messageId": "{{ $json.body.data.message.id }}"
  }'`
  },
  {
    title: "Webhook automation flow",
    description: "This is the basic order for an n8n flow: seen, presence update, then send the final text reply.",
    code: `1. POST /api/send-seen
2. POST /api/send-presence-update
3. POST /api/send-message

Use the same Bearer key for all three requests and keep the same \`remoteJid\` from the webhook body.`
  },
  {
    title: "Contact lookup",
    description: "Fetch one synced contact, their resolved phone number, and any known LID mapping.",
    code: `curl -X GET https://your-domain.com/api/contacts/8801712345678 \\
  -H "Authorization: Bearer wfk_live_xxx"`
  },
  {
    title: "Poll message",
    description: "Send a poll through the same public send endpoint used for text and media.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "poll": {
      "name": "What should we send next?",
      "options": ["Catalog", "Pricing", "Human support"]
    }
  }'`
  },
  {
    title: "Send an image",
    description:
      "Send an image with an optional caption and mentions. Set `viewOnce: true` to make the image disappear after the recipient opens it.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "media": "https://your-cdn.com/photo.jpg",
    "mediaType": "image",
    "caption": "Here is the catalog you asked for.",
    "viewOnce": false
  }'`
  },
  {
    title: "Send a video",
    description:
      "Same shape as images. Caption is optional. WhatsApp will auto-generate a thumbnail.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "media": "https://your-cdn.com/clip.mp4",
    "mediaType": "video",
    "caption": "30-second product walkthrough."
  }'`
  },
  {
    title: "Send a sticker",
    description:
      "Stickers must be served as a WebP file. They show up in the chat without a caption.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "media": "https://your-cdn.com/sticker.webp",
    "mediaType": "sticker"
  }'`
  },
  {
    title: "Send an audio / voice note",
    description:
      "Pass `voiceNote: true` (or `ptt: true`) so the recipient sees the WhatsApp voice-note bubble.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "media": "https://your-cdn.com/voice.ogg",
    "mediaType": "audio",
    "mimetype": "audio/ogg; codecs=opus",
    "voiceNote": true
  }'`
  },
  {
    title: "Send a document",
    description:
      "Pass `fileName` and `mimetype` so WhatsApp shows the right icon and download name.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "media": "https://your-cdn.com/invoice.pdf",
    "mediaType": "document",
    "fileName": "invoice-2026-001.pdf",
    "mimetype": "application/pdf",
    "caption": "Your invoice is attached."
  }'`
  },
  {
    title: "Reply to a message",
    description:
      "Quote any incoming message by passing the original `key` (from the webhook payload) inside `quoted`. Works with text, media, polls — any send call.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "{{ $json.body.data.replyTarget }}",
    "text": "Thanks! Confirmed.",
    "quoted": {
      "key": {
        "remoteJid": "{{ $json.body.data.remoteJid }}",
        "fromMe": false,
        "id": "{{ $json.body.data.message.id }}"
      },
      "message": {
        "conversation": "{{ $json.body.data.message.text }}"
      }
    }
  }'`
  },
  {
    title: "Send a reaction emoji",
    description:
      "React to any message id from your webhook. Pass an empty string to remove a previously sent reaction.",
    code: `curl -X POST https://your-domain.com/api/send-reaction \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "remoteJid": "{{ $json.body.data.remoteJid }}",
    "messageId": "{{ $json.body.data.message.id }}",
    "emoji": "👍"
  }'`
  },
  {
    title: "Edit / delete a sent message",
    description:
      "Edit text within 15 minutes of sending, or delete-for-everyone to remove it from the chat.",
    code: `# Edit
curl -X POST https://your-domain.com/api/messages/{messageId}/edit \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "remoteJid": "8801712345678@s.whatsapp.net", "text": "Updated text." }'

# Delete
curl -X POST https://your-domain.com/api/messages/{messageId}/delete \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{ "remoteJid": "8801712345678@s.whatsapp.net" }'`
  },
  {
    title: "Send a contact card",
    description:
      "Send a vCard to share another contact. Useful for sales handoffs.",
    code: `curl -X POST https://your-domain.com/api/send-message \\
  -H "Authorization: Bearer wfk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "8801712345678",
    "contact": {
      "fullName": "Jane Doe",
      "phone": "8801999999999",
      "organization": "Acme Inc."
    }
  }'`
  }
];

export default async function DocsPage() {
  const requestHeaders = await headers();
  const baseUrl = resolveServerPublicBaseUrl(requestHeaders);
  const docsCodeSamples = Object.fromEntries(
    Object.entries(codeSamples).map(([language, sample]) => [
      language,
      sample.replaceAll("https://your-domain.com", baseUrl)
    ])
  ) as typeof codeSamples;
  const docsCurlBlocks = copyReadyCurlBlocks.map((block) => ({
    ...block,
    code: block.code.replaceAll("https://your-domain.com", baseUrl)
  }));

  return (
    <div className="min-h-screen bg-background page-noise">
      <Nav />

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-border bg-card/90 p-4 backdrop-blur lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold">{BRAND} Docs</p>
              <p className="text-xs text-muted-foreground">Sessions, send API, webhooks</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {docsNav.map((group) => (
              <div key={group.section}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.section}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                      className="block rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section
            id="overview"
            className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_42%)]" />
            <div className="relative">
              <p className="text-sm font-semibold text-accent">Operational WhatsApp API docs</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Connect a number, capture inbound replies, and send messages from one session-scoped API.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                This documentation mirrors the product you already have in the app: session creation,
                QR linking, Bearer-auth send requests, webhook delivery monitoring, retry history,
                and signed payload verification.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {[
                  {
                    icon: KeyRound,
                    title: "Session API keys",
                    body: "Each session has its own send key."
                  },
                  {
                    icon: Webhook,
                    title: "Signed webhooks",
                    body: "HMAC headers on every delivery."
                  },
                  {
                    icon: Workflow,
                    title: "Retry visibility",
                    body: "Webhook attempts are stored for review."
                  },
                  {
                    icon: ShieldCheck,
                    title: "Safe defaults",
                    body: "Queue pacing and status checks stay inside the app."
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <item.icon className="h-5 w-5 text-accent" />
                    <p className="mt-4 font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="authentication" className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div id="send-text">
              <CodeBlock language="bash" examples={docsCodeSamples} title="Send a text message" />
            </div>

            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                <Zap className="h-4 w-4" />
                Authentication
              </div>
              <h2 className="mt-3 text-2xl font-semibold">Bearer auth is session-scoped.</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Generate an API key from the session detail page or via the session API key route.
                Use that key only for the public send endpoint. Dashboard routes continue to use the
                signed-in workspace session from Supabase auth.
              </p>

              <div className="mt-5 rounded-2xl border border-border bg-background p-4 font-mono text-xs text-emerald-100">
                Authorization: Bearer wfk_live_xxx
              </div>

              <div className="mt-5 space-y-3">
                {[
                  "Dashboard APIs: cookie-based authenticated workspace session.",
                  "Public send API: session API key in the Authorization header.",
                  "Animation APIs: `/api/send-typing` and `/api/send-seen` are session-key authenticated too.",
                  "Webhook verification: HMAC signature built from timestamp + raw request body.",
                  "Deployment note: Baileys needs a persistent Node process. Pure serverless runtimes are not enough for long-lived WhatsApp sockets."
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-2xl border border-border bg-background/50 p-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="create-a-session" className="rounded-3xl border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold">Quickstart</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              These are the core steps your users will follow to get from an empty workspace to a
              live WhatsApp integration.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {quickstartSteps.map((step) => (
                <article
                  key={step.title}
                  id={step.id}
                  className="rounded-2xl border border-border bg-background/60 p-5"
                >
                  <step.icon className="h-5 w-5 text-accent" />
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{step.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="typing-and-seen" className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Copy-ready curl examples</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  These are the exact snippets your users can copy into cURL or an n8n HTTP Request
                  node after a webhook fires. Replace `wfk_live_xxx` with the session-specific API
                  key from the dashboard. The base URL below follows the current live deployment.
                </p>
              </div>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Use the same `remoteJid`
              </span>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {docsCurlBlocks.map((block) => (
                <article
                  key={block.title}
                  className="rounded-2xl border border-border bg-background/60 p-5"
                >
                  <p className="font-semibold">{block.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {block.description}
                  </p>
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-2xl border border-border bg-background p-4 font-mono text-xs leading-6 text-emerald-100">
                    {block.code}
                  </pre>
                </article>
              ))}
            </div>
          </section>

          <section id="session-status" className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Core endpoints</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  These routes reflect the current product surface in the app today, including
                  status checks, contact lookup, number verification, presence updates, and
                  richer outbound message types.
                </p>
              </div>
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                Runtime: Next.js Node routes
              </span>
            </div>

            <div className="mt-5">
              <div id="contacts" />
              <DataTable rows={endpointRows} />
            </div>
          </section>

          <section id="webhook-payload" className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold">Webhook events</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                The current implementation delivers inbound and outbound message activity for direct
                chats. Each session can point to a different endpoint.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {webhookEvents.map((event) => (
                  <span
                    key={event}
                    className="rounded-xl border border-border bg-background px-3 py-1.5 font-mono text-xs text-muted-foreground"
                  >
                    {event}
                  </span>
                ))}
              </div>

              <div id="webhook-headers" className="mt-6 rounded-2xl border border-border bg-background/50 p-4">
                <p className="text-sm font-semibold">Webhook headers</p>
                <div className="mt-4 space-y-3">
                  {webhookHeaders.map(([header, detail]) => (
                    <div key={header} className="rounded-xl border border-border bg-background p-3">
                      <p className="font-mono text-xs text-accent">{header}</p>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-background p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
                <Webhook className="h-4 w-4" />
                Example payload
              </div>
              <pre className="overflow-x-auto font-mono text-xs leading-6 text-emerald-100">
                {webhookPayload}
              </pre>
            </div>
          </section>

          <section id="retries" className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold">Retry model</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                When a webhook endpoint returns a non-2xx response, the delivery stays pending and
                is retried with exponential backoff. Each attempt is stored in the webhook delivery
                table so the dashboard can surface status, response codes, and error messages.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Attempt 1: immediate delivery",
                  "Attempt 2: roughly 1 second later",
                  "Attempt 3: roughly 2 seconds later",
                  "Final state: delivered or failed"
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="troubleshooting" className="rounded-3xl border border-border bg-card p-6">
              <h2 className="text-2xl font-semibold">Troubleshooting</h2>
              <div className="mt-5 space-y-3">
                {troubleshootingNotes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-border bg-background/60 p-4 text-sm leading-7 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="security-notes" className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <ShieldCheck className="h-4 w-4" />
              Security notes
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                "Keep the session API key on your server only. The send endpoint is meant for trusted backend calls.",
                "Verify `X-WhatsFlow-Signature` with the session webhook secret before you trust a webhook body.",
                "If a session disconnects or the linked device changes, generate a new QR and reconnect before sending."
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-background/60 p-4 text-sm leading-7 text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
