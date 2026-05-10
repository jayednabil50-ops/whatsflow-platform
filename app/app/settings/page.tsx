import { Save, ShieldCheck } from "lucide-react";
import { settingsSections } from "@/lib/mocks/data";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">Workspace controls</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Profile, security, safety defaults, support routing, and destructive actions are arranged for future Supabase persistence.
          </p>
        </div>
        <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
          <Save className="h-4 w-4" />
          Save changes
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {settingsSections.map((section) => (
          <div key={section.title} className="rounded-md border border-border bg-card p-5">
            <section.icon className="h-5 w-5 text-accent" />
            <h2 className="mt-4 font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{section.body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.82fr_1fr]">
        <form className="rounded-md border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Workspace profile</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="workspace">Workspace name</label>
              <input id="workspace" className="input-field mt-2" defaultValue="Acme Commerce" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="email">Billing email</label>
              <input id="email" className="input-field mt-2" defaultValue="ops@acme.co" />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="timezone">Timezone</label>
              <select id="timezone" className="input-field mt-2" defaultValue="Asia/Dhaka">
                <option>Asia/Dhaka</option>
                <option>UTC</option>
                <option>Asia/Singapore</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="retention">Log retention</label>
              <select id="retention" className="input-field mt-2" defaultValue="90 days">
                <option>30 days</option>
                <option>90 days</option>
                <option>180 days</option>
              </select>
            </div>
          </div>
        </form>

        <form className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Default safety policy</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-md border border-border bg-background/70 p-4">
              <input type="checkbox" defaultChecked className="mr-2 h-4 w-4 rounded border-border bg-background" />
              Consent metadata required
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Outbound imports must identify opt-in source.</p>
            </label>
            <label className="rounded-md border border-border bg-background/70 p-4">
              <input type="checkbox" defaultChecked className="mr-2 h-4 w-4 rounded border-border bg-background" />
              Queue pacing enabled
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Session sends use pacing windows by default.</p>
            </label>
            <label className="rounded-md border border-border bg-background/70 p-4">
              <input type="checkbox" defaultChecked className="mr-2 h-4 w-4 rounded border-border bg-background" />
              High-risk endpoint caps
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Limits apply to group and lookup-style endpoints.</p>
            </label>
            <label className="rounded-md border border-border bg-background/70 p-4">
              <input type="checkbox" className="mr-2 h-4 w-4 rounded border-border bg-background" />
              Manual approval for bursts
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Require review when a queue exceeds normal volume.</p>
            </label>
          </div>
        </form>
      </section>
    </div>
  );
}
