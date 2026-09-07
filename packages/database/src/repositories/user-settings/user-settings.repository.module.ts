import { Module } from '@nestjs/common';

import { UserSettingsRepository } from './user-settings.repository';

@Module({
    providers: [UserSettingsRepository],
    exports: [UserSettingsRepository],
})
export class UserSettingsRepositoryModule {}
