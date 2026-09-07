import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';
import { ShoppingItemOrigin } from '@dns/shared-types';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    AddShoppingItemInboundDto,
    ShoppingItemParam,
    ShoppingListRangeQuery,
    ShoppingListView,
    ShoppingProductParam,
} from './dto';
import { ShoppingListService } from './shopping-list.service';

@ApiTags('shopping-list')
@Controller('shopping-list')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class ShoppingListController {
    constructor(private readonly shoppingListService: ShoppingListService) {}

    /**
     * The list, grouped into aisles.
     *
     * It takes the same window the plan tab shows, because the imported half
     * of it is a sum over exactly those days — and asking for the week the
     * same way on both screens is one less thing to keep in step.
     */
    @Get()
    @ApiQuery({ name: 'from', example: '2026-05-18' })
    @ApiQuery({ name: 'to', example: '2026-05-24' })
    @ApiOkResponse({ type: ShoppingListView })
    async read(@CurrentUser() user: UserEntity, @Query() query: ShoppingListRangeQuery): Promise<ShoppingListView> {
        const list = await this.shoppingListService.read(user.id, query);
        return ShoppingListView.from(list);
    }

    /** Adding the same product again sums into the line already there (add-product FR-009). */
    @Post('items')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'On the list. Read it back to see the aisle it landed in.' })
    @ApiNotFoundResponse({ description: 'No such product for this account.' })
    async add(@CurrentUser() user: UserEntity, @Body() body: AddShoppingItemInboundDto): Promise<void> {
        await this.shoppingListService.add(user.id, body);
    }

    /**
     * Removes a line this account added by hand. An imported line has no row
     * of its own, so it answers 404 like anything else that is not there.
     */
    @Delete('items/:productId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'productId', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Gone, along with its tick.' })
    @ApiNotFoundResponse({ description: 'Nothing of this account’s own to remove.' })
    async remove(@CurrentUser() user: UserEntity, @Param() params: ShoppingProductParam): Promise<void> {
        await this.shoppingListService.remove(user.id, params.productId);
    }

    /**
     * The tick, as a sub-resource rather than a toggle (ADR-0004) — a retry in
     * a shop with bad signal must not untick what it just ticked.
     *
     * Keyed by origin as well as product: the same thing can stand on the list
     * twice, once imported and once added by hand, and buying one is not
     * buying the other.
     */
    @Put('items/:origin/:productId/purchased')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'origin', enum: ShoppingItemOrigin })
    @ApiParam({ name: 'productId', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Ticked — idempotent.' })
    async markPurchased(@CurrentUser() user: UserEntity, @Param() params: ShoppingItemParam): Promise<void> {
        await this.shoppingListService.setPurchased(user.id, params.productId, params.origin, true);
    }

    @Delete('items/:origin/:productId/purchased')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'origin', enum: ShoppingItemOrigin })
    @ApiParam({ name: 'productId', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Unticked — idempotent.' })
    async unmarkPurchased(@CurrentUser() user: UserEntity, @Param() params: ShoppingItemParam): Promise<void> {
        await this.shoppingListService.setPurchased(user.id, params.productId, params.origin, false);
    }

    /**
     * Empties the list.
     *
     * The design has no button for this yet, and the list clears itself never —
     * so without it a list only grows and eventually becomes unusable.
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Manual lines and every tick are gone. The plan is untouched.' })
    async clear(@CurrentUser() user: UserEntity): Promise<void> {
        await this.shoppingListService.clear(user.id);
    }

    /** «Додати з плану» — a boolean as a sub-resource, per ADR-0004 rather than a toggle. */
    @Put('plan-import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Imported lines are shown.' })
    async enablePlanImport(@CurrentUser() user: UserEntity): Promise<void> {
        await this.shoppingListService.setImportFromPlan(user.id, true);
    }

    @Delete('plan-import')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Imported lines are hidden; their ticks are kept (FR-005).' })
    async disablePlanImport(@CurrentUser() user: UserEntity): Promise<void> {
        await this.shoppingListService.setImportFromPlan(user.id, false);
    }
}
