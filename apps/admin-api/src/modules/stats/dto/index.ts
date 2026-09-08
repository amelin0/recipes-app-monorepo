import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';

import type { FavoriteRecipeStats, LanguageCount, OverviewStats } from '@dns/database';
import { adminFavoriteStatsQuerySchema, adminOverviewQuerySchema } from '@dns/validation';

export class OverviewQueryDto extends createZodDto(adminOverviewQuerySchema) {}
export class FavoriteStatsQueryDto extends createZodDto(adminFavoriteStatsQuerySchema) {}

class DailyCountView {
    @ApiProperty({ example: '2026-09-01', description: 'A UTC day.' }) readonly date: string;
    @ApiProperty() readonly count: number;

    constructor(date: string, count: number) {
        this.date = date;
        this.count = count;
    }
}

class LanguageCountView {
    @ApiProperty({ nullable: true, description: 'Null for accounts that never got settings.' })
    readonly language: string | null;

    @ApiProperty() readonly count: number;

    constructor(row: LanguageCount) {
        this.language = row.language;
        this.count = row.count;
    }
}

class RegistrationsView {
    @ApiProperty() readonly total: number;

    @ApiProperty({ type: DailyCountView, isArray: true, description: 'Every day of the period, zeros included.' })
    readonly byDate: DailyCountView[];

    @ApiProperty({ type: LanguageCountView, isArray: true })
    readonly byLanguage: LanguageCountView[];

    constructor(stats: OverviewStats['registrations']) {
        this.total = stats.total;
        this.byDate = stats.byDate.map(row => new DailyCountView(row.date, row.count));
        this.byLanguage = stats.byLanguage.map(row => new LanguageCountView(row));
    }
}

class UsersView {
    @ApiProperty() readonly total: number;
    @ApiProperty() readonly blocked: number;
    @ApiProperty() readonly withActiveSubscription: number;

    constructor(stats: OverviewStats['users']) {
        this.total = stats.total;
        this.blocked = stats.blocked;
        this.withActiveSubscription = stats.withActiveSubscription;
    }
}

class CatalogueView {
    @ApiProperty() readonly recipes: number;

    @ApiProperty({ description: 'Archived products are excluded, exactly as they are on the products page.' })
    readonly products: number;

    @ApiProperty() readonly unverifiedCustomProducts: number;

    constructor(stats: OverviewStats['catalogue']) {
        this.recipes = stats.recipes;
        this.products = stats.products;
        this.unverifiedCustomProducts = stats.unverifiedCustomProducts;
    }
}

class QueuesView {
    @ApiProperty({ description: 'Tickets nobody has touched.' }) readonly newTickets: number;

    @ApiProperty({ description: 'Deletion requests past their date — nothing executes them yet (ADR-0005).' })
    readonly overdueDeletions: number;

    constructor(stats: OverviewStats['queues']) {
        this.newTickets = stats.newTickets;
        this.overdueDeletions = stats.overdueDeletions;
    }
}

/** Everything the home screen shows, in one response — it is one screen. */
export class OverviewView {
    @ApiProperty({ type: RegistrationsView }) readonly registrations: RegistrationsView;
    @ApiProperty({ type: UsersView }) readonly users: UsersView;
    @ApiProperty({ type: CatalogueView }) readonly catalogue: CatalogueView;
    @ApiProperty({ type: QueuesView }) readonly queues: QueuesView;

    private constructor(stats: OverviewStats) {
        this.registrations = new RegistrationsView(stats.registrations);
        this.users = new UsersView(stats.users);
        this.catalogue = new CatalogueView(stats.catalogue);
        this.queues = new QueuesView(stats.queues);
    }

    static from(stats: OverviewStats): OverviewView {
        return new OverviewView(stats);
    }
}

/**
 * How often a dish is kept, and in which languages.
 *
 * There is no list of people here, and that is the point (FR-011): what
 * someone saves is personal, and the editor's question is «what works», not
 * «who liked it».
 */
export class FavoriteRecipeView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;
    @ApiProperty() readonly name: string;
    @ApiProperty({ nullable: true }) readonly photoUrl: string | null;
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly favorites: number;

    @ApiProperty({ type: LanguageCountView, isArray: true })
    readonly byLanguage: LanguageCountView[];

    private constructor(row: FavoriteRecipeStats) {
        this.id = row.id;
        this.name = row.name;
        this.photoUrl = row.photoUrl;
        this.calories = row.calories;
        this.favorites = row.favorites;
        this.byLanguage = row.byLanguage.map(entry => new LanguageCountView(entry));
    }

    static from(row: FavoriteRecipeStats): FavoriteRecipeView {
        return new FavoriteRecipeView(row);
    }
}
