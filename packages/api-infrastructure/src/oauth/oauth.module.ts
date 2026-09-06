import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

import { OAuthService } from './oauth.service';
import { OAUTH_CONFIG } from './oauth.tokens';
import { OAuthConfig } from './oauth.types';

export interface OAuthModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => OAuthConfig | Promise<OAuthConfig>;
    isGlobal?: boolean;
}

@Module({})
export class OAuthModule {
    static forRootAsync(options: OAuthModuleAsyncOptions): DynamicModule {
        return {
            module: OAuthModule,
            global: options.isGlobal ?? false,
            imports: options.imports,
            providers: [
                {
                    provide: OAUTH_CONFIG,
                    useFactory: options.useFactory,
                    inject: options.inject ?? [],
                },
                OAuthService,
            ],
            exports: [OAuthService],
        };
    }
}
