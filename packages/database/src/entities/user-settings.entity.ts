import { Language, MetricSystem, Theme } from '@dns/shared-types';

import { userSettings } from '../schema';

type UserSettingsRow = typeof userSettings.$inferSelect;

export class UserSettingsEntity {
    readonly userId: string;
    readonly language: Language;
    readonly theme: Theme;
    readonly massUnit: MetricSystem;
    readonly productWeightUnit: MetricSystem;
    readonly lengthUnit: MetricSystem;
    readonly waterUnit: MetricSystem;
    readonly updatedAt: Date;

    private constructor(row: UserSettingsRow) {
        this.userId = row.userId;
        this.language = row.language as Language;
        this.theme = row.theme as Theme;
        this.massUnit = row.massUnit as MetricSystem;
        this.productWeightUnit = row.productWeightUnit as MetricSystem;
        this.lengthUnit = row.lengthUnit as MetricSystem;
        this.waterUnit = row.waterUnit as MetricSystem;
        this.updatedAt = row.updatedAt;
    }

    static from(row: UserSettingsRow): UserSettingsEntity {
        return new UserSettingsEntity(row);
    }
}
