import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

import { PurchasesService } from './purchases.service';
import { PURCHASES_CONFIG } from './purchases.tokens';
import { PurchasesConfig } from './purchases.types';

export interface PurchasesModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => PurchasesConfig | Promise<PurchasesConfig>;
    isGlobal?: boolean;
}

@Module({})
export class PurchasesModule {
    static forRootAsync(options: PurchasesModuleAsyncOptions): DynamicModule {
        return {
            module: PurchasesModule,
            global: options.isGlobal ?? false,
            imports: options.imports,
            providers: [
                {
                    provide: PURCHASES_CONFIG,
                    useFactory: options.useFactory,
                    inject: options.inject ?? [],
                },
                PurchasesService,
            ],
            exports: [PurchasesService],
        };
    }
}
