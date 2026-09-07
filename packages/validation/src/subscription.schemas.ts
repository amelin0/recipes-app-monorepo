import { z } from 'zod';

import { REFERRAL_CODE_LENGTH } from '@dns/constants';
import { PurchaseStore } from '@dns/shared-types';

/**
 * A code as somebody typed it.
 *
 * Normalised here rather than compared loosely in SQL: a code pasted from a
 * message arrives with spaces and in whatever case the sender's keyboard
 * produced, and «the same code» has to mean the same thing everywhere.
 */
export const referralCodeSchema = z
    .string()
    .trim()
    .transform(value => value.toUpperCase())
    .refine(value => value.length === REFERRAL_CODE_LENGTH, `A code is ${REFERRAL_CODE_LENGTH} characters`);

export const referralCodeParamSchema = z.object({ code: referralCodeSchema });

export const redeemReferralSchema = z.object({ code: referralCodeSchema });

/**
 * A receipt from a store.
 *
 * The server never trusts the plan the client claims to have bought: the
 * product id comes back from the store, and the plan is looked up from it.
 * That is what stops a client from paying for a month and asking for a year.
 */
export const submitReceiptSchema = z.object({
    store: z.nativeEnum(PurchaseStore).refine(value => value !== PurchaseStore.None, 'Name a store'),
    receipt: z.string().min(1, 'The receipt is empty'),
    /** Google needs it alongside the token; Apple carries it inside the receipt. */
    productId: z.string().min(1).optional(),
});

export type RedeemReferralInput = z.infer<typeof redeemReferralSchema>;
export type SubmitReceiptInput = z.infer<typeof submitReceiptSchema>;
