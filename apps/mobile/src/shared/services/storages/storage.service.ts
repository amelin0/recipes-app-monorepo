import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

/**
 * Keys allowed in the default (non-secure) MMKV store.
 * Extend as new preferences are added. Keys are intentionally explicit to
 * keep the surface audit-able and prevent typos.
 */
type LocalDataKeys = 'appLanguage' | 'onboardingCompleted' | 'themePreference';

export const writeData = <T extends object>(key: LocalDataKeys, data: T) => {
    storage.set(key, JSON.stringify(data));
};

export const readData = <T>(key: LocalDataKeys): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
};

export const deleteData = (key: LocalDataKeys) => {
    storage.remove(key);
};

export const clearStorage = () => {
    storage.clearAll();
};
