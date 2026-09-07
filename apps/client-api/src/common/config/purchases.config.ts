import { registerAs } from '@nestjs/config';

import { PurchasesConfig } from './config.type';

/**
 * Without store credentials the server accepts receipts at face value, the
 * same way it logs an email instead of sending one when `RESEND_API_KEY` is
 * absent. That is what lets the purchase flow be walked through on a laptop.
 */
export default registerAs<PurchasesConfig>('purchases', () => {
    const apple = {
        bundleId: process.env.APPLE_BUNDLE_ID ?? '',
        issuerId: process.env.APPLE_ISSUER_ID ?? '',
        keyId: process.env.APPLE_KEY_ID ?? '',
        privateKey: process.env.APPLE_PRIVATE_KEY ?? '',
    };

    const google = {
        packageName: process.env.GOOGLE_PACKAGE_NAME ?? '',
        serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? '',
    };

    return {
        apple,
        google,
        allowUnverified: !apple.privateKey && !google.serviceAccountJson,
    };
});
