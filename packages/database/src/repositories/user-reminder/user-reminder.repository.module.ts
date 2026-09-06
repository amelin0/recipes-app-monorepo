import { Module } from '@nestjs/common';

import { UserReminderRepository } from './user-reminder.repository';

@Module({
    providers: [UserReminderRepository],
    exports: [UserReminderRepository],
})
export class UserReminderRepositoryModule {}
