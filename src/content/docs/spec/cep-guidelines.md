---
title: ContextVM Enhancement Proposal Guidelines
description: Guidelines for proposing changes to the ContextVM protocol
---

# CEP Guidelines

> ContextVM Enhancement Proposal (CEP) guidelines for proposing changes to the ContextVM protocol

## What is a CEP?

CEP stands for ContextVM Enhancement Proposal. A CEP is a design document providing information to the ContextVM community, or describing a new feature for the ContextVM protocol or its processes or environment. The CEP should provide a concise technical specification of the feature and a rationale for the feature.

We intend CEPs to be the primary mechanisms for proposing major new features, for collecting community input on an issue, and for documenting the design decisions that have gone into ContextVM. The CEP author is responsible for building consensus within the community and documenting dissenting opinions.

Because the CEPs are maintained as text files in a versioned repository, their revision history is the historical record of the feature proposal.

## What qualifies a CEP?

The goal is to reserve the CEP process for changes that are substantial enough to require broad community discussion, a formal design document, and a historical record of the decision-making process. A regular GitHub issue or pull request is often more appropriate for smaller, more direct changes.

Consider proposing a CEP if your change involves any of the following:

- **A New Feature or Protocol Change**: Any change that adds, modifies, or removes features in the ContextVM protocol. This includes:
  - Adding new event kinds or Nostr integration patterns.
  - Changing the syntax or semantics of existing data structures or messages.
  - Introducing a new standard for interoperability between different ContextVM-compatible tools.
  - Significant changes to how the specification itself is defined, presented, or validated.
- **A Breaking Change**: Any change that is not backwards-compatible.
- **A Change to Governance or Process**: Any proposal that alters the project's decision-making, contribution guidelines (like this document itself).
- **A Complex or Controversial Topic**: If a change is likely to have multiple valid solutions or generate significant debate, the CEP process provides the necessary framework to explore alternatives, document the rationale, and build community consensus before implementation begins.

## CEP Types

There are three kinds of CEP:

1. **Standards Track** CEP describes a new feature or implementation for the ContextVM protocol. Standards Track CEPs are maintained as separate documents from the main ContextVM specification and extend or enhance the base protocol. The main specification maintains references to all accepted and finalized Standards Track CEPs.

2. **Informational** CEP describes a ContextVM protocol design issue, or provides general guidelines or information to the ContextVM community, but does not propose a new feature. Informational CEPs do not necessarily represent a ContextVM community consensus or recommendation.

3. **Process** CEP describes a process surrounding ContextVM, or proposes a change to (or an event in) a process. Process CEPs are like Standards Track CEPs but apply to areas other than the ContextVM protocol itself.

## Submitting a CEP

The CEP process begins with a new idea for the ContextVM protocol. It is highly recommended that a single CEP contain a single key proposal or new idea. Small enhancements or patches often don't need a CEP and can be injected into the ContextVM development workflow with a pull request to the ContextVM repo. The more focused the CEP, the more successful it tends to be.

Each CEP must have an **CEP author** -- someone who writes the CEP using the style and format described below, shepherds the discussions in the appropriate forums, and attempts to build community consensus around the idea. The CEP author should first attempt to ascertain whether the idea is CEP-able. Posting to the ContextVM community forums (Nostr, Signal, GitHub Discussions) is the best way to go about this.

**Important Note**: The CEP process uses both GitHub Issues and Pull Requests:

- **GitHub Issues** are used for discussion, review, and tracking the CEP proposal lifecycle
- **Pull Requests** are normally used for Standards Track CEPs to contain the actual CEP document and specification changes

### CEP Workflow

