import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

import { StorageService } from './storage.service';
import { STORAGE_CONFIG } from './storage.tokens';
import { StorageConfig } from './storage.types';

export interface StorageModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => StorageConfig | Promise<StorageConfig>;
    isGlobal?: boolean;
}

@Module({})
export class StorageModule {
    static forRootAsync(options: StorageModuleAsyncOptions): DynamicModule {
        return {
            module: StorageModule,
            global: options.isGlobal ?? false,
            imports: options.imports,
            providers: [
                {
                    provide: STORAGE_CONFIG,
                    useFactory: options.useFactory,
                    inject: options.inject ?? [],
                },
                StorageService,
            ],
            exports: [StorageService],
        };
    }
}
