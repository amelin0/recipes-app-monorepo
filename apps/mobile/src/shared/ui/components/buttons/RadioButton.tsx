import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

interface RadioButtonProps {
  selected: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.track,
        disabled ? styles.trackDisabled : styles.trackActive,
        selected && (disabled ? styles.trackSelectedDisabled : styles.trackSelected),
        style as ViewStyle,
      ]}>
      {selected && (
        <View style={[styles.dot, disabled && styles.dotDisabled]} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create(({ colors }) => ({
  track: {
    width: 18,
    height: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackActive: {
    borderColor: colors.gray[100],
  },
  trackDisabled: {
    borderColor: colors.gray[20],
  },
  trackSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.gray[100],
  },
  trackSelectedDisabled: {
    backgroundColor: colors.secondary.default,
    borderColor: colors.gray[20],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[0],
  },
  dotDisabled: {
    backgroundColor: colors.gray[20],
  },
}));
