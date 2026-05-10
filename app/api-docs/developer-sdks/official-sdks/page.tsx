import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCodeBlock } from "@/components/docs/docs-code-block";
import { DocsPageNav } from "@/components/docs/docs-page-nav";
import { DocsToc } from "@/components/docs/docs-toc";

const TOC = [
  { id: "nodejs-sdk", label: "Node.js SDK" },
  { id: "python-sdk", label: "Python SDK" },
  { id: "laravel-sdk", label: "Laravel SDK" },
];

const NODE_INSTALL = `npm install hotsapeapi`;

const NODE_EXAMPLE = `import { createHotsape } from 'hotsapeapi';

const client = createHotsape({
  apiKey: process.env.HOTSAPE_API_KEY,
});

// Send a text message
const response = await client.sendMessage({
  to: '8801XXXXXXXXX',
  text: 'Hello from HotSape API!',
});

console.log(response);`;

const PYTHON_INSTALL = `pip install hotsapeapi`;

const PYTHON_EXAMPLE = `from hotsapeapi import HotsapeClient

client = HotsapeClient(api_key="your_api_key_here")

# Send a text message
response = client.send_message(
    to="8801XXXXXXXXX",
    text="Hello from HotSape API!"
)

print(response)`;

const LARAVEL_INSTALL = `composer require hotsapeapi/hotsapeapi-laravel`;

const LARAVEL_PROVIDER = `// config/app.php
'providers' => [
    HotsapeApi\\Laravel\\HotsapeServiceProvider::class,
],`;

const LARAVEL_PUBLISH = `php artisan vendor:publish --provider="HotsapeApi\\Laravel\\HotsapeServiceProvider"`;

const LARAVEL_ENV = `HOTSAPE_API_KEY=your_api_key_here`;

const LARAVEL_USAGE = `use HotsapeApi\\Laravel\\Facades\\Hotsape;

$response = Hotsape::sendMessage([
    'to'   => '8801XXXXXXXXX',
    'text' => 'Hello from HotSape API!',
]);`;

export default function OfficialSdksPage() {
  return (
    <div className="flex gap-8 px-6 py-10 md:px-10 xl:px-14">
      {/* ── Main content ─────────────────────────────────────── */}
      <article className="min-w-0 flex-1 pb-16">
        {/* Breadcrumb */}
        <DocsBreadcrumb
          crumbs={[
            { label: "Developer SDKs" },
            { label: "Official SDKs – Node.js, Python & Laravel" },
          ]}
        />

        {/* Badge + Title */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-xs font-semibold text-emerald-400">
          Developer SDKs
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Official SDKs – Node.js, Python &amp; Laravel
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">
          HotSape API provides official SDKs to help developers integrate quickly and efficiently
          using their preferred programming language or framework.
        </p>

        <hr className="my-8 border-white/[0.06]" />

        {/* ── Node.js SDK ───────────────────────────────── */}
        <section id="nodejs-sdk" className="scroll-mt-24">
          <h2 className="text-xl font-semibold text-white">Node.js SDK</h2>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Install the Node.js SDK using npm:
          </p>

          <DocsCodeBlock code={NODE_INSTALL} lang="bash" />

          <p className="mt-6 text-sm font-semibold text-white/80">Full example:</p>

          <DocsCodeBlock code={NODE_EXAMPLE} lang="javascript" title="send-message.js" />

          <p className="mt-4 text-sm leading-7 text-white/50">
            View full documentation and usage examples on{" "}
            <a
              href="https://www.npmjs.com/package/hotsapeapi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40"
            >
              npmjs.com
            </a>
            .
          </p>
        </section>

        <hr className="my-10 border-white/[0.06]" />

        {/* ── Python SDK ────────────────────────────────── */}
        <section id="python-sdk" className="scroll-mt-24">
          <h2 className="text-xl font-semibold text-white">Python SDK</h2>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Install the Python SDK using pip:
          </p>

          <DocsCodeBlock code={PYTHON_INSTALL} lang="bash" />

          <p className="mt-6 text-sm font-semibold text-white/80">Full example:</p>

          <DocsCodeBlock code={PYTHON_EXAMPLE} lang="python" title="send_message.py" />

          <p className="mt-4 text-sm leading-7 text-white/50">
            View full documentation and usage examples on{" "}
            <a
              href="https://pypi.org/project/hotsapeapi"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40"
            >
              PyPI
            </a>
            .
          </p>
        </section>

        <hr className="my-10 border-white/[0.06]" />

        {/* ── Laravel SDK ───────────────────────────────── */}
        <section id="laravel-sdk" className="scroll-mt-24">
          <h2 className="text-xl font-semibold text-white">Laravel SDK</h2>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Install the Laravel SDK using Composer:
          </p>

          <DocsCodeBlock code={LARAVEL_INSTALL} lang="bash" />

          <p className="mt-6 text-sm leading-7 text-white/50">
            <span className="font-semibold text-white/80">Register the service provider</span>{" "}
            (Laravel auto-discovers it, but you can add manually):
          </p>

          <DocsCodeBlock code={LARAVEL_PROVIDER} lang="php" title="config/app.php" />

          <p className="mt-6 text-sm leading-7 text-white/50">
            <span className="font-semibold text-white/80">Publish config:</span>
          </p>

          <DocsCodeBlock code={LARAVEL_PUBLISH} lang="bash" />

          <p className="mt-6 text-sm leading-7 text-white/50">
            <span className="font-semibold text-white/80">Add to .env:</span>
          </p>

          <DocsCodeBlock code={LARAVEL_ENV} lang="env" title=".env" />

          <p className="mt-6 text-sm leading-7 text-white/50">
            <span className="font-semibold text-white/80">Usage in controller:</span>
          </p>

          <DocsCodeBlock code={LARAVEL_USAGE} lang="php" title="MessageController.php" />

          <p className="mt-4 text-sm leading-7 text-white/50">
            View the package and installation details on{" "}
            <a
              href="https://packagist.org/packages/hotsapeapi/hotsapeapi-laravel"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40"
            >
              Packagist
            </a>
            .
          </p>
        </section>

        {/* ── Prev / Next ───────────────────────────────── */}
        <DocsPageNav
          prev={{
            label: "Getting Started with HotSape API",
            href: "/api-docs/getting-started/authentication",
          }}
          next={{
            label: "How to Authenticate API Requests",
            href: "/api-docs/getting-started/authentication",
          }}
        />
      </article>

      {/* ── Right TOC ────────────────────────────────────────── */}
      <DocsToc items={TOC} />
    </div>
  );
}
