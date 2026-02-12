// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.contextvm.org',
  integrations: [
    starlight({
      title: 'ContextVM Documentation',
      description: 'Documentation for ContextVM',
      logo: {
        light: './src/assets/contextvm-logo.svg',
        dark: './src/assets/contextvm-logo.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'ContextVM',
          href: 'https://github.com/contextvm/ts-sdk',
        },
        {
          icon: 'external',
          label: 'ContextVM Website',
          href: 'https://contextvm.org/',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Quick Overview', slug: 'getting-started/quick-overview' },
          ],
        },
        {
          label: 'Specification',
          items: [
            { label: 'Specification', slug: 'spec/ctxvm-draft-spec' },
            { label: 'CEP - Guidelines', slug: 'spec/cep-guidelines' },
            {
              label: 'CEPs',
              items: [
                { label: 'CEP-4: Encryption Support', slug: 'spec/ceps/cep-4' },
                {
                  label: 'CEP-6: Public Server Announcements',
                  slug: 'spec/ceps/cep-6',
                },
                { label: 'CEP-8: Capability Pricing and Payment Flow', slug: 'spec/ceps/cep-8' },
                {
                  label: 'Informational',
                  items: [
                    {
                      label: 'CEP-16: Client Public Key Injection',
                      slug: 'spec/ceps/informational/cep-16',
                    },
                    {
                      label: 'CEP-21: Payment Method Identifier (PMI) Recommendations',
                      slug: 'spec/ceps/informational/cep-21',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'ts-SDK',
          items: [
            { label: 'Quick Overview', slug: 'ts-sdk/quick-overview' },
            {
              label: 'Core Concepts',
              items: [
                { label: 'Constants', slug: 'ts-sdk/core/constants' },
                { label: 'Interfaces', slug: 'ts-sdk/core/interfaces' },
                { label: 'Logging', slug: 'ts-sdk/core/logging' },
                {
                  label: 'Relay handler',
                  slug: 'ts-sdk/relay/relay-handler-interface',
                },
                {
                  label: 'Nostr signer',
                  slug: 'ts-sdk/signer/nostr-signer-interface',
                },
                { label: 'Encryption', slug: 'ts-sdk/core/encryption' },
              ],
            },
            {
              label: 'Transports',
              items: [
                {
                  label: 'Base Nostr Transport',
                  slug: 'ts-sdk/transports/base-nostr-transport',
                },
                {
                  label: 'Nostr Client Transport',
                  slug: 'ts-sdk/transports/nostr-client-transport',
                },
                {
                  label: 'Nostr Server Transport',
                  slug: 'ts-sdk/transports/nostr-server-transport',
                },
              ],
            },
            {
              label: 'Components',
              items: [
                {
                  label: 'Relay Handlers',
                  items: [
                    {
                      label: 'Simple Relay Pool',
                      slug: 'ts-sdk/relay/simple-relay-pool',
                    },
                    {
                      label: 'Applesauce Relay Pool',
                      slug: 'ts-sdk/relay/applesauce-relay-pool',
                    },
                    {
                      label: 'Custom Relay Handler Development',
                      slug: 'ts-sdk/relay/custom-relay-handler',
                    },
                  ],
                },
                {
                  label: 'Signers',
                  items: [
                    {
                      label: 'Private Key Signer',
                      slug: 'ts-sdk/signer/private-key-signer',
                    },
                    {
                      label: 'Custom Signer Development',
                      slug: 'ts-sdk/signer/custom-signer-development',
                    },
                  ],
                },
                { label: 'Gateway', slug: 'ts-sdk/gateway/overview' },
                { label: 'Proxy', slug: 'ts-sdk/proxy/overview' },
                {
                  label: 'Payments',
                  items: [
                    { label: 'Overview', slug: 'ts-sdk/payments/overview' },
                    {
                      label: 'Getting Started',
                      slug: 'ts-sdk/payments/getting-started',
                    },
                    { label: 'Server', slug: 'ts-sdk/payments/server' },
                    { label: 'Client', slug: 'ts-sdk/payments/client' },
                    {
                      label: 'Rails',
                      items: [
                        {
                          label: 'Lightning over NWC',
                          slug: 'ts-sdk/payments/rails/lightning-nwc',
                        },
                      ],
                    },
                    {
                      label: 'Build Your Own Rail',
                      slug: 'ts-sdk/payments/custom-rails',
                    },
                  ],
                },
              ],
            },
            {
              label: 'Tutorials',
              items: [
                {
                  label: 'Client-Server Communication',
                  slug: 'ts-sdk/tutorials/client-server-communication',
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
});
