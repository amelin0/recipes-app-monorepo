import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

import { OtpService } from './otp.service';
import { OTP_CONFIG } from './otp.tokens';
import { OtpConfig } from './otp.types';

export interface OtpModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => OtpConfig | Promise<OtpConfig>;
    isGlobal?: boolean;
}

@Module({})
export class OtpModule {
    static forRootAsync(options: OtpModuleAsyncOptions): DynamicModule {
        return {
            module: OtpModule,
            global: options.isGlobal ?? false,
            imports: options.imports,
            providers: [
                {
                    provide: OTP_CONFIG,
                    useFactory: options.useFactory,
                    inject: options.inject ?? [],
                },
                OtpService,
            ],
            exports: [OtpService],
        };
    }
}
