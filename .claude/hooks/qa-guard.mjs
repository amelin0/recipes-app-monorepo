// PreToolUse guard for the qa-tester agent — wired in its frontmatter, so it
// runs only while that agent does.
//
// The agent is a black-box tester: its oracle is the spec, never the code.
// A rule in the prompt alone does not hold — "just to understand the
// endpoint" a model opens the controller and then tests what it read. So
// reading is an allowlist, not a blocklist:
//
//   docs/specs/**  (except plan.md — that is HOW, written by the developer)
//   docs/adr/**
//   <QA_ROOT>/run/**  (env.md, OpenAPI documents, server logs, scratch)
//
// This stops accidental peeking; it is not a sandbox against an adversary.
// Bash in particular is matched by pattern, and a determined command gets past it.

import { readFileSync } from 'node:fs';
import path from 'node:path';

let tool, args, projectDir, runDir, allowedRoots;

function check() {
    switch (tool) {
        case 'Read':
            return checkPath(args.file_path);
        case 'Grep':
            return args.path
                ? checkPath(args.path)
                : 'Grep needs an explicit `path` inside docs/specs, docs/adr or the run dir';
        case 'Glob':
            if (isAbsolute(args.pattern)) return checkPath(globBase(args.pattern));
            return args.path
                ? checkPath(args.path)
                : 'Glob needs an explicit `path` inside docs/specs, docs/adr or the run dir';
        case 'Bash':
            return checkBash(String(args.command ?? ''));
        case 'mcp__claude-in-chrome__navigate':
            return checkUrl(String(args.url ?? ''));
        default:
            return null;
    }
}

function checkPath(raw) {
    if (!raw) return 'no path given';
    const target = norm(path.resolve(projectDir, toNative(raw)));
    if (path.posix.basename(target).toLowerCase() === 'plan.md') {
        return 'plan.md describes the implementation; test against spec.md and the OpenAPI document';
    }
    const allowed = allowedRoots.some(root => same(target, root) || startsWith(target, `${root}/`));
    return allowed ? null : `${raw} is outside what QA may read (docs/specs, docs/adr, ${runDir})`;
}

const BASH_RULES = [
    [/\bgit\b/, 'git is off limits: history and diffs show the implementation'],
    [/(^|[\s'"=:/\\])(apps|packages|infra)[\\/]/, 'source trees are off limits'],
    [/worktree/i, 'the QA worktree holds the sources and is off limits'],
    [/plan\.md|HANDOFF|\.claude|knowledge/i, 'implementation notes are off limits'],
    [
        /\b(rg|find)\b|\bgrep\s+(-\S*\s+)*-\S*[rR]|\bls\s+(-\S*\s+)*-\S*R/,
        'no recursive search in Bash — use the Grep/Glob tools with a path',
    ],
    [/\bredis-cli\b/, 'redis is not part of the observable surface'],
];

function checkBash(command) {
    for (const [pattern, message] of BASH_RULES) {
        if (pattern.test(command)) return message;
    }
    if (/\bdocker\b/.test(command)) {
        const calls = [...command.matchAll(/\bdocker\s+(\S+)(\s+-i)?\s+(\S+)\s+(\S+)/g)];
        const onlyPsql =
            calls.length === command.match(/\bdocker\b/g).length &&
            calls.every(
                ([, verb, , container, program]) =>
                    verb === 'exec' && container === 'dns-postgres' && program === 'psql',
            );
        if (!onlyPsql) return 'docker is allowed only as `docker exec dns-postgres psql -U dns_qa_ro -d dns_qa`';
    }
    if (/\bpsql\b/.test(command)) {
        const users = [...command.matchAll(/(?:-U\s*|--username[=\s]+)(\S+)/g)].map(match => match[1]);
        if (users.length === 0 || users.some(user => user !== 'dns_qa_ro')) {
            return 'psql only as the read-only role: -U dns_qa_ro -d dns_qa';
        }
    }
    return null;
}

function checkUrl(url) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
        ? null
        : 'the browser stays on the local QA stand (localhost)';
}

// ── path helpers: Windows paths, MSYS paths (/d/…) and case-insensitivity ──

function toNative(raw) {
    const msys = /^\/([a-zA-Z])\/(.*)$/.exec(raw);
    return msys ? `${msys[1]}:/${msys[2]}` : raw;
}

function norm(raw) {
    return path
        .resolve(toNative(String(raw)))
        .replaceAll('\\', '/')
        .replace(/\/+$/, '');
}

function isAbsolute(raw) {
    return typeof raw === 'string' && (path.isAbsolute(toNative(raw)) || /^[a-zA-Z]:/.test(raw));
}

function globBase(pattern) {
    const parts = toNative(pattern).replaceAll('\\', '/').split('/');
    const index = parts.findIndex(part => /[*?[{]/.test(part));
    return (index === -1 ? parts : parts.slice(0, index)).join('/') || '/';
}

function fold(value) {
    return process.platform === 'win32' ? value.toLowerCase() : value;
}

function same(a, b) {
    return fold(a) === fold(b);
}

function startsWith(value, prefix) {
    return fold(value).startsWith(fold(prefix));
}

function deny(reason) {
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'deny',
                permissionDecisionReason: `qa-guard: ${reason}`,
            },
        }),
    );
}

// Fails closed: a hook that crashes exits non-zero, and Claude Code treats
// that as a non-blocking error — the call would go through unchecked.
try {
    const input = JSON.parse(readFileSync(0, 'utf8'));
    tool = input.tool_name;
    args = input.tool_input ?? {};
    projectDir = norm(process.env.CLAUDE_PROJECT_DIR || input.cwd);
    runDir = `${norm(process.env.QA_ROOT || `${projectDir}-qa`)}/run`;
    allowedRoots = [`${projectDir}/docs/specs`, `${projectDir}/docs/adr`, runDir];

    const reason = check();
    if (reason) deny(reason);
} catch (error) {
    deny(`guard failed, call blocked to be safe: ${error instanceof Error ? error.message : error}`);
}
process.exit(0);
