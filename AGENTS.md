# ContextVM Documentation Framework

This repository houses the official documentation for the ContextVM protocol and its ecosystem. It is built with [Astro Starlight](https://starlight.astro.build/).

This document describes the mental model, framework, and conventions used to organize the documentation. It serves as a guide for human contributors and AI agents alike to ensure the documentation remains consistent and high-quality over time.

## Documentation Framework: Diátaxis

We organize our documentation following the [Diátaxis framework](https://diataxis.fr/), which categorizes documentation into four distinct types based on the user's needs.

For ContextVM, these are mapped as follows:

1. **Tutorials** (`src/content/docs/tutorials/`)
   - **Purpose**: Learning-oriented. Step-by-step guides for beginners to achieve a basic level of competence.
   - **Tone**: Conversational, encouraging, prescriptive.
   - **Examples**: "Client-Server Communication", "Build a Public Server".

2. **How-to Guides** (`src/content/docs/how-to/`)
   - **Purpose**: Problem-oriented. Actionable steps to solve a specific problem or achieve a specific goal for users who already understand the basics.
   - **Tone**: Direct, task-focused, minimal context.
   - **Examples**: "Bridge an Existing MCP Server", "Enable Encrypted Communication", "Payments / Lightning over NWC".

3. **Reference** (`src/content/docs/reference/`)
   - **Purpose**: Information-oriented. Accurate, comprehensive, and objective descriptions of the machinery.
   - **Tone**: Objective, austere, precise.
   - **Organization**:
     - `spec/`: The core ContextVM protocol specification and contribution guidelines.
     - `ceps/`: ContextVM Enhancement Proposals (CEPs).
     - `ts-sdk/`: TypeScript SDK API reference, architectures, and modules.
     - `rs-sdk/`: Rust SDK API reference, architectures, and modules.

4. **Explanation / Getting Started** (`src/content/docs/getting-started/`)
   - **Purpose**: Understanding-oriented. High-level concepts, quick overviews, and theoretical explanations.
   - **Tone**: Explanatory, clarifying.

## Directory Structure

All Markdown and MDX files live within `src/content/docs/`. The directory structure maps directly to the Diátaxis framework described above.

```text
src/content/docs/
├── getting-started/        # Overviews and conceptual introductions
├── how-to/                 # Action-oriented problem solving
│   ├── cvmi/               # CLI guides
│   ├── payments/           # Payment integration guides
│   └── ...                 # Other specific topic areas
├── reference/              # Information-oriented specs and SDKs
│   ├── ceps/               # Proposals
│   ├── rs-sdk/             # Rust SDK reference
│   ├── spec/               # Protocol specification
│   └── ts-sdk/             # TypeScript SDK reference
└── tutorials/              # Step-by-step learning paths
```

## SDK Scoping Rules

To prevent top-level bloat and maintain clear context boundaries:

1. **Architecture & Design**: Architectural concepts specific to an SDK (e.g., how the Rust SDK models transport layers) must be documented _within_ that SDK's reference directory (`reference/rs-sdk/`), not as a top-level design section.
2. **Feature Decoupling**: If a feature is a standalone specification or broad concept (like Payments), its _conceptual_ and _how-to_ documentation lives in `how-to/payments/`. However, the _API reference_ for that feature within a specific SDK lives in the SDK's reference section (e.g., `reference/ts-sdk/payments/overview.md`).

## Conventions and Style Guidelines

When adding or modifying documentation, strictly adhere to the following rules:

### 1. File Naming and Frontmatter

- Use lowercase, kebab-case for filenames (e.g., `client-transport.md`).
- Every file MUST have valid YAML frontmatter containing a `title` and a `description`.
- **CRITICAL**: The `description` field MUST be a meaningful, human-readable summary of the page's contents. Do **not** use lazy templated phrases like "ContextVM Rust SDK documentation for X".

### 2. Sidebar Registration

- Every `.md` or `.mdx` file added to `src/content/docs/` MUST be explicitly registered in `astro.config.mjs` within the `sidebar` array.
- The `slug` in the sidebar configuration is the file path relative to `src/content/docs/` _without_ the `.md` or `.mdx` extension.
- Orphan pages (files not linked in the sidebar) are strictly prohibited.

### 3. Internal Linking

- Internal links must use absolute paths starting with `/`, matching the file's slug.
- **Correct**: `[Rust SDK Overview](/reference/rs-sdk/overview)`
- **Incorrect**: `[Rust SDK Overview](../reference/rs-sdk/overview.md)`
- **Incorrect**: `[Rust SDK Overview](overview.md)`

### 4. Writing Style

- **No Filler**: Eliminate robotic introductory sentences (e.g., "This page documents the...", "The following section will explain..."). Jump straight to the point.
- **Active Voice**: Use active voice and imperative mood. (e.g., "Use the `NostrMCPGateway` when..." instead of "The `NostrMCPGateway` should be used when...").
- **Code-First**: Show, don't tell. Lead with practical code examples where appropriate.
- **Avoid Repetition**: Do not restate protocol mechanics in SDK documentation. Link to the relevant CEP or Spec section instead.

## Adding a New Page: Checklist

Whenever an agent or human adds a new page, they must execute this checklist:

- [ ] Create the `.md` or `.mdx` file in the correct Diátaxis directory.
- [ ] Add YAML frontmatter (`title`, `description`). Ensure the description is bespoke and accurate.
- [ ] Add the page slug to the correct section of the `sidebar` in `astro.config.mjs`.
- [ ] Ensure all internal links point to absolute slugs (e.g., `/reference/ts-sdk/...`).
- [ ] Run `bun run build` (or `astro build`) locally to ensure Starlight compiles successfully and no 404 links exist.
