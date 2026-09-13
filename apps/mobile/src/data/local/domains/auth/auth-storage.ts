import { deleteSecureData, readSecureData, writeSecureData } from '@/shared/services';

interface TokenData {
    accessToken: string;
    refreshToken?: string;
}

const TOKEN_KEY = 'token';

export class AuthStorage {
    /**
     * Merges rather than replaces: a caller that has only a fresh access
     * token (`HttpService.setAccessToken`) would otherwise wipe the refresh
     * token, and the next 401 would sign the user out with no way back.
     */
    static async saveTokens(data: TokenData) {
        const existing = await readSecureData<TokenData>(TOKEN_KEY);
        await writeSecureData(TOKEN_KEY, { ...existing, ...data });
    }

    static async getAccessToken(): Promise<string | null> {
        const tokens = await readSecureData<TokenData>(TOKEN_KEY);
        return tokens?.accessToken ?? null;
    }

    static async getRefreshToken(): Promise<string | null> {
        const tokens = await readSecureData<TokenData>(TOKEN_KEY);
        return tokens?.refreshToken ?? null;
    }

    static async removeTokens() {
        await deleteSecureData(TOKEN_KEY);
    }
}
