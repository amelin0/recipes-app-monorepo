import { DynamicModule, InjectionToken, Module, ModuleMetadata, OptionalFactoryDependency } from '@nestjs/common';

import { EmailService } from './email.service';
import { ResendEmailClient } from './resend-email.client';
import { StubEmailClient } from './stub-email.client';
import { EMAIL_CLIENT, EMAIL_CONFIG } from './email.tokens';
import { EmailClient, EmailConfig } from './email.types';

export interface EmailModuleAsyncOptions {
    imports?: ModuleMetadata['imports'];
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
    useFactory: (...args: never[]) => EmailConfig | Promise<EmailConfig>;
    isGlobal?: boolean;
}

@Module({})
export class EmailModule {
    static forRootAsync(options: EmailModuleAsyncOptions): DynamicModule {
        return {
            module: EmailModule,
            global: options.isGlobal ?? false,
            imports: options.imports,
            providers: [
                {
                    provide: EMAIL_CONFIG,
                    useFactory: options.useFactory,
                    inject: options.inject ?? [],
                },
                {
                    provide: EMAIL_CLIENT,
                    // With a key, the real provider. Without one, the stub —
                    // a supported local state, not a misconfiguration.
                    useFactory: (cfg: EmailConfig): EmailClient =>
                        cfg.apiKey ? new ResendEmailClient(cfg.apiKey) : new StubEmailClient(),
                    inject: [EMAIL_CONFIG],
                },
                EmailService,
            ],
            exports: [EmailService],
        };
    }
}
