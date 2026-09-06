# Architectural Decision Records

This folder captures **why** we made architectural choices — not what they are (that's documented elsewhere).

Each ADR is a small Markdown file describing a single decision. Once written, an ADR is rarely edited; if a decision is reversed, write a new ADR that **supersedes** the old one and update the old one's status.

## Format

Use [`../templates/adr.md`](../templates/adr.md) (or run `/new-adr <title>`).
Filename: `NNNN-kebab-case-title.md` (e.g. `0003-uniwind-pro-over-nativewind.md`).
Keep numbering monotonic — never reuse a number.

## Status values

- **Proposed** — under discussion
- **Accepted** — current decision in effect
- **Superseded by ADR-NNNN** — replaced by a newer decision (link forward)
- **Deprecated** — no longer applicable, no replacement

## When to write one

A decision is ADR-worthy when at least one of these is true:

- It rules out a credible alternative ("we picked X over Y").
- Reversing it later will be expensive (data migration, large refactor).
- A new contributor would reasonably ask "why?" without reading the codebase.

Skip an ADR for routine choices that follow from existing skills / conventions.

## Index

<!-- Update this list when adding a new ADR. -->

- [ADR-0001](./0001-nestjs-drizzle-modular-monolith.md) — Бекенд: модульний моноліт на NestJS + Drizzle, а не продовження Supabase — **Accepted**
- [ADR-0002](./0002-split-client-and-admin-api.md) — Два окремі сервіси: client-api і admin-api замість одного застосунку з бакетами — **Accepted**
- [ADR-0003](./0003-auth-model-tokens-and-admin-permissions.md) — Модель автентифікації: окремі users і admins, ланцюжки сесій на пристрій, deny-by-default для стафу — **Accepted**
- [ADR-0004](./0004-client-api-url-conventions.md) — Шляхи клієнтського API будуються за REST-конвенціями, а не успадковуються з V1 — **Accepted**
- [ADR-0005](./0005-what-account-deletion-erases.md) — Чого саме торкається видалення акаунту після пільгового періоду — **Proposed**
- [ADR-0006](./0006-products-absorb-ingredients.md) — Продукти поглинають інгредієнти; фільтри рецептів комбінуються по-різному в різних групах — **Accepted**
