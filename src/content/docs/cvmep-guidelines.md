---
title: ContextVM Enhancement Proposal Guidelines
description: Guidelines for proposing changes to the ContextVM protocol
---

# CVMEP Guidelines

> ContextVM Enhancement Proposal (CVMEP) guidelines for proposing changes to the ContextVM protocol

## What is a CVMEP?

CVMEP stands for ContextVM Enhancement Proposal. A CVMEP is a design document providing information to the ContextVM community, or describing a new feature for the ContextVM protocol or its processes or environment. The CVMEP should provide a concise technical specification of the feature and a rationale for the feature.

We intend CVMEPs to be the primary mechanisms for proposing major new features, for collecting community input on an issue, and for documenting the design decisions that have gone into ContextVM. The CVMEP author is responsible for building consensus within the community and documenting dissenting opinions.

Because the CVMEPs are maintained as text files in a versioned repository (GitHub Issues), their revision history is the historical record of the feature proposal.

## What qualifies a CVMEP?

The goal is to reserve the CVMEP process for changes that are substantial enough to require broad community discussion, a formal design document, and a historical record of the decision-making process. A regular GitHub issue or pull request is often more appropriate for smaller, more direct changes.

Consider proposing a CVMEP if your change involves any of the following:

- **A New Feature or Protocol Change**: Any change that adds, modifies, or removes features in the ContextVM protocol. This includes:
  - Adding new event kinds or Nostr integration patterns.
  - Changing the syntax or semantics of existing data structures or messages.
  - Introducing a new standard for interoperability between different ContextVM-compatible tools.
  - Significant changes to how the specification itself is defined, presented, or validated.
- **A Breaking Change**: Any change that is not backwards-compatible.
- **A Change to Governance or Process**: Any proposal that alters the project's decision-making, contribution guidelines (like this document itself).
- **A Complex or Controversial Topic**: If a change is likely to have multiple valid solutions or generate significant debate, the CVMEP process provides the necessary framework to explore alternatives, document the rationale, and build community consensus before implementation begins.

## CVMEP Types

There are three kinds of CVMEP:

1. **Standards Track** CVMEP describes a new feature or implementation for the ContextVM protocol. It may also describe an interoperability standard that will be supported outside the core protocol specification.
2. **Informational** CVMEP describes a ContextVM protocol design issue, or provides general guidelines or information to the ContextVM community, but does not propose a new feature. Informational CVMEPs do not necessarily represent a ContextVM community consensus or recommendation.
3. **Process** CVMEP describes a process surrounding ContextVM, or proposes a change to (or an event in) a process. Process CVMEPs are like Standards Track CVMEPs but apply to areas other than the ContextVM protocol itself.

## Submitting a CVMEP

The CVMEP process begins with a new idea for the ContextVM protocol. It is highly recommended that a single CVMEP contain a single key proposal or new idea. Small enhancements or patches often don't need a CVMEP and can be injected into the ContextVM development workflow with a pull request to the ContextVM repo. The more focused the CVMEP, the more successful it tends to be.

Each CVMEP must have an **CVMEP author** -- someone who writes the CVMEP using the style and format described below, shepherds the discussions in the appropriate forums, and attempts to build community consensus around the idea. The CVMEP author should first attempt to ascertain whether the idea is CVMEP-able. Posting to the ContextVM community forums (Nostr, Signal, GitHub Discussions) is the best way to go about this.

### CVMEP Workflow

