import { ApiProperty } from '@nestjs/swagger';

import { DailyOutcome, MealSlot } from '@dns/shared-types';

import { RecipeCardView } from '../../../catalog/dto';
import { PlanDay, PlanItem, PlanSlot, PlanTotals } from '../../meal-plan.service';

export class PlanTotalsView {
    @ApiProperty() readonly calories: number;
    @ApiProperty() readonly proteinG: number;
    @ApiProperty() readonly fatsG: number;
    @ApiProperty() readonly carbsG: number;

    private constructor(totals: PlanTotals) {
        this.calories = totals.calories;
        this.proteinG = totals.proteinG;
        this.fatsG = totals.fatsG;
        this.carbsG = totals.carbsG;
    }

    static from(totals: PlanTotals): PlanTotalsView {
        return new PlanTotalsView(totals);
    }
}

/**
 * A dish standing in a slot.
 *
 * It carries the catalogue card rather than a flattened copy of it: the row in
 * the plan shows the same photo, name and figures as the row in the picker did,
 * and two shapes for one dish would drift the moment either screen changes.
 */
export class PlanItemView {
    @ApiProperty({ format: 'uuid', description: 'The planned item — what a delete targets, not the recipe id.' })
    readonly id: string;

    @ApiProperty({ type: RecipeCardView }) readonly recipe: RecipeCardView;

    private constructor(item: PlanItem) {
        this.id = item.id;
        this.recipe = RecipeCardView.from(item.recipe);
    }

    static from(item: PlanItem): PlanItemView {
        return new PlanItemView(item);
    }
}

export class PlanSlotView {
    @ApiProperty({ enum: MealSlot }) readonly slot: MealSlot;

    @ApiProperty({ type: [PlanItemView], description: 'Empty means «Не заплановано» — the slot itself always exists.' })
    readonly items: PlanItemView[];

    private constructor(slot: PlanSlot) {
        this.slot = slot.slot;
        this.items = slot.items.map(PlanItemView.from);
    }

    static from(slot: PlanSlot): PlanSlotView {
        return new PlanSlotView(slot);
    }
}

/** One day of the plan: its four slots, what they add up to, and how that sits against the goal. */
export class PlanDayView {
    @ApiProperty({ example: '2026-05-18' }) readonly date: string;

    @ApiProperty({ type: [PlanSlotView], description: 'All four, always, in the order the screen renders them.' })
    readonly slots: PlanSlotView[];

    @ApiProperty({ type: PlanTotalsView }) readonly planned: PlanTotalsView;

    @ApiProperty({ type: PlanTotalsView, nullable: true, description: 'Null while the account has no goal.' })
    readonly goal: PlanTotalsView | null;

    @ApiProperty({
        enum: DailyOutcome,
        nullable: true,
        description: 'Null with no goal or nothing planned — a state, not a verdict.',
    })
    readonly outcome: DailyOutcome | null;

    @ApiProperty({
        description:
            'Whether the planned dishes are already counted into the shopping list. ' +
            'There is no «add to list» action on a dish: the list sums the plan on every read, ' +
            'so this is a state. The switch lives at PUT /shopping-list/plan-import.',
    })
    readonly importsIntoShoppingList: boolean;

    private constructor(day: PlanDay) {
        this.date = day.date;
        this.slots = day.slots.map(PlanSlotView.from);
        this.planned = PlanTotalsView.from(day.planned);
        this.goal = day.goal ? PlanTotalsView.from(day.goal) : null;
        this.outcome = day.outcome;
        this.importsIntoShoppingList = day.importsIntoShoppingList;
    }

    static from(day: PlanDay): PlanDayView {
        return new PlanDayView(day);
    }
}
