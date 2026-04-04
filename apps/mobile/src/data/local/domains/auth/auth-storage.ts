import {
  deleteSecureData,
  readSecureData,
  writeSecureData,
} from '@/shared/services/storages/secure-storage.service';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
}

const TOKEN_KEY = 'auth_tokens';

export class AuthStorage {
  static async saveTokens(data: TokenData): Promise<void> {
    await writeSecureData(TOKEN_KEY, data);
  }

  static async getAccessToken(): Promise<string | null> {
    const data = await readSecureData<TokenData>(TOKEN_KEY);
    return data?.accessToken ?? null;
  }

  static async getRefreshToken(): Promise<string | null> {
    const data = await readSecureData<TokenData>(TOKEN_KEY);
    return data?.refreshToken ?? null;
  }

  static async removeTokens(): Promise<void> {
    await deleteSecureData(TOKEN_KEY);
  }
}
