// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://contextvm.github.io",
  base: "contextvm-docs",
  integrations: [
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
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Quick Overview", slug: "getting-started/quick-overview" },
          ],
        },
        {
          label: "Specification",
          items: [{ label: "Specification", slug: "ctxvm-draft-spec" }],
        },
        {
          label: "Core Concepts",
          items: [
            { label: "Constants", slug: "core/constants" },
            { label: "Interfaces", slug: "core/interfaces" },
            { label: "Encryption", slug: "core/encryption" },
          ],
        },
        {
          label: "Transports",
          items: [
            {
              label: "Base Nostr Transport",
              slug: "transports/base-nostr-transport",
            },
            {
              label: "Nostr Client",
              slug: "transports/nostr-client-transport",
            },
            {
              label: "Nostr Server",
              slug: "transports/nostr-server-transport",
            },
          ],
        },
        {
          label: "Components",
          items: [
            { label: "Gateway", slug: "gateway/overview" },
            { label: "Relay", slug: "relay/simple-relay-pool" },
            { label: "Signer", slug: "signer/private-key-signer" },
            { label: "Proxy", slug: "proxy/overview" },
          ],
        },
        {
          label: "Tutorials",
          items: [
            {
              label: "Client-Server Communication",
              slug: "tutorials/client-server-communication",
            },
          ],
        },
      ],
    }),
  ],
});
