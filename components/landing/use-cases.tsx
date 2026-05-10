import {
  HeadphonesIcon,
  BellRing,
  Bot,
  TrendingUp,
  ShoppingCart,
  BarChart2,
} from "lucide-react";

const CASES = [
  {
    icon: HeadphonesIcon,
    title: "Customer Support Automation",
    description:
      "Auto-respond to common queries, route tickets to agents, and track resolution time — all over WhatsApp.",
  },
  {
    icon: BellRing,
    title: "Real-time Business Alerts",
    description:
      "Send instant notifications for orders, payments, low stock, server incidents, and system alerts.",
  },
  {
    icon: Bot,
    title: "AI-Powered Virtual Assistants",
    description:
      "Connect LLMs to inbound WhatsApp messages and build smart conversational experiences at scale.",
  },
  {
    icon: TrendingUp,
    title: "Dynamic Lead Nurturing",
    description:
      "Move opted-in leads through paced follow-up sequences with CRM sync and reply-triggered workflows.",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Engagement & Sales",
    description:
      "Send abandoned cart reminders, order confirmations, shipping updates, and post-purchase follow-ups.",
  },
  {
    icon: BarChart2,
    title: "Advanced Analytics Integration",
    description:
      "Pipe message events, delivery data, and webhook logs into your analytics stack for full visibility.",
  },
];

export function UseCasesSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6 py-24" id="use-cases">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-4">
          Versatile Integration · Endless Possibilities
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em] text-white">
          Suggested Use Cases to Spark Your Innovation
        </h2>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CASES.map((item) => (
          <article
            key={item.title}
            className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all duration-300 hover:border-emerald-500/25 hover:bg-white/[0.04]"
          >
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-emerald-400 transition-all duration-300 group-hover:border-emerald-500/25 group-hover:bg-emerald-500/[0.08]">
              <item.icon className="h-5 w-5" />
            </span>
            <h3 className="font-semibold text-white">{item.title}</h3>
            <p className="mt-2.5 text-sm leading-7 text-white/40">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
