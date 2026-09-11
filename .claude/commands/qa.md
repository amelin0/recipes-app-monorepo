---
description: Black-box QA of one feature — builds the committed code on an isolated stand and runs the qa-tester agent against its spec
argument-hint: <docs/specs/.../spec.md> [--ref <git-ref>] [--web] [--retest <report.md>]
---

Run an independent QA pass. Arguments: `$ARGUMENTS`

The qa-tester agent is worth something only because it knows nothing but
the spec. You — the session that invokes this command — may well be the one
that wrote the code, so your job here is purely mechanical: bring the stand
up, hand over the fixed prompt, file the report. Do not editorialise at any
step.

## 1. Check the arguments

- The first argument must be an existing `docs/specs/<bucket>/<domain>/<feature>/spec.md`.
  Anything else (a plan.md, a folder, a feature name) — stop and ask for the
  spec path.
- `--ref <git-ref>` — what to build (default `HEAD`). `--web` — also start
  the admin panel; add it automatically when the spec is under
  `docs/specs/admin/`.
- `--retest <report.md>` — a previous qa-tester report to re-check.

## 2. Bring the stand up

```bash
bash scripts/qa-up.sh up [--ref <git-ref>] [--web]
```

Run it with a 10-minute timeout. It prints `env.md` at the end; the run
directory is the folder that holds it (by default
`<repo>-qa/run`, next to the repository).

- If it warns about uncommitted changes, pass that warning on to the user:
  the stand tests the last commit, not the working tree.
- If install, build, migration or startup fails — stop and show the user
  the failing step and the tail of its log. A build that does not start is
  itself the result. Do not change code to get the stand up.

## 3. Launch the agent

Use the Agent tool with `subagent_type: qa-tester` and **exactly** this
prompt, filling only the placeholders:

```
Feature spec: <spec path>
QA stand: <absolute path of the run directory>/env.md
[Re-test: <absolute path of the previous report>]

Test this feature against its spec, following your instructions.
```

Add nothing else. No summary of what changed, no branch name, no hints on
what to focus on or what is "already handled", no results of your own
testing. If the user asked for a focus, pass it on as their words, quoted
and attributed ("Користувач просить звернути увагу на: …"). Pass nothing of
your own.

## 4. File the report

- Save the agent's report verbatim to
  `<run directory>/reports/<YYYY-MM-DD-HHmm>-<domain>-<feature>.md`
  (create the folder). For a re-test the agent reads that folder on the next
  run, so it must stay inside the run directory.
- Show the user: the result line, each `BUG` / `CONTRACT-DRIFT` title with
  its severity, and the report path.
- Do not fix anything in this turn and do not argue with findings inside the
  report. If you believe a finding is wrong, say so separately, marked as
  the developer's view — the user decides.
- Suggest the next step: every confirmed `BUG` becomes a failing
  `*.db-spec.ts` test first, then the fix. After the fixes are committed:
  `/qa <spec> --retest <report path>`.

The stand keeps running for a re-test. `bash scripts/qa-up.sh down` stops
it; `down --purge` also removes the worktree, the run directory and the
`dns_qa` database.
