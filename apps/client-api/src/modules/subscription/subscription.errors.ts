export const SubscriptionErrorCode = {
    /** The receipt already bought a subscription for a different account. */
    ReceiptAlreadyUsed: 'subscription.receipt-already-used',
    /** The store's product id matches no plan this server sells. */
    UnknownProduct: 'subscription.unknown-product',
    UnknownReferralCode: 'subscription.unknown-referral-code',
    OwnReferralCode: 'subscription.own-referral-code',
    AlreadyRedeemed: 'subscription.already-redeemed',
    AlreadySubscribed: 'subscription.already-subscribed',
} as const;
