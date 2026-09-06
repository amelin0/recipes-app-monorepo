import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OtpService } from './otp.service';

test('returns the dev code verbatim when one is configured', () => {
    const service = new OtpService({ devCode: '000000' });

    assert.equal(service.generateCode(), '000000');
    assert.equal(service.generateCode(), '000000');
});

test('generates six digits when no dev code is configured', () => {
    const service = new OtpService({});

    for (let i = 0; i < 50; i++) {
        assert.match(service.generateCode(), /^[0-9]{6}$/);
    }
});

test('a hashed code matches itself and nothing else', async () => {
    const service = new OtpService({});
    const codeHash = await service.hashCode('123456');

    assert.notEqual(codeHash, '123456');
    assert.equal(await service.matches('123456', codeHash), true);
    assert.equal(await service.matches('123457', codeHash), false);
});
