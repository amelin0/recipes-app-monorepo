import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

const TRACK_WIDTH = 40;
const THUMB_SIZE = 18;
const PADDING = 2;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

interface ToggleProps {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const offset = useSharedValue(value ? TRAVEL : 0);

  React.useEffect(() => {
    offset.value = withTiming(value ? TRAVEL : 0, { duration: 200 });
  }, [value]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.track,
        value ? (disabled ? styles.trackOnDisabled : styles.trackOn) : styles.trackOff,
        style as ViewStyle,
      ]}>
      <Animated.View
        style={[
          styles.thumb,
          disabled
            ? value
              ? styles.thumbOnDisabled
              : styles.thumbOffDisabled
            : styles.thumbActive,
          thumbAnimatedStyle,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create(({ colors }) => ({
  track: {
    width: TRACK_WIDTH,
    height: 22,
    borderRadius: 1000,
    padding: PADDING,
    justifyContent: 'center',
  },
  trackOff: {
    backgroundColor: colors.gray[10],
  },
  trackOn: {
    backgroundColor: colors.primary[100],
  },
  trackOnDisabled: {
    backgroundColor: colors.gray[10],
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
  },
  thumbActive: {
    backgroundColor: colors.primary[100],
  },
  thumbOffDisabled: {
    backgroundColor: colors.gray[30],
  },
  thumbOnDisabled: {
    backgroundColor: colors.secondary.default,
  },
}));
