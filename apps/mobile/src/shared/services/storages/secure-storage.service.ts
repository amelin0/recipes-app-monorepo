import * as SecureStore from 'expo-secure-store';

/**
 * Keys allowed in the encrypted SecureStore.
 * Reserved for sensitive data — auth tokens, biometric keys, refresh tokens.
 */
type SecureDataKeys = 'token' | 'biometricKey';

export const writeData = async <T extends object>(key: SecureDataKeys, data: T) => {
    await SecureStore.setItemAsync(key, JSON.stringify(data));
};

export const readData = async <T>(key: SecureDataKeys): Promise<T | null> => {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export const deleteData = async (key: SecureDataKeys) => {
    await SecureStore.deleteItemAsync(key);
};
