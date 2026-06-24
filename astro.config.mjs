// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const githubPagesBase = "/contextvm-docs";

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages
    ? "https://contextvm.github.io/contextvm-docs"
    : "https://docs.contextvm.org",
  base: isGitHubPages ? githubPagesBase : "/",
  integrations: [
    mermaid({
      theme: "forest",
      autoTheme: true,
    }),
    starlight({
      title: "ContextVM Documentation",
      description: "Documentation for ContextVM",
      logo: {
        light: "./src/assets/contextvm-logo.svg",
        dark: "./src/assets/contextvm-logo.svg",
        replacesTitle: false,
      },
      social: [
        {
          icon: "github",
          label: "ContextVM",
          href: "https://github.com/contextvm/ts-sdk",
        },
        {
          icon: "external",
          label: "ContextVM Website",
          href: "https://contextvm.org/",
        },
      ],
      components: {
        PageTitle: "./src/components/starlight/PageTitle.astro",
        ThemeProvider: "./src/components/starlight/ThemeProvider.astro",
        ThemeSelect: "./src/components/starlight/ThemeSelect.astro",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Quick Overview", slug: "getting-started/quick-overview" },
          ],
        },
        {
          label: "Reference",
          items: [
            {
              label: "Specification",
              collapsed: true,
              items: [
                {
                  label: "Specification",
                  slug: "reference/spec/ctxvm-draft-spec",
                },
                {
                  label: "CEP - Guidelines",
                  slug: "reference/spec/cep-guidelines",
                },
              ],
            },
            {
              label: "CEPs",
              collapsed: true,
              items: [
                {
                  label: "CEP-4: Encryption Support",
                  slug: "reference/ceps/cep-4",
                },
                {
                  label: "CEP-6: Public Server Announcements",
                  slug: "reference/ceps/cep-6",
                },
                {
                  label: "CEP-8: Capability Pricing and Payment Flow",
                  slug: "reference/ceps/cep-8",
                },
                {
                  label: "CEP-15: Common Tool Schemas",
                  slug: "reference/ceps/cep-15",
                },
                {
                  label: "CEP-17: Server Relay List Metadata",
                  slug: "reference/ceps/cep-17",
                },
                {
                  label: "CEP-19: Ephemeral Gift Wraps",
                  slug: "reference/ceps/cep-19",
                },
                {
                  label: "CEP-22: Oversized Payload Transfer",
                  slug: "reference/ceps/cep-22",
                },
                {
                  label:
                    "CEP-23: Server Profile Metadata and Social Communications",
                  slug: "reference/ceps/cep-23",
                },
                {
                  label: "CEP-24: Server Reviews",
                  slug: "reference/ceps/cep-24",
                },
                {
                  label: "CEP-41: Open-Ended Streams",
                  slug: "reference/ceps/cep-41",
                },
                {
                  label: "Informational",
                  collapsed: true,
                  items: [
                    {
                      label: "CEP-16: Client Public Key Injection",
                      slug: "reference/ceps/informational/cep-16",
                    },
                    {
                      label: "CEP-21: PMI Recommendations",
                      slug: "reference/ceps/informational/cep-21",
                    },
                    {
                      label: "CEP-35: Stateless Session Discovery",
                      slug: "reference/ceps/informational/cep-35",
                    },
                  ],
                },
              ],
            },
            {
              label: "TypeScript SDK",
              collapsed: true,
              items: [
                {
                  label: "Quick Overview",
                  slug: "reference/ts-sdk/quick-overview",
                },
                {
                  label: "Core Concepts",
                  collapsed: true,
                  items: [
                    {
                      label: "Constants",
                      slug: "reference/ts-sdk/core/constants",
                    },
                    {
                      label: "Interfaces",
                      slug: "reference/ts-sdk/core/interfaces",
                    },
                    { label: "Logging", slug: "reference/ts-sdk/core/logging" },
                    {
                      label: "Relay Handler",
                      slug: "reference/ts-sdk/relay/relay-handler-interface",
                    },
                    {
                      label: "Nostr Signer",
                      slug: "reference/ts-sdk/signer/nostr-signer-interface",
                    },
                    {
                      label: "Encryption",
                      slug: "reference/ts-sdk/core/encryption",
                    },
                    {
                      label: "Common Tool Schemas",
                      slug: "reference/ts-sdk/core/common-tool-schemas",
                    },
                  ],
                },
                {
                  label: "Transports",
                  collapsed: true,
                  items: [
                    {
                      label: "Base Nostr Transport",
                      slug: "reference/ts-sdk/transports/base-nostr-transport",
                    },
                    {
                      label: "Nostr Client Transport",
                      slug: "reference/ts-sdk/transports/nostr-client-transport",
                    },
                    {
                      label: "Nostr Server Transport",
                      slug: "reference/ts-sdk/transports/nostr-server-transport",
                    },
                    {
                      label: "Oversized Transfer",
                      slug: "reference/ts-sdk/transports/oversized-transfer",
                    },
                    {
                      label: "Open Stream",
                      slug: "reference/ts-sdk/transports/open-stream",
                    },
                  ],
                },
                {
                  label: "Components",
                  collapsed: true,
                  items: [
                    {
                      label: "Relay Handlers",
                      collapsed: true,
                      items: [
                        {
                          label: "Applesauce Relay Pool",
                          slug: "reference/ts-sdk/relay/applesauce-relay-pool",
                        },
                        {
                          label: "Custom Relay Handler",
                          slug: "reference/ts-sdk/relay/custom-relay-handler",
                        },
                      ],
                    },
                    {
                      label: "Signers",
                      collapsed: true,
                      items: [
                        {
                          label: "Private Key Signer",
                          slug: "reference/ts-sdk/signer/private-key-signer",
                        },
                        {
                          label: "Custom Signer Development",
                          slug: "reference/ts-sdk/signer/custom-signer-development",
                        },
                      ],
                    },
                    {
                      label: "Gateway",
                      slug: "reference/ts-sdk/gateway/overview",
                    },
                    { label: "Proxy", slug: "reference/ts-sdk/proxy/overview" },
                    {
                      label: "Payments",
                      collapsed: true,
                      items: [
                        {
                          label: "Overview",
                          slug: "reference/ts-sdk/payments/overview",
                        },
                        {
                          label: "Explicit Gating API",
                          slug: "reference/ts-sdk/payments/explicit-gating",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              label: "Rust SDK",
              collapsed: true,
              items: [
                { label: "Overview", slug: "reference/rs-sdk/overview" },
                {
                  label: "Native Server Guide",
                  slug: "reference/rs-sdk/server-transport",
                },
                {
                  label: "Native Client Guide",
                  slug: "reference/rs-sdk/client-transport",
                },
                { label: "Gateway", slug: "reference/rs-sdk/gateway" },
                { label: "Proxy", slug: "reference/rs-sdk/proxy" },
                { label: "Discovery", slug: "reference/rs-sdk/discovery" },
                { label: "Encryption", slug: "reference/rs-sdk/encryption" },
                {
                  label: "Transport Modes",
                  slug: "reference/rs-sdk/transport-modes",
                },
                {
                  label: "Transports (Low-Level)",
                  slug: "reference/rs-sdk/transports",
                },
                {
                  label: "Transports",
                  collapsed: true,
                  items: [
                    {
                      label: "Oversized Transfer",
                      slug: "reference/rs-sdk/oversized-transfer",
                    },
                    {
                      label: "Open Stream",
                      slug: "reference/rs-sdk/open-stream",
                    },
                  ],
                },
                { label: "Stateless Mode", slug: "reference/rs-sdk/stateless" },
                { label: "RMCP Integration", slug: "reference/rs-sdk/rmcp" },
                {
                  label: "UniFFI Bindings",
                  slug: "reference/rs-sdk/ffi",
                },
              ],
            },
          ],
        },
        {
          label: "How-to",
          items: [
            {
              label: "CVMI CLI",
              collapsed: true,
              items: [
                { label: "Overview", slug: "how-to/cvmi/overview" },
                { label: "Installation", slug: "how-to/cvmi/installation" },
                { label: "Commands", slug: "how-to/cvmi/commands" },
                { label: "Configuration", slug: "how-to/cvmi/configuration" },
                {
                  label: "Skills Overview",
                  slug: "how-to/cvmi/skills/overview",
                },
              ],
            },
            {
              label: "Payments",
              collapsed: true,
              items: [
                {
                  label: "Getting Started",
                  slug: "how-to/payments/getting-started",
                },
                { label: "Server", slug: "how-to/payments/server" },
                { label: "Client", slug: "how-to/payments/client" },
                {
                  label: "Explicit Payment Gating",
                  slug: "how-to/payments/explicit-gating",
                },
                {
                  label: "Rails",
                  collapsed: true,
                  items: [
                    {
                      label: "Lightning over NWC",
                      slug: "how-to/payments/rails/lightning-nwc",
                    },
                  ],
                },
                {
                  label: "Build Your Own Rail",
                  slug: "how-to/payments/custom-rails",
                },
              ],
            },
            {
              label: "Encryption",
              collapsed: true,
              items: [
                {
                  label: "Enable Encrypted Communication",
                  slug: "how-to/encryption",
                },
              ],
            },
            {
              label: "Gateway",
              collapsed: true,
              items: [
                {
                  label: "Bridge an Existing MCP Server",
                  slug: "how-to/bridge-mcp-server",
                },
              ],
            },
          ],
        },
        {
          label: "Tutorials",
          items: [
            {
              label: "Client-Server Communication",
              slug: "tutorials/client-server-communication",
            },
            {
              label: "Build a Public Server",
              slug: "tutorials/build-a-public-server",
            },
            {
              label: "Server & Client (Rust)",
              slug: "tutorials/rust-server-client",
            },
            {
              label: "Discover ContextVM Servers",
              slug: "tutorials/discover-servers",
            },
          ],
        },
      ],
    }),
  ],
});
