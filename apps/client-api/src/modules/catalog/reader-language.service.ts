import { Injectable } from '@nestjs/common';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { UserSettingsRepository } from '@dns/database';

/**
 * Which language the catalogue answers this reader in.
 *
 * It is a user setting, so it is read from the settings row rather than from a
 * header: someone who set the app to Polish expects Polish product names on
 * every device, including one whose OS is in English.
 */
@Injectable()
export class ReaderLanguageService {
    constructor(private readonly settings: UserSettingsRepository) {}

    async of(userId: string): Promise<string> {
        const settings = await this.settings.findByUserId(userId);
        return settings?.language ?? DEFAULT_LANGUAGE;
    }
}
