import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, gt, inArray, isNull, lte, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { PurchaseStore, SubscriptionSource, SubscriptionStatus } from '@dns/shared-types';

import { ReferenceEntity, SubscriptionEntity, SubscriptionPlanEntity } from '../../entities';
import {
    referralCodes,
    referralRedemptions,
    planFeatureTranslations,
    planFeatures,
    storeTransactions,
    subscriptionPlanTranslations,
    subscriptionPlans,
    subscriptions,
} from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

type Tx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

/** Anything that can run a select — the pool, or a transaction already under way. */
type Reader = Pick<DrizzleDB, 'select'>;

export interface ReferralStats {
    /** Everybody who redeemed the code. */
    invited: number;
    /** Those of them who have since paid — see `convertedRedemption`. */
    converted: number;
    /** Those whose conversion has actually been rewarded. Trails `converted` only while a grant is failing. */
    rewarded: number;
}

/** How the reward is shaped. The calendar rule belongs to the service, so it is handed in. */
export interface ReferralRewardTerms {
    /** The plan a reward lands on when the referrer has nothing to lengthen. */
    planSlug: string;
    /** Where a period that ends at `from` ends once the reward is added. */
    extend: (from: Date) => Date;
}

export interface GrantedReferralReward {
    referrerUserId: string;
    /** When the referrer's subscription now ends. */
    expiresAt: Date;
    /** Whether a live subscription was lengthened, rather than one created. */
    extended: boolean;
    /** Who bills the subscription that was lengthened — `none` for one we created. */
    store: PurchaseStore;
}

/** A transaction a store has confirmed — what `PurchasesService.verify` hands back. */
export interface VerifiedReceipt {
    store: PurchaseStore;
    transactionId: string;
    productId: string;
    startedAt: Date;
    expiresAt: Date;
    isTrial: boolean;
}

/**
 * What a receipt did. Every kind but `used-elsewhere` means the transaction is
 * recorded in `store_transactions` — `unknown-product` included, because the
 * customer was charged for it whether or not we sell it.
 */
export type ReceiptOutcome =
    /** The receipt opened the account's live subscription — its first, or one replacing what it had. */
    | { kind: 'opened'; subscription: SubscriptionEntity }
    /** Recorded; the subscription the account already had ends later and still stands. */
    | { kind: 'recorded'; subscription: SubscriptionEntity }
    /** This account submitted the receipt before: its live subscription, else the one the receipt opened. */
    | { kind: 'replayed'; subscription: SubscriptionEntity | null }
    /** Another account submitted the receipt first. Nothing is written. */
    | { kind: 'used-elsewhere' }
    /** Recorded, but the product matches no plan, on sale or not. */
    | { kind: 'unknown-product' };

/** The free month a referral code gives, as the service has shaped it. */
export interface ReferralRedemption {
    redeemerUserId: string;
    referrerUserId: string;
    code: string;
    plan: { id: string; priceCents: number; currency: string };
    startedAt: Date;
    expiresAt: Date;
}

export type RedemptionOutcome =
    | { kind: 'granted'; subscription: SubscriptionEntity }
    | { kind: 'already-redeemed' }
    | { kind: 'already-subscribed' };

/** Thrown inside a transaction to undo what it wrote and still answer with a refusal rather than an error. */
class LiveSubscriptionFound extends Error {}

/**
 * Whether a redemption has **converted**: the person who redeemed has since
 * paid for a period of their own.
 *
 * The one definition, used both to count (`referralStats`) and to decide a
 * reward (`grantReferralReward`), so the number on the referral screen cannot
 * describe a different set of people from the ones who earned somebody a month.
 *
 * - **A purchase, not any subscription.** The free month the code itself gives
 *   is a subscription; counting it would pay the referrer for every sign-up,
 *   and sign-ups cost nothing to make. A trial charges nothing either.
 * - **Started after the redemption.** A purchase made before the code was used
 *   was not the code's doing — somebody who had paid, lapsed, and then took a
 *   friend's free month was already a customer.
 */
function convertedRedemption(): SQL {
    return sql`exists (
        select 1 from ${subscriptions}
        where ${subscriptions.userId} = ${referralRedemptions.redeemerUserId}
          and ${subscriptions.source} = ${SubscriptionSource.Purchase}
          and ${subscriptions.startedAt} >= ${referralRedemptions.redeemedAt}
    )`;
}

