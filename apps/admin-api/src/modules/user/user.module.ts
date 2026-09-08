import { Module } from '@nestjs/common';

import { AdminUserRepositoryModule, RefreshTokenRepositoryModule } from '@dns/database';

import { AdminUserController } from './user.controller';
import { AdminUserService } from './user.service';

@Module({
    // The client's refresh tokens, because blocking has to revoke them: a
    // session issued a minute earlier would otherwise outlive the block.
    imports: [AdminUserRepositoryModule, RefreshTokenRepositoryModule],
    controllers: [AdminUserController],
    providers: [AdminUserService],
    exports: [AdminUserService],
})
export class UserModule {}
