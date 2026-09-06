import { Module } from '@nestjs/common';

import { ProfileRepositoryModule, UserSettingsRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';

import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
    imports: [AuthModule, ProfileRepositoryModule, UserSettingsRepositoryModule],
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class UserModule {}
