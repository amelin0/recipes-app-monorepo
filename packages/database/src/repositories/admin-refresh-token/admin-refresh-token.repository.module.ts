import { Module } from '@nestjs/common';

import { AdminRefreshTokenRepository } from './admin-refresh-token.repository';

@Module({
    providers: [AdminRefreshTokenRepository],
    exports: [AdminRefreshTokenRepository],
})
export class AdminRefreshTokenRepositoryModule {}
