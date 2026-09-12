import { Module } from '@nestjs/common';

import { NotificationsProducerModule } from '@dns/api-common';
import {
    AccountDeletionRequestRepositoryModule,
    FeedbackRepositoryModule,
    NutritionRepositoryModule,
    ProfileRepositoryModule,
    SubscriptionRepositoryModule,
    UserReminderRepositoryModule,
    UserSettingsRepositoryModule,
} from '@dns/database';

import { AuthModule } from '../auth';

import { AccountDeletionController } from './account-deletion.controller';
import { AccountDeletionService } from './account-deletion.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
    imports: [
        AuthModule,
        ProfileRepositoryModule,
        UserSettingsRepositoryModule,
        UserReminderRepositoryModule,
        AccountDeletionRequestRepositoryModule,
        FeedbackRepositoryModule,
        NutritionRepositoryModule,
        SubscriptionRepositoryModule,
        NotificationsProducerModule,
    ],
    controllers: [
        ProfileController,
        OnboardingController,
        RemindersController,
        AccountDeletionController,
        FeedbackController,
    ],
    providers: [ProfileService, OnboardingService, RemindersService, AccountDeletionService, FeedbackService],
})
export class UserModule {}
