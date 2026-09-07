import { ApiProperty } from '@nestjs/swagger';

import { UserSettingsEntity } from '@dns/database';
import { Language, MetricSystem, Theme } from '@dns/shared-types';

export class UserSettingsView {
    @ApiProperty({ enum: Language })
    readonly language: Language;

    @ApiProperty({ enum: Theme })
    readonly theme: Theme;

    @ApiProperty({ enum: MetricSystem, description: 'Body mass.' })
    readonly massUnit: MetricSystem;

    @ApiProperty({ enum: MetricSystem, description: 'Ingredient and product weight.' })
    readonly productWeightUnit: MetricSystem;

    @ApiProperty({ enum: MetricSystem, description: 'Height and body measurements.' })
    readonly lengthUnit: MetricSystem;

    @ApiProperty({ enum: MetricSystem, description: 'Water intake.' })
    readonly waterUnit: MetricSystem;

    private constructor(settings: UserSettingsEntity) {
        this.language = settings.language;
        this.theme = settings.theme;
        this.massUnit = settings.massUnit;
        this.productWeightUnit = settings.productWeightUnit;
        this.lengthUnit = settings.lengthUnit;
        this.waterUnit = settings.waterUnit;
    }

    static from(settings: UserSettingsEntity): UserSettingsView {
        return new UserSettingsView(settings);
    }
}
