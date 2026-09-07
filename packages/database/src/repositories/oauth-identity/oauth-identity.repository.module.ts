import { Module } from '@nestjs/common';

import { OAuthIdentityRepository } from './oauth-identity.repository';

@Module({
    providers: [OAuthIdentityRepository],
    exports: [OAuthIdentityRepository],
})
export class OAuthIdentityRepositoryModule {}
