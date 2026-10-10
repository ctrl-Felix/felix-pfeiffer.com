import Link from "next/link";
import { links, site } from "@/config";
import { clientSetups, mcpConnectors, mcpPage, mcpServerUrl } from "@/data/mcp";
import CopyButton from "./CopyButton";

const card = "rounded-3xl bg-[#1c1c1e]/70 p-5 backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]";

function Code({ value }: { value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-black/35 p-3">
      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all text-xs leading-relaxed">{value}</pre>
      <CopyButton value={value} />
    </div>
  );
}

export default function McpPage() {
  const first = mcpConnectors[0];
  const url = mcpServerUrl(first);

  return (
    <div className="wallpaper fixed inset-0 overflow-y-auto text-white">
      <header className="glass fixed inset-x-3 top-3 z-10 mx-auto flex max-w-3xl items-center justify-between rounded-full px-4 py-2 text-sm">
        <Link href="/" className="font-medium">‹ Desktop</Link>
        <span className="font-semibold">MCP</span>
        <Link href="/tools/whois" className="text-xs text-white/80">Whois tool</Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-20">
        <div>
          <h1 className="text-3xl font-bold">{mcpPage.heading}</h1>
          <p className="mt-2 text-white/80">{mcpPage.intro}</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Available servers</h2>
          {mcpConnectors.map((connector) => (
            <article key={connector.id} id={connector.id} className={card}>
              <h3 className="text-lg font-semibold">{connector.name}</h3>
              <p className="mt-1 text-sm text-white/70">{connector.description}</p>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/35 px-3 py-2">
                <code className="min-w-0 flex-1 break-all text-xs">{mcpServerUrl(connector)}</code>
                <CopyButton value={mcpServerUrl(connector)} />
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {connector.tools.map((tool) => (
                  <li key={tool.name}>
                    <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{tool.name}</code>
                    <span className="ml-2 text-white/70">{tool.description}</span>
                    <p className="mt-1 text-xs text-white/55">Try: “{tool.example}”</p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to connect</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {clientSetups.map((client) => (
              <div key={client.id} className={card}>
                <h3 className="font-semibold">{client.name}</h3>
                {client.steps && <p className="mt-1 text-sm text-white/70">{client.steps}</p>}
                {client.hint && <p className="mt-1 text-xs text-white/55">{client.hint}</p>}
                {client.code && (
                  <div className="mt-2">
                    <Code value={client.code(url)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={card}>
          <h2 className="text-xl font-semibold">Technical details</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
            <li>Transport: Streamable HTTP, stateless, JSON responses.</li>
            <li>Authentication: none. Requests are rate limited per address.</li>
            <li>Nothing you send is stored.</li>
            <li>
              Source code on <a className="underline" href={links.source} rel="noopener noreferrer" target="_blank">GitHub</a>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Questions</h2>
          {mcpPage.faq.map((item) => (
            <div key={item.question} className={card}>
              <h3 className="font-semibold">{item.question}</h3>
              <p className="mt-1 text-sm text-white/70">{item.answer}</p>
            </div>
          ))}
        </section>

        <p className="text-center text-xs text-white/60">
          By <Link href="/" className="underline">{site.name}</Link>
        </p>
      </main>
    </div>
  );
}
