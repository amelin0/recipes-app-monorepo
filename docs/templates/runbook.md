---
title: <procedure>
severity: medium
owner: '@oncall'
last-tested: YYYY-MM-DD
---

# <Procedure>

## When to use this

<Symptoms, triggers, alert names — one paragraph.>

## Prerequisites

- Access to <system>
- CLI tool `<name>` installed
- Secrets in `<vault path>`

## Steps

1. ...
2. ...
3. ...

## Verification

How to confirm the procedure worked.

## Rollback

If step N fails, do <action>.

## Postmortem hooks

- Open issue in Linear with label `incident`
- Page on-call if duration > 30 min
- Update related spec/plan if the incident exposed drift
