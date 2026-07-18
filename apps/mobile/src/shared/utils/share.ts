import { Share } from 'react-native';

import * as Sharing from 'expo-sharing';

const text = async (message: string, url?: string) => {
    await Share.share({ message, url });
};

const file = async (fileUri: string, mimeType?: string) => {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return;

    await Sharing.shareAsync(fileUri, { mimeType });
};

const image = async (imageUri: string) => {
    await file(imageUri, 'image/jpeg');
};

const pdf = async (pdfUri: string) => {
    await file(pdfUri, 'application/pdf');
};

export const AppShare = {
    text,
    file,
    image,
    pdf,
};
