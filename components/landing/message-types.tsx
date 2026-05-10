import { Check } from "lucide-react";

const MESSAGE_TYPES = [
  "Text",
  "Image & Video",
  "Document",
  "Voice",
  "Contact",
  "Location",
];

const SENDER_TYPES = ["Users", "Groups", "Channels"];

/* ── WhatsApp chat bubble helpers ─────────────────────────── */

function ReceivedBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-[#202C33] px-3.5 py-2.5 shadow-sm">
        {children}
        <p className="mt-1 text-right text-[10px] text-white/30">{time}</p>
      </div>
    </div>
  );
}

function SentBubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#005C4B] px-3.5 py-2.5 shadow-sm">
        {children}
        <p className="mt-1 text-right text-[10px] text-white/30">
          {time} <span className="text-emerald-400">✓✓</span>
        </p>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */

export function MessageTypesSection() {
  return (
    <section className="border-y border-white/[0.05] bg-white/[0.01]" id="messages">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 py-24">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
            Powerful Integration · Seamless Communication
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
            Send and receive WhatsApp messages with your App
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left — feature lists */}
          <div className="grid grid-cols-2 gap-10">
            {/* Supported message types */}
            <div>
              <h3 className="mb-5 text-sm font-semibold text-white/80 uppercase tracking-wide">
                Supported Message Types
              </h3>
              <ul className="space-y-3">
                {MESSAGE_TYPES.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Supported sender types */}
            <div>
              <h3 className="mb-5 text-sm font-semibold text-white/80 uppercase tracking-wide">
                Supported Sender Types
              </h3>
              <ul className="space-y-3">
                {SENDER_TYPES.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — WhatsApp mockup */}
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#0B141A] shadow-[0_40px_120px_rgba(0,0,0,0.7)]">
              {/* Status bar */}
              <div className="flex items-center justify-between bg-[#0B141A] px-5 pt-3 pb-1 text-[10px] text-white/40">
                <span>9:41</span>
                <span className="flex gap-1">▲ ▌▌</span>
              </div>

              {/* WhatsApp header */}
              <div className="flex items-center gap-3 bg-[#1F2C34] px-4 py-3">
                <button className="text-white/50 text-lg leading-none">←</button>
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-bold text-black">
                  J
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">Jon Doe</p>
                  <p className="text-[11px] text-emerald-400">Online</p>
                </div>
                <div className="flex gap-4 text-white/50 text-base">
                  <span>📞</span>
                  <span>⋮</span>
                </div>
              </div>

              {/* Chat area */}
              <div
                className="space-y-2.5 px-3 py-4 min-h-[420px]"
                style={{
                  background:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='2' cy='2' r='1' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E\") repeat, #0B141A",
                }}
              >
                {/* Text received */}
                <ReceivedBubble time="10:23">
                  <p className="text-[13px] text-white/90">Hey! Is this the support line? 👋</p>
                </ReceivedBubble>

                {/* Text sent */}
                <SentBubble time="10:24">
                  <p className="text-[13px] text-white/90">
                    Yes! How can I help you today?
                  </p>
                </SentBubble>

                {/* Image bubble */}
                <ReceivedBubble time="10:25">
                  <div className="mb-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-[#2A3942] to-[#1A2A32] h-28 w-44 flex items-center justify-center">
                    <span className="text-3xl opacity-40">🖼</span>
                  </div>
                  <p className="text-[11px] text-white/50">Photo · 1.2 MB</p>
                </ReceivedBubble>

                {/* Audio bubble */}
                <ReceivedBubble time="10:26">
                  <div className="flex items-center gap-2.5 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-xs">
                      ▶
                    </div>
                    <div className="flex-1">
                      <div className="h-1 rounded-full bg-white/15 w-28">
                        <div className="h-1 rounded-full bg-emerald-400 w-10" />
                      </div>
                      <p className="mt-1 text-[10px] text-white/35">0:08</p>
                    </div>
                  </div>
                </ReceivedBubble>

                {/* PDF document sent */}
                <SentBubble time="10:27">
                  <div className="flex items-center gap-2.5 pr-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/90 text-[10px] font-bold text-white">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-white/90 truncate">
                        invoice_2024.pdf
                      </p>
                      <p className="text-[10px] text-white/40">2.5 MB · PDF Document</p>
                    </div>
                  </div>
                </SentBubble>

                {/* Location received */}
                <ReceivedBubble time="10:28">
                  <div className="mb-1.5 overflow-hidden rounded-xl bg-[#2A3942] h-24 w-44 flex flex-col items-center justify-center gap-1 relative">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background:
                          "linear-gradient(135deg, #1a3c2e 25%, #0d2a1e 50%, #1a3c2e 75%)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                    <span className="relative text-2xl">📍</span>
                    <span className="relative text-[10px] text-white/60 font-medium">
                      Google Maps
                    </span>
                  </div>
                  <p className="text-[12px] font-medium text-white/90">My Location</p>
                  <p className="text-[10px] text-white/40">Tap to view in Maps</p>
                </ReceivedBubble>
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 bg-[#1F2C34] px-3 py-2.5">
                <div className="flex-1 rounded-full bg-[#2A3942] px-4 py-2 text-[12px] text-white/30">
                  Type a message
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white text-base">
                  ↑
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
