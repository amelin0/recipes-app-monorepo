import { Platform } from 'react-native';

import * as Application from 'expo-application';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const appVersion = Application.nativeApplicationVersion ?? '1.0.0';

const ENV = process.env.EXPO_PUBLIC_ENV ?? 'development';
const envSuffix = ENV === 'development' ? ' DEV' : ENV === 'stage' ? ' STAGE' : '';
export const appVersionLabel = `v${appVersion}${envSuffix}`;

export const compareVersions = (currentVersion: string, storeVersion: string): boolean => {
    const current = currentVersion.split('.').map(Number);
    const store = storeVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, store.length); i++) {
        const cur = current[i] || 0;
        const str = store[i] || 0;

        if (cur > str) return false;
        if (cur < str) return true;
    }

    return false;
};
