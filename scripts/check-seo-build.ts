import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const origin = isGitHubPages
  ? "https://contextvm.github.io/contextvm-docs"
  : "https://docs.contextvm.org";

const pages = [
  {
    slug: "getting-started/quick-overview",
    source: "src/content/docs/getting-started/quick-overview.md",
    title: "Build with ContextVM",
    description:
      "Choose the ContextVM CLI or an SDK to expose, discover, and call MCP servers over Nostr.",
  },
  {
    slug: "how-to/bridge-mcp-server",
    source: "src/content/docs/how-to/bridge-mcp-server.md",
    title: "Expose an MCP Server over Nostr",
    description:
      "Bridge a stdio or Streamable HTTP MCP server with CVMI, verify a tool call, and use the SDK for custom gateway control.",
  },
  {
    slug: "tutorials/connect-an-mcp-host",
    source: "src/content/docs/tutorials/connect-an-mcp-host.md",
    title: "Connect an MCP Host with CVMI",
    description:
      "Run a ContextVM server as a local stdio MCP process, list its tools, and complete a tool call from an MCP host.",
  },
  {
    slug: "how-to/payments/getting-started",
    source: "src/content/docs/how-to/payments/getting-started.md",
    title: "Run a Lightning-Paid ContextVM Tool",
    description:
      "Configure a one-sat ContextVM tool, pay its BOLT11 invoice over NWC, and verify that execution begins only after settlement.",
  },
  {
    slug: "how-to/payments/server",
    source: "src/content/docs/how-to/payments/server.md",
    title: "Configure ContextVM Server Payments",
    description:
      "Price ContextVM capabilities, select payment processors, and reject or waive requests before execution.",
  },
  {
    slug: "how-to/payments/client",
    source: "src/content/docs/how-to/payments/client.md",
    title: "Control ContextVM Client Payments",
    description:
      "Configure payment handlers, spending policy, PMI selection, and explicit gating for paid ContextVM calls.",
  },
  {
    slug: "how-to/payments/explicit-gating",
    source: "src/content/docs/how-to/payments/explicit-gating.md",
    title: "Handle Payments with Explicit Gating",
    description:
      "Surface CEP-8 payment requirements as invocation errors, pay deliberately, and retry the same ContextVM capability.",
  },
  {
    slug: "how-to/payments/custom-rails",
    source: "src/content/docs/how-to/payments/custom-rails.md",
    title: "Add a Custom ContextVM Payment Rail",
    description:
      "Implement and register matching PaymentProcessor and PaymentHandler components for a custom payment method identifier.",
  },
  {
    slug: "how-to/payments/rails/lightning-nwc",
    source: "src/content/docs/how-to/payments/rails/lightning-nwc.md",
    title: "Configure Lightning Payments with NWC",
    description:
      "Set up BOLT11 invoice creation, payment, and settlement verification for ContextVM using Nostr Wallet Connect.",
  },
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  new Set(pages.map(({ title }) => title)).size === pages.length,
  "Changed titles must be unique",
);
assert(
  new Set(pages.map(({ description }) => description)).size === pages.length,
  "Changed descriptions must be unique",
);

const sitemap = readFileSync("dist/sitemap-0.xml", "utf8");
const sidebar = readFileSync("astro.config.mjs", "utf8");

for (const page of pages) {
  const outputPath = join("dist", page.slug, "index.html");
  assert(existsSync(outputPath), `Missing generated page: ${outputPath}`);

  const html = readFileSync(outputPath, "utf8");
  const canonical = `${origin}/${page.slug}/`;
  assert(
    html.includes(`<title>${page.title} | ContextVM Documentation</title>`),
    `Incorrect title for ${page.slug}`,
  );
  assert(
    html.includes(`<meta name="description" content="${page.description}"`),
    `Incorrect description for ${page.slug}`,
  );
  assert(
    html.includes(`<link rel="canonical" href="${canonical}"`),
    `Incorrect canonical for ${page.slug}`,
  );
  assert(
    sitemap.includes(`<loc>${canonical}</loc>`),
    `Missing sitemap URL: ${canonical}`,
  );

  const source = readFileSync(page.source, "utf8");
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|#)/.test(href)) continue;
    assert(
      href.startsWith("/"),
      `${page.source} uses a relative internal link: ${href}`,
    );

    const internalPath = href
      .split("#", 1)[0]
      .replace(/^\//, "")
      .replace(/\/$/, "");
    const targetPath = join("dist", internalPath, "index.html");
    assert(
      existsSync(targetPath),
      `${page.source} links to missing page: ${href}`,
    );
  }
}

assert(
  /slug:\s*["']tutorials\/connect-an-mcp-host["']/.test(sidebar),
  "The MCP host tutorial is missing from the sidebar",
);

console.log(
  `Validated ${pages.length} docs pages, links, canonicals, and sitemap entries.`,
);