CVMEPs should be submitted as a GitHub Issue in the [ContextVM repository](https://github.com/contextvm/ts-sdk). The standard CVMEP workflow is:

1. You, the CVMEP author, create a [well-formatted](#cvmep-format) GitHub Issue with the `CVMEP` and `proposal` tags. The CVMEP number is the same as the GitHub Issue number, the two can be used interchangably.
2. Find a Core Maintainer or Maintainer to sponsor your proposal. Core Maintainers and Maintainers will regularly go over the list of open proposals to determine which proposals to sponsor. You can tag relevant maintainers from [the maintainer list](https://github.com/contextvm/ts-sdk/blob/main/MAINTAINERS.md) in your proposal.
3. Once a sponsor is found, the GitHub Issue is assigned to the sponsor. The sponsor will add the `draft` tag, ensure the CVMEP number is in the title, and assign a milestone.
4. The sponsor will informally review the proposal and may request changes based on community feedback. When ready for formal review, the sponsor will add the `in-review` tag.
5. After the `in-review` tag is added, the CVMEP enters formal review by the Core Maintainers team. The CVMEP may be accepted, rejected, or returned for revision.
6. If the CVMEP has not found a sponsor within three months, Core Maintainers may close the CVMEP as `dormant`.

### CVMEP Format

Each CVMEP should have the following parts:

1. **Preamble** -- A short descriptive title, the names and contact info for each author, the current status.
2. **Abstract** -- A short (~200 word) description of the technical issue being addressed.
3. **Motivation** -- The motivation should clearly explain why the existing protocol specification is inadequate to address the problem that the CVMEP solves. The motivation is critical for CVMEPs that want to change the ContextVM protocol. CVMEP submissions without sufficient motivation may be rejected outright.
4. **Specification** -- The technical specification should describe the syntax and semantics of any new protocol feature. The specification should be detailed enough to allow competing, interoperable implementations. A PR with the changes to the specification should be provided.
5. **Rationale** -- The rationale explains why particular design decisions were made. It should describe alternate designs that were considered and related work. The rationale should provide evidence of consensus within the community and discuss important objections or concerns raised during discussion.
6. **Backward Compatibility** -- All CVMEPs that introduce backward incompatibilities must include a section describing these incompatibilities and their severity. The CVMEP must explain how the author proposes to deal with these incompatibilities.
7. **Reference Implementation** -- The reference implementation must be completed before any CVMEP is given status "Final", but it need not be completed before the CVMEP is accepted. While there is merit to the approach of reaching consensus on the specification and rationale before writing code, the principle of "rough consensus and running code" is still useful when it comes to resolving many discussions of protocol details.
8. **Security Implications** -- If there are security concerns in relation to the CVMEP, those concerns should be explicitly written out to make sure reviewers of the CVMEP are aware of them.

### CVMEP States

CVMEPs can be one one of the following states:

- `proposal`: CVMEP proposal without a sponsor.
- `draft`: CVMEP proposal with a sponsor.
- `in-review`: CVMEP proposal ready for review.
- `accepted`: CVMEP accepted by Core Maintainers, but still requires final wording and reference implementation.
- `rejected`: CVMEP rejected by Core Maintainers.
- `withdrawn`: CVMEP withdrawn.
- `final`: CVMEP finalized.
- `superseded`: CVMEP has been replaced by a newer CVMEP.
- `dormant`: CVMEP that has not found sponsors and was subsequently closed.

### CVMEP Review & Resolution

CVMEPs are reviewed by the ContextVM Core Maintainers team on a bi-weekly basis.

For a CVMEP to be accepted it must meet certain minimum criteria:

- A prototype implementation demonstrating the proposal
- Clear benefit to the ContextVM ecosystem
- Community support and consensus

Once a CVMEP has been accepted, the reference implementation must be completed. When the reference implementation is complete and incorporated into the main source code repository, the status will be changed to "Final".

A CVMEP can also be "Rejected" or "Withdrawn". A CVMEP that is "Withdrawn" may be re-submitted at a later date.

## Reporting CVMEP Bugs, or Submitting CVMEP Updates

How you report a bug, or submit a CVMEP update depends on several factors, such as the maturity of the CVMEP, the preferences of the CVMEP author, and the nature of your comments. For CVMEPs not yet reaching `final` state, it's probably best to send your comments and changes directly to the CVMEP author. Once CVMEP is finalized, you may want to submit corrections as a GitHub comment on the issue or pull request to the reference implementation.

## Transferring CVMEP Ownership

It occasionally becomes necessary to transfer ownership of CVMEPs to a new CVMEP author. In general, we'd like to retain the original author as a co-author of the transferred CVMEP, but that's really up to the original author. A good reason to transfer ownership is when the original author no longer has the time or interest in updating it or following through with the CVMEP process, or has become unreachable (not responding to email). A bad reason to transfer ownership is when you don't agree with the direction of the CVMEP. We try to build consensus around a CVMEP, but if that's not possible, you can always submit a competing CVMEP.
