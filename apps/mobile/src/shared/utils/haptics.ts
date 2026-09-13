import * as ExpoHaptics from 'expo-haptics';

/**
 * Вібрація — приємність, а не дія: пристрій без Taptic Engine (і симулятор)
 * відхиляє виклик, і без цього кожен тап лишав би неопрацьований проміс.
 */
const quiet = (run: () => Promise<void>) => () => run().catch(() => undefined);

/** Light tap — toggles, checkboxes, small button presses */
const light = quiet(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));

/** Medium tap — drag & drop, swipe actions, tab switches */
const medium = quiet(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));

/** Heavy tap — completing major actions, slide-to-confirm */
const heavy = quiet(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));

/** Rigid tap — snapping into place, reaching limits */
const rigid = quiet(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid));

/** Soft tap — elastic or compressible UI elements */
const soft = quiet(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft));

/** Success notification — transaction completed, OTP verified */
const success = quiet(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));

/** Warning notification — low balance, expiring session */
const warning = quiet(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));

/** Error notification — wrong PIN, failed payment, validation error */
const error = quiet(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error));

/** Selection tick — picker scroll, segment change, value stepping */
const selection = quiet(() => ExpoHaptics.selectionAsync());

export const Haptics = {
    light,
    medium,
    heavy,
    rigid,
    soft,
    success,
    warning,
    error,
    selection,
};
