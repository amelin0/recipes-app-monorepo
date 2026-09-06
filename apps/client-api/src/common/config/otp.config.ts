import { registerAs } from '@nestjs/config';

import { OtpConfig } from './config.type';

export default registerAs<OtpConfig>('otp', () => ({
    devCode: process.env.OTP_DEV_CODE || undefined,
}));
