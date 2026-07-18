import * as ExpoHaptics from 'expo-haptics';

/** Light tap — toggles, checkboxes, small button presses */
const light = () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);

/** Medium tap — drag & drop, swipe actions, tab switches */
const medium = () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);

/** Heavy tap — completing major actions, slide-to-confirm */
const heavy = () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);

/** Rigid tap — snapping into place, reaching limits */
const rigid = () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Rigid);

/** Soft tap — elastic or compressible UI elements */
const soft = () => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft);

/** Success notification — transaction completed, OTP verified */
const success = () => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);

/** Warning notification — low balance, expiring session */
const warning = () => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);

/** Error notification — wrong PIN, failed payment, validation error */
const error = () => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);

/** Selection tick — picker scroll, segment change, value stepping */
const selection = () => ExpoHaptics.selectionAsync();

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
