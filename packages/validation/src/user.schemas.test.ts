import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ReminderType, Theme } from '@dns/shared-types';

import { updateProfileSchema, updateRemindersSchema, updateSettingsSchema } from './user.schemas';

test('a settings patch may carry a single switch', () => {
    assert.equal(updateSettingsSchema.safeParse({ theme: Theme.Dark }).success, true);
});

test('an empty settings patch is rejected rather than treated as a no-op', () => {
    assert.equal(updateSettingsSchema.safeParse({}).success, false);
});

test('an unsupported language is rejected', () => {
    assert.equal(updateSettingsSchema.safeParse({ language: 'uk' }).success, true);
    assert.equal(updateSettingsSchema.safeParse({ language: 'kl' }).success, false);
});

test('a blank name is rejected', () => {
    assert.equal(updateProfileSchema.safeParse({ name: '   ' }).success, false);
    assert.equal(updateProfileSchema.safeParse({ name: '  Олег  ' }).success, true);
    assert.equal(updateProfileSchema.parse({ name: '  Олег  ' }).name, 'Олег');
});

test('a meal reminder needs a time and the weigh-in must not have one', () => {
    const meal = { type: ReminderType.Breakfast, enabled: true };
    assert.equal(updateRemindersSchema.safeParse({ reminders: [meal] }).success, false);
    assert.equal(updateRemindersSchema.safeParse({ reminders: [{ ...meal, time: '08:00' }] }).success, true);

    const weighIn = { type: ReminderType.WeighIn, enabled: true };
    assert.equal(updateRemindersSchema.safeParse({ reminders: [weighIn] }).success, true);
    assert.equal(updateRemindersSchema.safeParse({ reminders: [{ ...weighIn, time: '08:00' }] }).success, false);
});

test('time must be a real wall-clock value', () => {
    const at = (time: string) =>
        updateRemindersSchema.safeParse({ reminders: [{ type: ReminderType.Lunch, enabled: true, time }] }).success;

    assert.equal(at('00:00'), true);
    assert.equal(at('23:59'), true);
    assert.equal(at('24:00'), false);
    assert.equal(at('12:60'), false);
    assert.equal(at('8:00'), false);
});

test('the same reminder type cannot appear twice', () => {
    const parsed = updateRemindersSchema.safeParse({
        reminders: [
            { type: ReminderType.Lunch, enabled: true, time: '13:00' },
            { type: ReminderType.Lunch, enabled: false, time: '14:00' },
        ],
    });

    assert.equal(parsed.success, false);
});
