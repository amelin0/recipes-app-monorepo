import { Inject, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

import { PurchaseStore } from '@dns/shared-types';

import { PURCHASES_CONFIG } from './purchases.tokens';
import { PurchasesConfig, ReceiptToVerify, VerifiedPurchase } from './purchases.types';

/**
 * Turns a receipt from a store into something we are willing to believe.
 *
 * **Verification against Apple and Google is not implemented.** It needs an
 * App Store Connect key and a Google service account, neither of which exists
 * yet, and code written against them could not be run — so rather than ship
 * an unexercised integration, the seam is here and the two branches throw.
 * Everything downstream of verification is real and covered by tests, exactly
 * as with `OAuthService` in the auth domain.
 *
 * With `allowUnverified` the receipt is taken at face value, which is what
 * makes the whole purchase flow runnable on a laptop.
 */
@Injectable()
export class PurchasesService {
    private readonly logger = new Logger(PurchasesService.name);

    constructor(@Inject(PURCHASES_CONFIG) private readonly cfg: PurchasesConfig) {}

    async verify(receipt: ReceiptToVerify): Promise<VerifiedPurchase> {
        if (this.cfg.allowUnverified) {
            return this.trust(receipt);
        }

        throw new ServiceUnavailableException(
            `Receipt verification for ${receipt.store} is not configured on this server`,
        );
    }

    /**
     * The development path: the receipt is a JSON blob the client made up, and
     * we believe it.
     *
     * It is deliberately noisy in the log — a server accepting invented
     * receipts is a thing somebody should notice if it ever reaches an
     * environment where it should not be.
     */
    private trust(receipt: ReceiptToVerify): Promise<VerifiedPurchase> {
        this.logger.warn(`Accepting an unverified ${receipt.store} receipt — no store credentials are configured`);

        let payload: Partial<VerifiedPurchase> & { expiresAt?: string | Date; startedAt?: string | Date };

        try {
            payload = JSON.parse(receipt.receipt) as typeof payload;
        } catch {
            throw new UnauthorizedException('Receipt is not readable');
        }

        const productId = receipt.productId ?? payload.productId;
        const transactionId = payload.transactionId;

        if (!productId || !transactionId) {
            throw new UnauthorizedException('Receipt names neither a product nor a transaction');
        }

        const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();
        const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

        if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
            throw new UnauthorizedException('Receipt does not say when the period ends');
        }

        return Promise.resolve({
            store: receipt.store === PurchaseStore.Google ? PurchaseStore.Google : PurchaseStore.Apple,
            transactionId,
            productId,
            startedAt,
            expiresAt,
            isTrial: payload.isTrial === true,
        });
    }
}
