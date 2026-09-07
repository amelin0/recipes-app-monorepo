import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetPermitView {
    @ApiProperty({ description: 'Single-use, short-lived. Grants only the password change, never a session.' })
    readonly permitToken: string;

    private constructor(permitToken: string) {
        this.permitToken = permitToken;
    }

    static from(permitToken: string): PasswordResetPermitView {
        return new PasswordResetPermitView(permitToken);
    }
}
