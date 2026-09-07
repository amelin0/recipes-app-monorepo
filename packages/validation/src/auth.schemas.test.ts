import assert from 'node:assert/strict';
import { test } from 'node:test';

import { emailSchema, otpCodeSchema, passwordSchema, registerSchema, setNewPasswordSchema } from './auth.schemas';

test('email is trimmed and lower-cased so comparison is case-insensitive', () => {
    assert.equal(emailSchema.parse('  Oleh.Test@Example.COM '), 'oleh.test@example.com');
});

test('password must carry a letter and a digit', () => {
    assert.equal(passwordSchema.safeParse('password').success, false);
    assert.equal(passwordSchema.safeParse('12345678').success, false);
    assert.equal(passwordSchema.safeParse('passw0rd').success, true);
});

test('password shorter than the minimum is rejected', () => {
    assert.equal(passwordSchema.safeParse('pas5w').success, false);
});

test('a password over 72 bytes is rejected rather than silently truncated', () => {
    // 40 Cyrillic characters are 80 bytes in UTF-8 — under any character
    // count bcrypt would still drop the tail.
    const cyrillic = `${'п'.repeat(40)}1`;
    assert.ok(Buffer.byteLength(cyrillic, 'utf8') > 72);
    assert.equal(passwordSchema.safeParse(cyrillic).success, false);

    assert.equal(passwordSchema.safeParse(`${'a'.repeat(70)}1`).success, true);
});

test('register normalises the email in one pass', () => {
    const parsed = registerSchema.parse({ email: 'USER@Example.com', password: 'passw0rd' });
    assert.equal(parsed.email, 'user@example.com');
});

test('the reset form requires the confirmation to match', () => {
    const base = { permitToken: 'permit', password: 'passw0rd' };

    assert.equal(setNewPasswordSchema.safeParse({ ...base, passwordConfirmation: 'passw0rd' }).success, true);

    const mismatch = setNewPasswordSchema.safeParse({ ...base, passwordConfirmation: 'passw0rdX' });
    assert.equal(mismatch.success, false);
    assert.equal(mismatch.error?.errors[0]?.path.join('.'), 'passwordConfirmation');
});

test('the code must be exactly six digits, not six of anything', () => {
    assert.equal(otpCodeSchema.safeParse('123456').success, true);
    assert.equal(otpCodeSchema.safeParse('  123456  ').success, true);

    // Regression guard: an escaped `d` that collapses to a literal character
    // would let this through.
    assert.equal(otpCodeSchema.safeParse('dddddd').success, false);
    assert.equal(otpCodeSchema.safeParse('12345').success, false);
    assert.equal(otpCodeSchema.safeParse('1234567').success, false);
});
