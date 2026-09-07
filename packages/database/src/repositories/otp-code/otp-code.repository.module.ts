import { Module } from '@nestjs/common';

import { OtpCodeRepository } from './otp-code.repository';

@Module({
    providers: [OtpCodeRepository],
    exports: [OtpCodeRepository],
})
export class OtpCodeRepositoryModule {}
