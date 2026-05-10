import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { Nav } from "@/components/nav";

const posts = [
  {
    title: "Designing WhatsApp API safety controls without making false promises",
    tag: "Safety",
    excerpt: "How queue pacing, consent gates, and endpoint caps reduce risk while staying honest with customers."
  },
  {
    title: "A practical webhook retry model for messaging platforms",
    tag: "Engineering",
    excerpt: "Delivery attempts, signature checks, replay buttons, dead-letter queues, and useful observability."
  },
  {
    title: "Multi-session architecture for client workspaces",
    tag: "Product",
    excerpt: "Separating keys, logs, billing, and webhooks per connected number from the first database migration."
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background page-noise">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <Newspaper className="h-4 w-4" />
            Engineering notes
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Changelog, playbooks, and product thinking.</h1>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            A production SaaS needs more than screens. These draft articles define the editorial direction for trust, developer education, and launches.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.title} className="rounded-md border border-border bg-card p-5">
              <span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">{post.tag}</span>
              <h2 className="mt-5 text-xl font-semibold leading-7">{post.title}</h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
              <Link href="/blog" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                Read article <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
