import React from 'react';

import { initialWindowMetrics } from 'react-native-safe-area-context';
import RNToast, { type ToastConfigParams } from 'react-native-toast-message';

import { Toast, type ToastVariant } from '@/shared/ui/components/toasts';

export type ToastType = ToastVariant;

/** Safe-area-aware top offset — keeps the toast clear of the notch / Dynamic Island. */
const TOAST_TOP_OFFSET = (initialWindowMetrics?.insets.top ?? 0) + 12;

interface ShowOptions {
    /** Action button label (e.g. "Скасувати"). */
    actionLabel?: string;
    /** Action button handler. */
    onAction?: () => void;
}

/** Maps a `react-native-toast-message` payload onto our `Toast` component. */
const renderToast = (variant: ToastVariant) => {
    const ToastRenderer = ({ text1, props }: ToastConfigParams<ShowOptions>) => (
        <Toast
            variant={variant}
            text={text1 ?? ''}
            actionLabel={props?.actionLabel}
            onAction={props?.onAction}
            onClose={ToastService.hide}
        />
    );
    ToastRenderer.displayName = `ToastRenderer(${variant})`;
    return ToastRenderer;
};

export const toastConfig = {
    default: renderToast('default'),
    success: renderToast('success'),
    negative: renderToast('negative'),
    warning: renderToast('warning'),
};

const show = (variant: ToastVariant, text: string, options?: ShowOptions) => {
    RNToast.show({
        type: variant,
        text1: text,
        position: 'top',
        topOffset: TOAST_TOP_OFFSET,
        props: options,
    });
};

export const ToastService = {
    info: (text: string, options?: ShowOptions) => show('default', text, options),
    success: (text: string, options?: ShowOptions) => show('success', text, options),
    error: (text: string, options?: ShowOptions) => show('negative', text, options),
    warning: (text: string, options?: ShowOptions) => show('warning', text, options),
    hide: () => RNToast.hide(),
};
