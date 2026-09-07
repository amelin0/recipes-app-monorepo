import { PurchaseStore } from '@dns/shared-types';

export interface PurchasesConfig {
    apple: { bundleId: string; issuerId: string; keyId: string; privateKey: string };
    google: { packageName: string; serviceAccountJson: string };
    /**
     * Accept any receipt and believe what it says.
     *
     * On when the store credentials are absent, which is every developer
     * machine and every test. It is the same arrangement as the stub email
     * client: the flow runs end to end locally, and the one step that needs
     * somebody else's servers is the one that is replaced.
     */
    allowUnverified: boolean;
}

/** What a store tells us once it has confirmed a purchase is real. */
export interface VerifiedPurchase {
    store: PurchaseStore;
    /** Unique per purchase; what stops one receipt from buying two subscriptions. */
    transactionId: string;
    /** The store's own product id — matched against a plan's `appleProductId` / `googleProductId`. */
    productId: string;
    startedAt: Date;
    expiresAt: Date;
    /** True while the store is giving the period away as an introductory offer. */
    isTrial: boolean;
}

export interface ReceiptToVerify {
    store: PurchaseStore;
    /** Whatever the store SDK handed the app — a JWS on Apple, a purchase token on Google. */
    receipt: string;
    /** Google needs to be told which product the token belongs to; Apple carries it inside. */
    productId?: string;
}