CEPs should be submitted as a GitHub Issue in the [ContextVM-docs repository](https://github.com/ContextVM/contextvm-docs). The standard CEP workflow varies slightly depending on the CEP type:

#### For Standards Track CEPs

1. You, the CEP author, create a [well-formatted](#cep-format) GitHub Issue with the `CEP` and `proposal` tags. The CEP number is the same as the GitHub Issue number, the two can be used interchangeably.
2. **Simultaneously**, create a Pull Request that adds a markdown document draft in the `ceps` directory. This PR should contain the focused specification sections following the [CEP Format](#cep-format) structure. Link to this PR in your GitHub Issue.

**Important**: The GitHub Issue and Pull Request serve different purposes and contain different content:

- **GitHub Issue**: Initially contains the comprehensive CEP proposal including all sections (abstract, motivation, rationale, specification, security implications, etc.). This is where community discussion happens. Once a Pull Request is opened, the specification section in the issue should be replaced with a link to the PR to avoid redundancy.
- **Pull Request**: Contains only the specification-related sections (abstract, specification, backwards compatibility, reference implementation, and dependencies) that will become part of the final specification document. The PR should focus exclusively on technical specification content.

3. Find a Maintainer to sponsor your proposal. Maintainers will regularly go over the list of open proposals to determine which proposals to sponsor. You can tag relevant maintainers in your proposal.
4. Once a sponsor is found, the GitHub Issue is assigned to the sponsor. The sponsor will add the `draft` tag.
5. The sponsor will informally review both the Issue and the Pull Request, and may request changes based on community feedback. When ready for formal review, the sponsor will add the `in-review` tag.
6. After the `in-review` tag is added, the CEP enters formal review by the Maintainers. The CEP may be accepted, rejected, or returned for revision.
7. If the CEP has not found a sponsor within three months, Maintainers may close the CEP as `dormant`.

#### For Informational and Process CEPs

1. You, the CEP author, create a [well-formatted](#cep-format) GitHub Issue with the `CEP` and `proposal` tags. The CEP number is the same as the GitHub Issue number, the two can be used interchangeably.
2. Find a Maintainer to sponsor your proposal. Maintainers will regularly go over the list of open proposals to determine which proposals to sponsor. You can tag relevant maintainers in your proposal.
3. Once a sponsor is found, the GitHub Issue is assigned to the sponsor. The sponsor will add the `draft` tag, ensure the CEP number is in the title, and assign a milestone.
4. The sponsor will informally review the proposal and may request changes based on community feedback. When ready for formal review, the sponsor will add the `in-review` tag.
5. After the `in-review` tag is added, the CEP enters formal review by the Maintainers. The CEP may be accepted, rejected, or returned for revision.
6. If the CEP has not found a sponsor within three months, Maintainers may close the CEP as `dormant`.

### CEP Format

Each CEP should have the following parts. For Standards Track CEPs, these sections are distributed between the GitHub Issue and Pull Request as described below:

#### GitHub Issue Content (for discussion and review):

1. **Preamble** -- A short descriptive title, the names and contact info for each author, the current status.
2. **Abstract** -- A short (~200 word) description of the technical issue being addressed.
3. **Motivation** -- The motivation should clearly explain why the existing protocol specification is inadequate to address the problem that the CEP solves. The motivation is critical for CEPs that want to change the ContextVM protocol. CEP submissions without sufficient motivation may be rejected outright.
4. **Rationale** -- The rationale explains why particular design decisions were made. It should describe alternate designs that were considered and related work. The rationale should provide evidence of consensus within the community and discuss important objections or concerns raised during discussion.
5. **Security Implications** -- If there are security concerns in relation to the CEP, those concerns should be explicitly written out to make sure reviewers of the CEP are aware of them.
6. **Specification** -- Initially, this section should contain the technical specification describing syntax and semantics of any new protocol feature. Once a Pull Request is opened, this section should be replaced with a link to the PR to avoid duplication.

#### Pull Request Content (for specification - Standards Track CEPs only):

1. **Preamble** -- A short descriptive title, the names and contact info for each author, the current status.
2. **Abstract** - A short (~200 word) description of the technical issue being addressed (can reference the Issue for full details)
3. **Specification** - The technical specification should describe the syntax and semantics of any new protocol feature. The specification should be detailed enough to allow competing, interoperable implementations. For Standards Track CEPs, this should include the actual changes to the specification files in the Pull Request.
4. **Backward Compatibility** - All CEPs that introduce backward incompatibilities must include a section describing these incompatibilities and their severity. The CEP must explain how the author proposes to deal with these incompatibilities.
5. **Dependencies** - For Standards Track CEPs, this section should list any CEPs that this proposal depends on. Each dependency should be listed with its CEP number and a brief description of how it relates to the current proposal. This helps maintain a clear dependency map and ensures proper implementation order.
6. **Reference Implementation** - The reference implementation must be completed before any CEP is given status "Final", but it need not be completed before the CEP is accepted. While there is merit to the approach of reaching consensus on the specification and rationale before writing code, the principle of "rough consensus and running code" is still useful when it comes to resolving many discussions of protocol details.

**Important**: Once a Pull Request is open, the GitHub Issue's "Specification" section should be updated to simply link to the PR. This ensures the technical specification is maintained in a single location (the PR) while keeping the issue focused on discussion and consensus building.

### Main Specification Integration

Once a Standards Track CEP reaches "Accepted" status, it should be referenced in the main ContextVM specification document. When a CEP reaches "Final" status, the main specification should be updated to include a link to the finalized CEP document.

This ensures that the main specification maintains an up-to-date record of all protocol extensions and enhancements.

### CEP States

CEPs can be one one of the following states:

- `proposal`: CEP proposal without a sponsor.
- `draft`: CEP proposal with a sponsor.
- `in-review`: CEP proposal ready for review.
- `accepted`: CEP accepted by Maintainers, but still requires final wording and reference implementation.
- `rejected`: CEP rejected by Maintainers.
- `withdrawn`: CEP withdrawn.
- `final`: CEP finalized.
- `superseded`: CEP has been replaced by a newer CEP.
- `dormant`: CEP that has not found sponsors and was subsequently closed.

### CEP Review & Resolution

CEPs are reviewed by the ContextVM Maintainers on a regular basis.

For a CEP to be accepted it must meet certain minimum criteria:

- A prototype implementation demonstrating the proposal
- Clear benefit to the ContextVM ecosystem
- Community support and consensus

Once a CEP has been accepted, the reference implementation must be completed. When the reference implementation is complete and incorporated into the main source code repository, the status will be changed to "Final".

A CEP can also be "Rejected" or "Withdrawn". A CEP that is "Withdrawn" may be re-submitted at a later date.

## Reporting CEP Bugs, or Submitting CEP Updates

How you report a bug, or submit a CEP update depends on several factors, such as the maturity of the CEP, the preferences of the CEP author, and the nature of your comments. For CEPs not yet reaching `final` state, it's probably best to send your comments and changes directly to the CEP author. Once CEP is finalized, you may want to submit corrections as a GitHub comment on the issue or pull request to the reference implementation.

## Transferring CEP Ownership

It occasionally becomes necessary to transfer ownership of CEPs to a new CEP author. In general, we'd like to retain the original author as a co-author of the transferred CEP, but that's really up to the original author. A good reason to transfer ownership is when the original author no longer has the time or interest in updating it or following through with the CEP process, or has become unreachable (not responding to email). A bad reason to transfer ownership is when you don't agree with the direction of the CEP. We try to build consensus around a CEP, but if that's not possible, you can always submit a competing CEP.
