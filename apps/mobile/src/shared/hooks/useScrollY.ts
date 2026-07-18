import { type SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

/**
 * Track the vertical scroll offset of an `Animated.ScrollView` /
 * `Animated.FlatList` as a Reanimated `SharedValue`.
 *
 * Pass the returned `scrollHandler` to the scroll component via its
 * `onScroll` prop, and forward `scrollY` to any animated children that
 * need to react to scroll position (sticky blur header, parallax bg, …).
 *
 * @example
 *   const { scrollY, scrollHandler } = useScrollY();
 *   return (
 *     <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
 *       …
 *     </Animated.ScrollView>
 *   );
 */
export function useScrollY(): {
    scrollY: SharedValue<number>;
    scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
} {
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: event => {
            scrollY.value = event.contentOffset.y;
        },
    });

    return { scrollY, scrollHandler };
}
