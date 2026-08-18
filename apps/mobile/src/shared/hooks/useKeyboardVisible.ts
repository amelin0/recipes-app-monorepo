import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Tracks on-screen keyboard visibility.
 *
 * iOS gets the `will*` events so the layout swaps in step with the keyboard
 * animation instead of a frame after it; Android only emits `did*`.
 */
export const useKeyboardVisible = (): boolean => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showSub = Keyboard.addListener(showEvent, () => setIsVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setIsVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    return isVisible;
};
