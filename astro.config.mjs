// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://contextvm.github.io',
	base: '/',
	integrations: [
		starlight({
			title: 'ContextVM Documentation',
			description: 'Documentation for the ContextVM SDK - a virtual machine for context-controlled computation',
			logo: {
				light: './src/assets/contextvm-logo.svg',
				dark: './src/assets/contextvm-logo.svg',
				replacesTitle: false,
			},
			social: [
				{ icon: 'github', label: 'ContextVM', href: 'https://github.com/contextvm/sdk' },
				{ icon: 'twitter', label: 'Twitter', href: 'https://twitter.com/contextvm' },
			],
			editLink: {
				baseUrl: 'https://github.com/contextvm/sdk/edit/main/docs/',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Overview', slug: 'guides/getting-started/quick-overview' },
					],
				},
				{
					label: 'Specification',
					items: [
						{ label: 'Specification', slug: 'guides/ctxvm-draft-spec' },
					],
				},
				{
					label: 'Core Concepts',
					items: [
						{ label: 'Constants', slug: 'guides/core/constants' },
						{ label: 'Interfaces', slug: 'guides/core/interfaces' },
						{ label: 'Encryption', slug: 'guides/core/encryption' },
					],
				},
				{
					label: 'Components',
					items: [
						{ label: 'Gateway', slug: 'guides/gateway/overview' },
						{ label: 'Relay', slug: 'guides/relay/simple-relay-pool' },
						{ label: 'Signer', slug: 'guides/signer/private-key-signer' },
						{ label: 'Proxy', slug: 'guides/proxy/overview' },
					],
				},
				{
					label: 'Tutorials',
					items: [
						{ label: 'Client-Server Communication', slug: 'guides/tutorials/client-server-communication' },
					],
				},
				{
					label: 'Transports',
					items: [
						{ label: 'Base Nostr Transport', slug: 'guides/transports/base-nostr-transport' },
						{ label: 'Nostr Client', slug: 'guides/transports/nostr-client-transport' },
						{ label: 'Nostr Server', slug: 'guides/transports/nostr-server-transport' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
