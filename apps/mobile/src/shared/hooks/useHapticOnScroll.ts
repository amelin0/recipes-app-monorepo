import { type SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import { scheduleOnRN } from 'react-native-worklets';

import { Haptics } from '@/shared/utils/haptics';

import type { ScrollDirectionValue } from './useScrollDirection';

interface UseHapticOnScrollParams {
    /** True only during active drag; prevents momentum / programmatic scrolls from firing haptics. */
    isListDragging: SharedValue<boolean>;
    scrollDirection: ScrollDirectionValue;
    /** Anchor captured by `useScrollDirection` when direction flips — used for one-shot crossing detection. */
    offsetYAnchorOnChangeDirection: SharedValue<number>;
    /** Distance from origin (sign matters) that triggers a haptic on crossing. */
    triggerOffset: number;
    /** Which crossing direction triggers haptics. @default 'both' */
    hapticDirection?: 'to-bottom' | 'to-top' | 'both';
}

/**
 * Fires a single light haptic each time the scroll offset crosses
 * `triggerOffset`. Used by pull-to-refresh to confirm the user
 * passed the trigger threshold.
 */
export function useHapticOnScroll({
    isListDragging,
    scrollDirection,
    offsetYAnchorOnChangeDirection,
    triggerOffset,
    hapticDirection = 'both',
}: UseHapticOnScrollParams) {
    const isHapticTriggered = useSharedValue(false);

    const handleHaptics = () => {
        void Haptics.light();
        isHapticTriggered.set(true);
    };

    useAnimatedReaction(
        () => scrollDirection.get(),
        () => {
            if (!isListDragging.get()) return;
            isHapticTriggered.set(false);
        },
    );

    const singleHapticOnScroll = (event: ReanimatedScrollEvent | number) => {
        'worklet';
        if (!isListDragging.get()) return;

        const offsetY = typeof event === 'number' ? event : event.contentOffset.y;

        if (Math.sign(offsetY) !== Math.sign(triggerOffset)) return;

        if (scrollDirection.get() === 'to-bottom' && hapticDirection === 'to-bottom') {
            if (offsetY > triggerOffset && !isHapticTriggered.get()) {
                scheduleOnRN(handleHaptics);
            }
        }

        if (scrollDirection.get() === 'to-top' && hapticDirection === 'to-top') {
            if (
                offsetY < triggerOffset &&
                offsetYAnchorOnChangeDirection.get() > triggerOffset &&
                !isHapticTriggered.get()
            ) {
                scheduleOnRN(handleHaptics);
            }
        }

        if (hapticDirection === 'both') {
            if (scrollDirection.get() === 'to-bottom') {
                if (offsetY > triggerOffset && !isHapticTriggered.get()) {
                    scheduleOnRN(handleHaptics);
                }
            } else if (scrollDirection.get() === 'to-top') {
                if (
                    offsetY < triggerOffset &&
                    offsetYAnchorOnChangeDirection.get() > triggerOffset &&
                    !isHapticTriggered.get()
                ) {
                    scheduleOnRN(handleHaptics);
                }
            }
        }
    };

    return { singleHapticOnScroll };
}
