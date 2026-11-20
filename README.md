# ContextVM Docs

This is the documentation site for the ContextVM protocol.
Built with [Astro](https://astro.build), and starlight theme.

Build with Bun 1.4.4 or later and a maintained Node release: at least 22.23.4
on Node 22, or 24.22.1 on Node 24. Install with `bun install --frozen-lockfile`,
then run `bun run build`. Set `GITHUB_PAGES=true` for the Pages build.

The deployment publishes static files and exposes no image optimizer or Repomix
server. Dependency updates do not patch the build host: keep the runtime and
the operating system's kernel and native libraries up to date using the
distributor's security updates. Process only trusted content during builds and
local `bun run gen-llmtxt` generation.
