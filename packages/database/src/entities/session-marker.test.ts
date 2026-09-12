import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accessTokenIssuedAt, tokenIssuedAtIsAccepted } from './session-marker';

const at = (iso: string): Date => new Date(iso);

test('an account never revoked gets the current second', () => {
    assert.equal(accessTokenIssuedAt(null, at('2026-09-13T10:00:00.700Z').getTime()), 1_789_293_600);
});

test('a token minted in the same second as the revocation is stamped past it, and accepted', () => {
    // The QA finding: revoke at .300, sign in at .700 of the same second. The
    // floored `iat` is .000 — before the marker — so the new session was born
    // dead. Stamping the first whole second after the marker keeps it alive.
    const marker = at('2026-09-13T10:00:00.300Z');
    const iat = accessTokenIssuedAt(marker, at('2026-09-13T10:00:00.700Z').getTime());

    assert.equal(iat, 1_789_293_601);
    assert.equal(tokenIssuedAtIsAccepted(marker, iat), true);
});

test('a token minted before the revocation is still refused', () => {
    // The strict side of the ambiguity must survive the fix: lifting `iat`
    // happens at signing, never at checking.
    const marker = at('2026-09-13T10:00:00.300Z');
    const mintedBefore = accessTokenIssuedAt(null, at('2026-09-13T10:00:00.100Z').getTime());

    assert.equal(tokenIssuedAtIsAccepted(marker, mintedBefore), false);
});

test('a marker on a whole second needs no lift', () => {
    const marker = at('2026-09-13T10:00:00.000Z');
    const iat = accessTokenIssuedAt(marker, at('2026-09-13T10:00:00.400Z').getTime());

    assert.equal(iat, 1_789_293_600);
    assert.equal(tokenIssuedAtIsAccepted(marker, iat), true);
});

test('a marker a little ahead of this clock is cleared — the database stamps it, not us', () => {
    const now = at('2026-09-13T10:00:00.200Z').getTime();
    const marker = at('2026-09-13T10:00:02.500Z');
    const iat = accessTokenIssuedAt(marker, now);

    assert.equal(iat, 1_789_293_603);
    assert.equal(tokenIssuedAtIsAccepted(marker, iat), true);
});

test('a marker far ahead is not chased: the token stays refused rather than living longer', () => {
    // Lifting `iat` also moves `exp`. An unbounded lift would turn a bad
    // clock into access tokens that outlive their fifteen minutes.
    const now = at('2026-09-13T10:00:00.200Z').getTime();
    const marker = at('2026-09-13T10:05:00.000Z');
    const iat = accessTokenIssuedAt(marker, now);

    assert.equal(iat, 1_789_293_600);
    assert.equal(tokenIssuedAtIsAccepted(marker, iat), false);
});

test('a token without iat is refused once the account has a marker', () => {
    assert.equal(tokenIssuedAtIsAccepted(at('2026-09-13T10:00:00.000Z'), undefined), false);
    assert.equal(tokenIssuedAtIsAccepted(null, undefined), true);
});
