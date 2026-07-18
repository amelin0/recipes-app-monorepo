import { setStringAsync } from 'expo-clipboard';

import { ToastService } from '@/shared/services';

import { Haptics } from './haptics';

export const copyToClipboard = async (text: string, successMessage?: string) => {
    await setStringAsync(text);
    if (successMessage) {
        ToastService.success(successMessage);
    }
    Haptics.success();
};
