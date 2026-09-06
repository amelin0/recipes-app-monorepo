import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DailyStepsEntity, MealLogEntryEntity, NutritionGoalEntity, WaterLogEntryEntity } from '../../entities';
import { dailySteps, mealLogEntries, nutritionGoals, waterLogEntries } from '../../schema';
import { BaseRepository } from '../base.repository';

type UpsertGoal = typeof nutritionGoals.$inferInsert;
type InsertMealLogEntry = typeof mealLogEntries.$inferInsert;
type InsertWaterLogEntry = typeof waterLogEntries.$inferInsert;

/** What a day adds up to. Summed on read — there is no stored aggregate to drift. */
export interface DailyTotals {
    calories: number;
    proteinG: number;
    fatsG: number;
    carbsG: number;
    waterMl: number;
}

@Injectable()
export class NutritionRepository extends BaseRepository {
    async findGoal(userId: string): Promise<NutritionGoalEntity | null> {
        const row = await this.db.query.nutritionGoals.findFirst({ where: eq(nutritionGoals.userId, userId) });
        return row ? NutritionGoalEntity.from(row) : null;
    }

    /** Replaces the goal wholesale — the screen saves every field at once. */
    async upsertGoal(data: UpsertGoal): Promise<NutritionGoalEntity> {
        const [row] = await this.db
            .insert(nutritionGoals)
            .values(data)
            .onConflictDoUpdate({
                target: nutritionGoals.userId,
                set: { ...data, updatedAt: new Date() },
            })
            .returning();

        if (!row) throw new Error('Failed to upsert nutrition goal');
        return NutritionGoalEntity.from(row);
    }

    async createMealLogEntry(data: InsertMealLogEntry): Promise<MealLogEntryEntity> {
        const [row] = await this.db.insert(mealLogEntries).values(data).returning();
        if (!row) throw new Error('Failed to insert meal log entry');
        return MealLogEntryEntity.from(row);
    }

    async findMealLogEntries(userId: string, logDate: string): Promise<MealLogEntryEntity[]> {
        const rows = await this.db.query.mealLogEntries.findMany({
            where: and(eq(mealLogEntries.userId, userId), eq(mealLogEntries.logDate, logDate)),
        });

        return rows.map(MealLogEntryEntity.from);
    }

    /** Scoped by user as well as id, so one account cannot delete another's entry. */
    async deleteMealLogEntry(userId: string, id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(mealLogEntries)
            .where(and(eq(mealLogEntries.id, id), eq(mealLogEntries.userId, userId)))
            .returning({ id: mealLogEntries.id });

        return deleted.length > 0;
    }

    async createWaterLogEntry(data: InsertWaterLogEntry): Promise<WaterLogEntryEntity> {
        const [row] = await this.db.insert(waterLogEntries).values(data).returning();
        if (!row) throw new Error('Failed to insert water log entry');
        return WaterLogEntryEntity.from(row);
    }

    async deleteWaterLogEntry(userId: string, id: string): Promise<boolean> {
        const deleted = await this.db
            .delete(waterLogEntries)
            .where(and(eq(waterLogEntries.id, id), eq(waterLogEntries.userId, userId)))
            .returning({ id: waterLogEntries.id });

        return deleted.length > 0;
    }

    async upsertSteps(userId: string, logDate: string, steps: number): Promise<DailyStepsEntity> {
        const [row] = await this.db
            .insert(dailySteps)
            .values({ userId, logDate, steps })
            .onConflictDoUpdate({
                target: [dailySteps.userId, dailySteps.logDate],
                set: { steps, updatedAt: new Date() },
            })
            .returning();

        if (!row) throw new Error('Failed to upsert daily steps');
        return DailyStepsEntity.from(row);
    }

    async findSteps(userId: string, logDate: string): Promise<DailyStepsEntity | null> {
        const row = await this.db.query.dailySteps.findFirst({
            where: and(eq(dailySteps.userId, userId), eq(dailySteps.logDate, logDate)),
        });

        return row ? DailyStepsEntity.from(row) : null;
    }

    /**
     * Sums the day in the database rather than in Node.
     *
     * There is deliberately no stored daily summary: V1 kept one and it was
     * permanently wrong, because the trigger meant to maintain it was never
     * written. Two aggregates over an indexed `(user_id, log_date)` cost far
     * less than a second source of truth that can disagree with the log.
     */
    async findDailyTotals(userId: string, logDate: string): Promise<DailyTotals> {
        const [meals] = await this.db
            .select({
                calories: sql<string>`coalesce(sum(${mealLogEntries.creditedCalories}), 0)`,
                proteinG: sql<string>`coalesce(sum(${mealLogEntries.creditedProteinG}), 0)`,
                fatsG: sql<string>`coalesce(sum(${mealLogEntries.creditedFatsG}), 0)`,
                carbsG: sql<string>`coalesce(sum(${mealLogEntries.creditedCarbsG}), 0)`,
            })
            .from(mealLogEntries)
            .where(and(eq(mealLogEntries.userId, userId), eq(mealLogEntries.logDate, logDate)));

        const [water] = await this.db
            .select({ waterMl: sql<string>`coalesce(sum(${waterLogEntries.amountMl}), 0)` })
            .from(waterLogEntries)
            .where(and(eq(waterLogEntries.userId, userId), eq(waterLogEntries.logDate, logDate)));

        return {
            calories: Math.round(Number(meals?.calories ?? 0)),
            proteinG: Number(meals?.proteinG ?? 0),
            fatsG: Number(meals?.fatsG ?? 0),
            carbsG: Number(meals?.carbsG ?? 0),
            waterMl: Number(water?.waterMl ?? 0),
        };
    }

    async findWaterLogEntries(userId: string, logDate: string): Promise<WaterLogEntryEntity[]> {
        const rows = await this.db.query.waterLogEntries.findMany({
            where: and(eq(waterLogEntries.userId, userId), eq(waterLogEntries.logDate, logDate)),
        });

        return rows.map(WaterLogEntryEntity.from);
    }
}
