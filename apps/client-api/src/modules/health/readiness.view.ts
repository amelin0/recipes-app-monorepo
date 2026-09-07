import { ApiProperty } from '@nestjs/swagger';

/** One dependency and whether it answered. */
export class DependencyView {
    @ApiProperty({ example: 'database' }) readonly name: string;
    @ApiProperty() readonly ok: boolean;

    @ApiProperty({ nullable: true, description: 'Why it failed, when it did.' })
    readonly error: string | null;

    private constructor(name: string, ok: boolean, error: string | null) {
        this.name = name;
        this.ok = ok;
        this.error = error;
    }

    static from(name: string, ok: boolean, error: string | null): DependencyView {
        return new DependencyView(name, ok, error);
    }
}

export class ReadinessView {
    @ApiProperty({ example: 'ready' }) readonly status: string;
    @ApiProperty({ type: [DependencyView] }) readonly dependencies: DependencyView[];
    @ApiProperty() readonly time: string;

    private constructor(ready: boolean, dependencies: DependencyView[]) {
        this.status = ready ? 'ready' : 'not-ready';
        this.dependencies = dependencies;
        this.time = new Date().toISOString();
    }

    static from(dependencies: DependencyView[]): ReadinessView {
        return new ReadinessView(
            dependencies.every(dependency => dependency.ok),
            dependencies,
        );
    }
}
