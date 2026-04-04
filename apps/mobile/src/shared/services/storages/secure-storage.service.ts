import * as SecureStore from 'expo-secure-store';

export const writeSecureData = async <T>(key: string, data: T): Promise<void> => {
  await SecureStore.setItemAsync(key, JSON.stringify(data));
};

export const readSecureData = async <T>(key: string): Promise<T | null> => {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

export const deleteSecureData = async (key: string): Promise<void> => {
  await SecureStore.deleteItemAsync(key);
};