/**
 * Queues this transaction behind every other write to the same account's
 * subscriptions, until it commits or rolls back.
 *
 * **Every write to an account's subscriptions takes it first**: a purchase, a
 * code redemption, and a referral reward landing on that account. They read
 * the live row and decide what to write from it, so two of them running at
 * once would both decide from the same row — and the loser of the
 * one-active-per-account index would surface as a 500 in the middle of a
 * purchase. The index stays as the backstop for anything that forgets.
 *
 * An advisory lock rather than `SELECT … FROM users FOR UPDATE`: a row lock on
 * `users` would also block every insert that references the account (a
 * foreign-key check takes `FOR KEY SHARE`, which `FOR UPDATE` conflicts with)
 * and every auth write to that row, and it would tie this queue to whatever
 * auth decides to lock. The key is the account's id hashed into a namespace of
 * its own; two accounts that happen to hash alike only wait for each other,
 * never corrupt each other. Transaction-scoped, so nothing can leak past a
 * commit, a rollback or a dropped connection.
 *
 * Under READ COMMITTED every statement after this one reads a fresh snapshot,
 * so whoever waited here sees everything the previous holder committed.
 */
async function lockAccount(tx: Tx, userId: string): Promise<void> {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('subscription-account'), hashtext(${userId}::text))`);
}

/**
 * Moves the account's rows whose period has run out from «active» to
 * «expired», inside the caller's transaction.
 *
 * Swept at the moment it matters rather than by the nightly job alone: without
 * it the partial unique index — one active row per account — would hold a
 * lapsed subscription open and refuse the write meant to replace it.
 */
async function sweepLapsed(tx: Tx, userId: string): Promise<void> {
    await tx
        .update(subscriptions)
        .set({ status: SubscriptionStatus.Expired })
        .where(
            and(
                eq(subscriptions.userId, userId),
                eq(subscriptions.status, SubscriptionStatus.Active),
                sql`${subscriptions.expiresAt} <= now()`,
            ),
        );
}

function liveSubscriptionOf(userId: string): SQL | undefined {
    return and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, SubscriptionStatus.Active),
        sql`${subscriptions.expiresAt} > now()`,
    );
}

/** The later of two instants. */
function later(a: Date, b: Date): Date {
    return a.getTime() >= b.getTime() ? a : b;
}

@Injectable()
export class SubscriptionRepository extends BaseRepository {
    async findPlans(language: string): Promise<SubscriptionPlanEntity[]> {
        const preferred = alias(subscriptionPlanTranslations, 'preferred_plan_name');
        const fallback = alias(subscriptionPlanTranslations, 'fallback_plan_name');
        const name = sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${subscriptionPlans.slug})`;

        const rows = await this.db
            .select({ plan: subscriptionPlans, name })
            .from(subscriptionPlans)
            .leftJoin(preferred, and(eq(preferred.planId, subscriptionPlans.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.planId, subscriptionPlans.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(eq(subscriptionPlans.isActive, true))
            .orderBy(asc(subscriptionPlans.sortOrder));

        return rows.map(row => SubscriptionPlanEntity.from({ ...row.plan, name: row.name }));
    }

    async findPlanBySlug(slug: string, language: string): Promise<SubscriptionPlanEntity | null> {
        const plans = await this.findPlans(language);
        return plans.find(plan => plan.slug === slug) ?? null;
    }

    /** What the subscription unlocks — the same list on the paywall and the receipt (FR-003). */
    async findFeatures(language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(planFeatureTranslations, 'preferred_feature_title');
        const fallback = alias(planFeatureTranslations, 'fallback_feature_title');

        const rows = await this.db
            .select({
                id: planFeatures.id,
                slug: planFeatures.slug,
                emoji: planFeatures.emoji,
                sortOrder: planFeatures.sortOrder,
                name: sql<string>`coalesce(${preferred.title}, ${fallback.title}, ${planFeatures.slug})`,
            })
            .from(planFeatures)
            .leftJoin(preferred, and(eq(preferred.featureId, planFeatures.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.featureId, planFeatures.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .orderBy(asc(planFeatures.sortOrder));

        return rows.map(ReferenceEntity.from);
    }

    /**
     * The live subscription, if there is one.
     *
     * A row whose period has run out is reported as expired here rather than
     * by a nightly job: the truth is the date, and a status column that has
     * not been swept yet must not be able to hand somebody a subscription
     * they no longer have.
     */
    async findActive(userId: string, language: string): Promise<SubscriptionEntity | null> {
        return this.readSubscription(this.db, liveSubscriptionOf(userId), language);
    }

    /**
     * Active subscriptions whose date has already passed, across all accounts.
     *
     * The purchase and redemption transactions sweep the one account they
     * write to. That is enough to keep the unique index honest, and not enough
     * to tell anybody their premium ended — which is what this is for.
     */
    async findLapsed(now: Date): Promise<{ id: string; userId: string; expiresAt: Date }[]> {
        return this.db
            .select({
                id: subscriptions.id,
                userId: subscriptions.userId,
                expiresAt: subscriptions.expiresAt,
            })
            .from(subscriptions)
            .where(and(eq(subscriptions.status, SubscriptionStatus.Active), lte(subscriptions.expiresAt, now)));
    }

    /** Active subscriptions running out inside the window — the warning, before the fact. */
    async findExpiringBetween(from: Date, to: Date): Promise<{ id: string; userId: string; expiresAt: Date }[]> {
        return this.db
            .select({
                id: subscriptions.id,
                userId: subscriptions.userId,
                expiresAt: subscriptions.expiresAt,
            })
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.status, SubscriptionStatus.Active),
                    gt(subscriptions.expiresAt, from),
                    lte(subscriptions.expiresAt, to),
                ),
            );
    }

    /**
     * Marks named rows expired and returns the ids **this call** changed.
     *
     * The job read its list a moment earlier, and in that moment a row can
     * stop qualifying: the owner's own purchase sweeps it (`expireLapsed`), an
     * overlapping run of the job gets there first, or a referral reward
     * lengthens it. The conditional `WHERE` re-checks both halves of «lapsed»
     * — still active, still past `now` — on the row as it is when locked, and
     * `RETURNING` reports only what matched. The caller tells exactly those
     * owners, so nobody hears «expired» about a row somebody else already
     * handled or that is no longer over.
     *
     * Needs no account lock: it is one conditional statement that only ever
     * moves a row out of «active», so it cannot collide with the one-active
     * index.
     */
    async markExpired(ids: string[], now: Date): Promise<string[]> {
        if (ids.length === 0) return [];

        const updated = await this.db
            .update(subscriptions)
            .set({ status: SubscriptionStatus.Expired })
            .where(
                and(
                    inArray(subscriptions.id, ids),
                    eq(subscriptions.status, SubscriptionStatus.Active),
                    lte(subscriptions.expiresAt, now),
                ),
            )
            .returning({ id: subscriptions.id });

        return updated.map(row => row.id);
    }

    /**
     * Records a verified receipt and decides what it does to the account's
     * subscription — one transaction, under the account lock.
     *
     * **Ownership is decided by the insert, not by a lookup.** The transaction
     * goes into `store_transactions` with `ON CONFLICT (store, transaction_id)
     * DO NOTHING RETURNING`. No row back means somebody recorded it first; the
     * owner is re-read from the ledger:
     *
     * - the same account — the client retrying, or the StoreKit listener and
     *   the explicit submit arriving together. Not an error: the answer is the
     *   subscription it already got. (The account lock queues this behind the
     *   first request, so the answer is the committed result, never a guess.)
     * - another account — `used-elsewhere`. Its insert waited for ours to
     *   commit rather than failing with a unique violation.
     *
     * **Every verified transaction is recorded**, including the ones that
     * change nothing: the customer was charged either way.
     *
     * **Which row is live** when the account already has one:
     *
     * - The receipt replaces it when it ends later than both now and the part
     *   of the current row a store actually billed for. A renewal, an upgrade,
     *   a trial converting, or any purchase over a free month we granted all
     *   do; an older transaction replayed from purchase history does not, and
     *   neither does a renewal a reward already covers — it is recorded and the
     *   current row stands. A receipt never shortens anybody's access.
     * - Replacing carries over whatever the current row had **beyond** what a
     *   store billed — the rest of a free referral month, or a reward month
     *   added onto a paid row — so buying never costs time we gave away, and
     *   «earned months, then bought» ends where «bought, then earned» does.
     *   Time a store billed is the store's to replace: on an upgrade it refunds
     *   the old period itself.
     * - The replaced row closes now: `expired`, its end moved back to now.
     */
    async redeemReceipt(userId: string, receipt: VerifiedReceipt, language: string): Promise<ReceiptOutcome> {
        return this.db.transaction(async (tx): Promise<ReceiptOutcome> => {
            await lockAccount(tx, userId);

            const productColumn =
                receipt.store === PurchaseStore.Google
                    ? subscriptionPlans.googleProductId
                    : subscriptionPlans.appleProductId;

            // Any plan with this product id, on sale or not: a plan taken off
            // sale still has subscribers, and their renewals are still paid.
            const [plan] = await tx
                .select({
                    id: subscriptionPlans.id,
                    priceCents: subscriptionPlans.priceCents,
                    fullPriceCents: subscriptionPlans.fullPriceCents,
                    currency: subscriptionPlans.currency,
                })
                .from(subscriptionPlans)
                .where(eq(productColumn, receipt.productId))
                .orderBy(desc(subscriptionPlans.isActive), asc(subscriptionPlans.sortOrder))
                .limit(1);

            const pricePaidCents = plan ? (receipt.isTrial ? 0 : plan.priceCents) : null;

            const ledgerRow = {
                store: receipt.store,
                transactionId: receipt.transactionId,
                userId,
                productId: receipt.productId,
                planId: plan?.id ?? null,
                isTrial: receipt.isTrial,
                priceCents: pricePaidCents,
                currency: plan?.currency ?? null,
                startedAt: receipt.startedAt,
                expiresAt: receipt.expiresAt,
            };

            // A subscription row already carrying this transaction. For
            // receipts recorded since the ledger existed this repeats what the
            // ledger says; for ones recorded before it, it is the only record,
            // and the ledger row is written now, linked to it.
            const [holder] = await tx
                .select({ id: subscriptions.id, userId: subscriptions.userId })
                .from(subscriptions)
                .where(eq(subscriptions.storeTransactionId, receipt.transactionId));

            if (holder) {
                if (holder.userId !== userId) return { kind: 'used-elsewhere' };

                await tx
                    .insert(storeTransactions)
                    .values({ ...ledgerRow, subscriptionId: holder.id })
                    .onConflictDoNothing({ target: [storeTransactions.store, storeTransactions.transactionId] });

                return { kind: 'replayed', subscription: await this.replayAnswer(tx, userId, holder.id, language) };
            }

            const [recorded] = await tx
                .insert(storeTransactions)
                .values(ledgerRow)
                .onConflictDoNothing({ target: [storeTransactions.store, storeTransactions.transactionId] })
                .returning({ id: storeTransactions.id });

            if (!recorded) {
                const [owner] = await tx
                    .select({
                        userId: storeTransactions.userId,
                        planId: storeTransactions.planId,
                        subscriptionId: storeTransactions.subscriptionId,
                    })
                    .from(storeTransactions)
                    .where(
                        and(
                            eq(storeTransactions.store, receipt.store),
                            eq(storeTransactions.transactionId, receipt.transactionId),
                        ),
                    );

                if (!owner || owner.userId !== userId) return { kind: 'used-elsewhere' };
                if (owner.planId === null) return { kind: 'unknown-product' };

                return {
                    kind: 'replayed',
                    subscription: await this.replayAnswer(tx, userId, owner.subscriptionId, language),
                };
            }

            // Returned, not thrown: throwing would roll the ledger row back,
            // and the transaction was paid for whether or not we sell it.
            if (!plan) return { kind: 'unknown-product' };

            await sweepLapsed(tx, userId);

            const [current] = await tx
                .select({
                    id: subscriptions.id,
                    expiresAt: subscriptions.expiresAt,
                    store: subscriptions.store,
                    billedUntil: storeTransactions.expiresAt,
                })
                .from(subscriptions)
                .leftJoin(storeTransactions, eq(storeTransactions.subscriptionId, subscriptions.id))
                .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, SubscriptionStatus.Active)));

            const now = new Date();
            let expiresAt = receipt.expiresAt;

            if (current) {
                // How far a store billed the current row: nowhere for a month
                // we granted; the opening transaction's end when the ledger
                // has it; the row's own end for one written before the ledger,
                // which is the reading that never over-grants.
                const billedUntil =
                    current.store === PurchaseStore.None ? null : (current.billedUntil ?? current.expiresAt);
                const threshold = billedUntil ? later(now, billedUntil) : now;

                if (receipt.expiresAt.getTime() <= threshold.getTime()) {
                    const standing = await this.readSubscription(tx, eq(subscriptions.id, current.id), language);
                    if (!standing) throw new Error('The live subscription vanished inside its own lock');

                    return { kind: 'recorded', subscription: standing };
                }

                const unbilled = Math.max(0, current.expiresAt.getTime() - threshold.getTime());
                expiresAt = new Date(receipt.expiresAt.getTime() + unbilled);

                await tx
                    .update(subscriptions)
                    .set({ status: SubscriptionStatus.Expired, expiresAt: now })
                    .where(eq(subscriptions.id, current.id));
            }

            const [opened] = await tx
                .insert(subscriptions)
                .values({
                    userId,
                    planId: plan.id,
                    source: receipt.isTrial ? SubscriptionSource.Trial : SubscriptionSource.Purchase,
                    status: SubscriptionStatus.Active,
                    startedAt: receipt.startedAt,
                    expiresAt,
                    // A trial charges nothing now; the price is what the plan
                    // will cost when it converts, and the receipt is the
                    // record of that.
                    pricePaidCents: pricePaidCents ?? 0,
                    fullPriceCents: plan.fullPriceCents,
                    currency: plan.currency,
                    store: receipt.store,
                    storeTransactionId: receipt.transactionId,
                })
                .returning({ id: subscriptions.id });

            if (!opened) throw new Error('Failed to insert subscription');

            await tx
                .update(storeTransactions)
                .set({ subscriptionId: opened.id })
                .where(eq(storeTransactions.id, recorded.id));

            // Read back by id, not through the live filter: a receipt whose
            // period has already ended — a lapsed subscription being restored —
            // opens a row that filter deliberately hides.
            const subscription = await this.readSubscription(tx, eq(subscriptions.id, opened.id), language);
            if (!subscription) throw new Error('Failed to read back the subscription just written');

            return { kind: 'opened', subscription };
        });
    }

    /**
     * Spends a referral code: the redemption and the free month, both or
     * neither — one transaction, under the account lock.
     *
     * **The redemption goes in first**, with `ON CONFLICT (redeemer_user_id)
     * DO NOTHING RETURNING`: the primary key is the rule «one code per
     * account, ever», and no row back means this account already spent one.
     * Then the sweep, the check for a live subscription, and the month. A
     * failure anywhere after the redemption — a live subscription found, the
     * insert failing — rolls the redemption back with it, so no account is ever
     * left with a month and no redemption (which would also let it spend a
     * second code), or a redemption and no month.
     *
     * The live-subscription check is a read, but not one that can be raced:
     * every writer of this account's subscriptions waits on the same lock, and
     * the one-active index stands behind it.
     */
    async redeemReferralCode(redemption: ReferralRedemption, language: string): Promise<RedemptionOutcome> {
        const { redeemerUserId, referrerUserId, code, plan } = redemption;

        try {
            return await this.db.transaction(async (tx): Promise<RedemptionOutcome> => {
                await lockAccount(tx, redeemerUserId);

                const [redeemed] = await tx
                    .insert(referralRedemptions)
                    .values({ redeemerUserId, referrerUserId, code })
                    .onConflictDoNothing({ target: referralRedemptions.redeemerUserId })
                    .returning({ redeemerUserId: referralRedemptions.redeemerUserId });

                if (!redeemed) return { kind: 'already-redeemed' };

                await sweepLapsed(tx, redeemerUserId);

                const [live] = await tx
                    .select({ id: subscriptions.id })
                    .from(subscriptions)
                    .where(
                        and(
                            eq(subscriptions.userId, redeemerUserId),
                            eq(subscriptions.status, SubscriptionStatus.Active),
                        ),
                    );

                if (live) throw new LiveSubscriptionFound();

                const [granted] = await tx
                    .insert(subscriptions)
                    .values({
                        userId: redeemerUserId,
                        planId: plan.id,
                        source: SubscriptionSource.Referral,
                        status: SubscriptionStatus.Active,
                        startedAt: redemption.startedAt,
                        expiresAt: redemption.expiresAt,
                        pricePaidCents: 0,
                        fullPriceCents: plan.priceCents,
                        currency: plan.currency,
                        referralCode: code,
                        store: PurchaseStore.None,
                    })
                    .returning({ id: subscriptions.id });

                if (!granted) throw new Error('Failed to insert subscription');

                const subscription = await this.readSubscription(tx, eq(subscriptions.id, granted.id), language);
                if (!subscription) throw new Error('Failed to read back the subscription just written');

                return { kind: 'granted', subscription };
            });
        } catch (error) {
            if (error instanceof LiveSubscriptionFound) return { kind: 'already-subscribed' };
            throw error;
        }
    }

    async findReferralCode(userId: string): Promise<string | null> {
        const row = await this.db.query.referralCodes.findFirst({ where: eq(referralCodes.userId, userId) });
        return row?.code ?? null;
    }

    /**
     * The account behind a code.
     *
     * Codes are compared already normalised — the caller upper-cases and trims
     * before asking, so « abc123 » and «ABC123» are the same code (paywall
     * edge case).
     */
    async findCodeOwner(code: string): Promise<string | null> {
        const row = await this.db.query.referralCodes.findFirst({ where: eq(referralCodes.code, code) });
        return row?.userId ?? null;
    }

    async createReferralCode(userId: string, code: string): Promise<void> {
        await this.db.insert(referralCodes).values({ userId, code }).onConflictDoNothing();
    }

    /**
     * Whether this account has spent a code. A courtesy for describing a code
     * before it is spent — the rule itself is the primary key that
     * `redeemReferralCode` inserts against.
     */
    async hasRedeemed(userId: string): Promise<boolean> {
        const row = await this.db.query.referralRedemptions.findFirst({
            where: eq(referralRedemptions.redeemerUserId, userId),
        });

        return row !== undefined;
    }

    /**
     * How this account's code has done (referral FR-004).
     *
     * One row per redemption, counted by predicate — not a join against
     * `subscriptions`. The join this replaced counted subscription **rows**:
     * it included the free month the code itself grants, so every redemption
     * was «converted» on the spot, and somebody who later bought as well was
     * counted twice.
     */
    async referralStats(userId: string): Promise<ReferralStats> {
        const [row] = await this.db
            .select({
                invited: sql<number>`count(*)::int`,
                converted: sql<number>`(count(*) filter (where ${convertedRedemption()}))::int`,
                rewarded: sql<number>`count(${referralRedemptions.rewardedAt})::int`,
            })
            .from(referralRedemptions)
            .where(eq(referralRedemptions.referrerUserId, userId));

        return { invited: row?.invited ?? 0, converted: row?.converted ?? 0, rewarded: row?.rewarded ?? 0 };
    }

    /**
     * Gives the referrer their month for this redeemer's first purchase —
     * once, and all of it or none of it (referral FR-006).
     *
     * Returns null when there is nothing to grant: the buyer was not invited,
     * has not converted, or the month was granted already. That last case is
     * the ordinary one on a retried receipt and is not an error.
     *
     * **The claim is the idempotency.** `rewarded_at` goes from null to a date
     * in a conditional update, on a row the primary key makes unique per
     * redeemer; a second caller — a replayed receipt, a concurrent retry —
     * waits on the row lock, re-reads it, finds the date and matches nothing.
     * There is no read-then-write in the service to race.
     *
     * **The referrer's account lock comes first**, the same one their own
     * purchase and code redemption take. Two friends converting at once would
     * otherwise both read the same end date and lose a month, and a reward
     * racing the referrer's own purchase would have both insert a live row and
     * one fail on the one-active index. Taken before the claim, so every
     * transaction here locks in the same order — account, then rows.
     *
     * **One transaction** for the claim and the grant: a failure anywhere rolls
     * the claim back with it, so the reward is either granted and recorded or
     * still waiting to be — never recorded and not granted.
     *
     * Lengthening a subscription a store bills moves only our date, not the
     * store's — see the referral plan for what that means at renewal.
     */
    async grantReferralReward(
        redeemerUserId: string,
        terms: ReferralRewardTerms,
    ): Promise<GrantedReferralReward | null> {
        return this.db.transaction(async tx => {
            // Who to lock for. Read before the claim because the lock has to
            // come first; safe to read unlocked because a redemption's
            // referrer is written once and never changes.
            const [invitation] = await tx
                .select({ referrerUserId: referralRedemptions.referrerUserId })
                .from(referralRedemptions)
                .where(eq(referralRedemptions.redeemerUserId, redeemerUserId));

            if (!invitation) return null;

            await lockAccount(tx, invitation.referrerUserId);

            const [claimed] = await tx
                .update(referralRedemptions)
                .set({ rewardedAt: sql`now()` })
                .where(
                    and(
                        eq(referralRedemptions.redeemerUserId, redeemerUserId),
                        isNull(referralRedemptions.rewardedAt),
                        convertedRedemption(),
                    ),
                )
                .returning({ referrerUserId: referralRedemptions.referrerUserId, code: referralRedemptions.code });

            if (!claimed) return null;

            const { referrerUserId, code } = claimed;

            // Same sweep as a purchase, for the same reason: a lapsed row still
            // marked active would be lengthened from a date in the past, or
            // would block the insert below.
            await sweepLapsed(tx, referrerUserId);

            const [active] = await tx
                .select({ id: subscriptions.id, expiresAt: subscriptions.expiresAt, store: subscriptions.store })
                .from(subscriptions)
                .where(
                    and(eq(subscriptions.userId, referrerUserId), eq(subscriptions.status, SubscriptionStatus.Active)),
                );

            if (active) {
                const expiresAt = terms.extend(active.expiresAt);

                await tx.update(subscriptions).set({ expiresAt }).where(eq(subscriptions.id, active.id));

                return { referrerUserId, expiresAt, extended: true, store: active.store };
            }

            const [plan] = await tx
                .select({
                    id: subscriptionPlans.id,
                    priceCents: subscriptionPlans.priceCents,
                    currency: subscriptionPlans.currency,
                })
                .from(subscriptionPlans)
                .where(and(eq(subscriptionPlans.slug, terms.planSlug), eq(subscriptionPlans.isActive, true)));

            // Thrown rather than skipped: returning here would commit the claim
            // with nothing granted, which is the one outcome this method exists
            // to rule out.
            if (!plan) throw new Error(`The referral reward plan «${terms.planSlug}» is not on sale`);

            const startedAt = new Date();
            const expiresAt = terms.extend(startedAt);

            // The same row `redeemReferralCode` writes for the person who used
            // the code: the monthly plan, nothing paid, no store.
            await tx.insert(subscriptions).values({
                userId: referrerUserId,
                planId: plan.id,
                source: SubscriptionSource.Referral,
                status: SubscriptionStatus.Active,
                startedAt,
                expiresAt,
                pricePaidCents: 0,
                fullPriceCents: plan.priceCents,
                currency: plan.currency,
                referralCode: code,
                store: PurchaseStore.None,
            });

            return { referrerUserId, expiresAt, extended: false, store: PurchaseStore.None };
        });
    }

    /**
     * What a receipt submitted again answers with: the account's live
     * subscription, or failing that the one this receipt opened (a lapsed
     * period being restored opens a row the live filter hides).
     *
     * The live one first because it is what the account has now. At the
     * moment of a concurrent retry the two are the same row; a receipt
     * redelivered long after an upgrade should not answer with the plan the
     * upgrade replaced.
     */
    private async replayAnswer(
        tx: Tx,
        userId: string,
        openedId: string | null,
        language: string,
    ): Promise<SubscriptionEntity | null> {
        const live = await this.readSubscription(tx, liveSubscriptionOf(userId), language);
        if (live || !openedId) return live;

        return this.readSubscription(tx, eq(subscriptions.id, openedId), language);
    }

    /** One subscription with its plan's name in the reader's language — through whichever connection is asking. */
    private async readSubscription(
        db: Reader,
        where: SQL | undefined,
        language: string,
    ): Promise<SubscriptionEntity | null> {
        const preferred = alias(subscriptionPlanTranslations, 'preferred_plan_name');
        const fallback = alias(subscriptionPlanTranslations, 'fallback_plan_name');

        const [row] = await db
            .select({
                subscription: subscriptions,
                planSlug: subscriptionPlans.slug,
                planPeriod: subscriptionPlans.period,
                planName: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${subscriptionPlans.slug})`,
            })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
            .leftJoin(preferred, and(eq(preferred.planId, subscriptionPlans.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.planId, subscriptionPlans.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(where)
            .limit(1);

        if (!row) return null;

        return SubscriptionEntity.from({ ...row.subscription, ...row });
    }
}
