import assert from 'node:assert/strict';
import { test } from 'node:test';

import { FeedbackType, ReminderType, Theme } from '@dns/shared-types';

import { createFeedbackSchema, updateProfileSchema, updateRemindersSchema, updateSettingsSchema } from './user.schemas';

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

const ticket = { type: FeedbackType.NotWorking, description: 'Кнопка «Зберегти» не реагує' };
const image = (n: number) => `https://cdn.example.com/feedback/${n}.jpg`;

test('a ticket with only a type and a description is enough', () => {
    const parsed = createFeedbackSchema.parse(ticket);

    assert.equal(parsed.imageUrls, undefined);
    assert.equal(parsed.replyEmail, undefined);
    assert.equal(parsed.context, undefined);
});

test('a complete ticket passes with its reply email normalised', () => {
    const parsed = createFeedbackSchema.parse({
        ...ticket,
        imageUrls: [image(1), image(2), image(3)],
        replyEmail: '  Oleh.Test@Example.COM ',
        context: { appVersion: '1.4.0', platform: 'ios', build: 312, tablet: false },
    });

    assert.equal(parsed.replyEmail, 'oleh.test@example.com');
    assert.equal(parsed.imageUrls?.length, 3);
    assert.deepEqual(parsed.context, { appVersion: '1.4.0', platform: 'ios', build: 312, tablet: false });
});

test('the description must be between 10 and 1000 characters', () => {
    const submit = (description: string) => createFeedbackSchema.safeParse({ ...ticket, description });

    assert.equal(submit('a'.repeat(9)).success, false);
    assert.equal(submit('a'.repeat(10)).success, true);
    assert.equal(submit('a'.repeat(1000)).success, true);

    const tooLong = submit('a'.repeat(1001));
    assert.equal(tooLong.success, false);
    assert.equal(tooLong.error?.errors[0]?.path.join('.'), 'description');
});

test('padding around the description counts towards neither limit', () => {
    const submit = (description: string) => createFeedbackSchema.safeParse({ ...ticket, description });

    assert.equal(submit(`    ${'a'.repeat(9)}    `).success, false);
    assert.equal(submit(' '.repeat(10)).success, false);

    const padded = createFeedbackSchema.parse({ ...ticket, description: `\n ${'a'.repeat(1000)} \n` });
    assert.equal(padded.description, 'a'.repeat(1000));
});

test('description length is counted in UTF-16 units, not in visible characters', () => {
    // Current behaviour, not a product decision: an emoji is two units, so five
    // of them clear the minimum of 10 and 501 overrun the maximum of 1000.
    // The app's counter (`description.length`) counts the same way.
    const submit = (description: string) => createFeedbackSchema.safeParse({ ...ticket, description });

    assert.equal(submit('🍎'.repeat(5)).success, true);
    assert.equal(submit('🍎'.repeat(500)).success, true);
    assert.equal(submit('🍎'.repeat(501)).success, false);
});

test('at most three images may be attached', () => {
    const attach = (count: number) =>
        createFeedbackSchema.safeParse({ ...ticket, imageUrls: Array.from({ length: count }, (_, i) => image(i)) });

    assert.equal(attach(0).success, true);
    assert.equal(attach(3).success, true);

    const four = attach(4);
    assert.equal(four.success, false);
    assert.equal(four.error?.errors[0]?.path.join('.'), 'imageUrls');
});

test('an image must be a URL', () => {
    const parsed = createFeedbackSchema.safeParse({ ...ticket, imageUrls: [image(1), 'feedback/2.jpg'] });

    assert.equal(parsed.success, false);
    assert.equal(parsed.error?.errors[0]?.path.join('.'), 'imageUrls.1');
});

test('a ticket without a type, or with an unknown one, is rejected', () => {
    const unknown = createFeedbackSchema.safeParse({ ...ticket, type: 'complaint' });
    assert.equal(unknown.success, false);
    assert.equal(unknown.error?.errors[0]?.path.join('.'), 'type');

    assert.equal(createFeedbackSchema.safeParse({ description: ticket.description }).success, false);
    assert.equal(createFeedbackSchema.safeParse({ ...ticket, type: 'Bug' }).success, false);
});

test('a malformed reply email is rejected', () => {
    const parsed = createFeedbackSchema.safeParse({ ...ticket, replyEmail: 'oleh@' });

    assert.equal(parsed.success, false);
    assert.equal(parsed.error?.errors[0]?.path.join('.'), 'replyEmail');
});

test('a blank reply email is rejected — no email means leaving the field out', () => {
    // Current behaviour: `optional()` admits only an absent key. A form that
    // posts its empty input as-is gets a 422 instead of a ticket without a
    // reply address.
    assert.equal(createFeedbackSchema.safeParse({ ...ticket, replyEmail: '' }).success, false);
    assert.equal(createFeedbackSchema.safeParse({ ...ticket, replyEmail: '   ' }).success, false);
    assert.equal(createFeedbackSchema.safeParse({ ...ticket, replyEmail: null }).success, false);
});
