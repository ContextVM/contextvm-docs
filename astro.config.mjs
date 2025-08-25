// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://contextvm.org",
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
          items: [
            { label: "Specification", slug: "spec/ctxvm-draft-spec" },
            { label: "CEP - Guidelines", slug: "spec/cep-guidelines" },
          ],
        },
        {
          label: "ts-SDK",
          items: [
            { label: "Quick Overview", slug: "ts-sdk/quick-overview" },
            {
              label: "Core Concepts",
              items: [
                { label: "Constants", slug: "ts-sdk/core/constants" },
                { label: "Interfaces", slug: "ts-sdk/core/interfaces" },
                {
                  label: "Relay handler",
                  slug: "ts-sdk/relay/relay-handler-interface",
                },
                {
                  label: "Nostr signer",
                  slug: "ts-sdk/signer/nostr-signer-interface",
                },
                { label: "Encryption", slug: "ts-sdk/core/encryption" },
              ],
            },
            {
              label: "Transports",
              items: [
                {
                  label: "Base Nostr Transport",
                  slug: "ts-sdk/transports/base-nostr-transport",
                },
                {
                  label: "Nostr Client Transport",
                  slug: "ts-sdk/transports/nostr-client-transport",
                },
                {
                  label: "Nostr Server Transport",
                  slug: "ts-sdk/transports/nostr-server-transport",
                },
              ],
            },
            {
              label: "Components",
              items: [
                {
                  label: "Relay Handlers",
                  items: [
                    {
                      label: "Simple Relay Pool",
                      slug: "ts-sdk/relay/simple-relay-pool",
                    },
                    {
                      label: "Applesauce Relay Pool",
                      slug: "ts-sdk/relay/applesauce-relay-pool",
                    },
                    {
                      label: "Custom Relay Handler Development",
                      slug: "ts-sdk/relay/custom-relay-handler",
                    },
                  ],
                },
                {
                  label: "Signers",
                  items: [
                    {
                      label: "Private Key Signer",
                      slug: "ts-sdk/signer/private-key-signer",
                    },
                    {
                      label: "Custom Signer Development",
                      slug: "ts-sdk/signer/custom-signer-development",
                    },
                  ],
                },
                { label: "Gateway", slug: "ts-sdk/gateway/overview" },
                { label: "Proxy", slug: "ts-sdk/proxy/overview" },
              ],
            },
            {
              label: "Tutorials",
              items: [
                {
                  label: "Client-Server Communication",
                  slug: "ts-sdk/tutorials/client-server-communication",
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
});
