import { Injectable } from '@nestjs/common';

import { StorageService } from '@dns/api-infrastructure/storage';
import { FeedbackEntity, FeedbackRepository } from '@dns/database';
import { StorageScope } from '@dns/shared-types';
import { CreateFeedbackInput } from '@dns/validation';

@Injectable()
export class FeedbackService {
    constructor(
        private readonly feedbackRepository: FeedbackRepository,
        private readonly storageService: StorageService,
    ) {}

    // `async` so a rejected ownership check arrives as a rejected promise
    // rather than a synchronous throw from a method typed `Promise<T>` —
    // Nest catches both, but every other caller has to handle one shape.
    async create(userId: string, input: CreateFeedbackInput): Promise<FeedbackEntity> {
        // Every attachment must be a file this user uploaded for this purpose.
        // Without the check a ticket could carry any URL, and staff opening it
        // would fetch whatever the reporter pointed them at — or, for a grant
        // whose upload never happened, nothing at all.
        await Promise.all(
            (input.imageUrls ?? []).map(url => this.storageService.validateUpload(url, userId, StorageScope.Feedback)),
        );

        return this.feedbackRepository.create({
            userId,
            type: input.type,
            description: input.description,
            imageUrls: input.imageUrls ?? [],
            replyEmail: input.replyEmail ?? null,
            context: input.context ?? null,
        });
    }
}
