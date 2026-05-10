import { codeToHtml } from "shiki";
import { CopyButton } from "@/components/docs/copy-button";

const LANG_LABELS: Record<string, string> = {
  bash: "bash",
  shell: "bash",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  php: "PHP",
  env: ".env",
  json: "JSON",
  plaintext: "text",
};

type Props = {
  code: string;
  lang: string;
  title?: string;
};

export async function DocsCodeBlock({ code, lang, title }: Props) {
  let html = "";

  try {
    html = await codeToHtml(code.trim(), {
      lang,
      theme: "github-dark",
    });
  } catch {
    /* fall back to plain text */
    html = `<pre style="background:#0d1117;color:#e6edf3;padding:1.25rem;overflow-x:auto;font-size:0.8125rem;line-height:1.7"><code>${code
      .trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</code></pre>`;
  }

  const label = LANG_LABELS[lang] ?? lang;

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#0d1117]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#161b22] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Traffic-light dots */}
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          {title && (
            <span className="text-xs font-medium text-white/40">{title}</span>
          )}
          {!title && (
            <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] text-white/40">
              {label}
            </span>
          )}
        </div>

        <CopyButton code={code.trim()} />
      </div>

      {/* Shiki output — pre inherits background from shiki theme */}
      <div
        className="[&>pre]:overflow-x-auto [&>pre]:p-5 [&>pre]:text-[0.8125rem] [&>pre]:leading-[1.7] [&>pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
