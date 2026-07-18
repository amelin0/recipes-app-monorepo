import { deleteSecureData, readSecureData, writeSecureData } from '@/shared/services';

interface TokenData {
    accessToken: string;
    refreshToken?: string;
}

const TOKEN_KEY = 'token';

export class AuthStorage {
    static async saveTokens(data: TokenData) {
        await writeSecureData(TOKEN_KEY, data);
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
