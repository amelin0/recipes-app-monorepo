---
title: <Feature Name>
bucket: client
domain: <domain>
status: Draft
owner: '@username'
created: YYYY-MM-DD
updated: YYYY-MM-DD
plan: ./plan.md
related-adrs: []
supersedes: null
---

# Feature Specification: <FEATURE NAME>

> **Folder convention:** every feature lives in its own folder
> `docs/specs/<bucket>/<domain>/<feature>/` containing `spec.md` (this
> file) and `plan.md`. Supporting artifacts (diagrams, research notes)
> live in the same folder.
>
> **Purpose:** describe **WHAT** users need and **WHY**. Implementation
> details (DB schema, endpoints, file paths) live in `plan.md`. Keep
> this document technology-agnostic.

## User Scenarios & Testing *(mandatory)*

<!--
User stories must be PRIORITIZED (P1, P2, P3) and INDEPENDENTLY TESTABLE —
implementing only one yields a viable slice of value. Each story is a
standalone deliverable: developed, tested, deployed, demonstrated alone.
-->

### User Story 1 — <Brief Title> (Priority: P1)

<User journey in plain language.>

**Why this priority:** <value + why most critical>

**Independent Test:** <how to verify this story in isolation>

**Acceptance Scenarios:**

1. **Given** <initial state>, **When** <action>, **Then** <expected outcome>
2. **Given** <initial state>, **When** <action>, **Then** <expected outcome>

---

### User Story 2 — <Brief Title> (Priority: P2)

<User journey in plain language.>

**Why this priority:** <value + why second most important>

**Independent Test:** <how to verify in isolation>

**Acceptance Scenarios:**

1. **Given** <initial state>, **When** <action>, **Then** <expected outcome>

---

### User Story 3 — <Brief Title> (Priority: P3)

<User journey in plain language.>

**Why this priority:** <value>

**Independent Test:** <how to verify in isolation>

**Acceptance Scenarios:**

1. **Given** <initial state>, **When** <action>, **Then** <expected outcome>

---

### Edge Cases

- What happens when <boundary condition>?
- How does the system handle <error scenario>?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST <specific capability, e.g. "allow users to create accounts">
- **FR-002**: System MUST <specific capability, e.g. "validate email addresses">
- **FR-003**: Users MUST be able to <key interaction, e.g. "reset their password">
- **FR-004**: System MUST <data requirement, e.g. "persist user preferences">
- **FR-005**: System MUST <behavior, e.g. "log all security events">

*Mark unclear requirements:*

- **FR-NNN**: System MUST authenticate users via [NEEDS CLARIFICATION: <what's missing>]

### Key Entities *(include if feature involves data)*

- **<Entity 1>**: <what it represents — domain language, no implementation>
- **<Entity 2>**: <relationships to other entities>

## Success Criteria *(mandatory)*

<!-- Technology-agnostic, measurable. -->

- **SC-001**: <e.g. "Users can complete sign-up in under 2 minutes">
- **SC-002**: <e.g. "System handles 1000 concurrent users without degradation">
- **SC-003**: <e.g. "90% of users finish primary task on first attempt">
- **SC-004**: <e.g. "Reduce support tickets related to X by 50%">

## Assumptions

- <Assumption about target users>
- <Scope boundary, e.g. "Offline mode is out of scope for V1">
- <External dependency, e.g. "Existing user-profile API will be reused">

## Out of Scope

- <Explicit non-goal>

## Open Questions

- [ ] <Question that blocks moving to Approved>

## Related

- Plan: [./plan.md](./plan.md)
- ADRs: <links once decided>
- Code (after implementation): `<paths>`

