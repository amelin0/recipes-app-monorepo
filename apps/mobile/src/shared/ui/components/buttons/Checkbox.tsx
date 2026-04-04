import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import Svg, { Path } from 'react-native-svg';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useUnistyles();
  const checkColor = disabled ? theme.colors.gray[20] : theme.colors.gray[0];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[
        styles.box,
        disabled ? styles.boxDisabled : styles.boxActive,
        checked && (disabled ? styles.boxCheckedDisabled : styles.boxChecked),
        style as ViewStyle,
      ]}>
      {checked && (
        <Svg width={10} height={8} viewBox="0 0 10 8" fill="none">
          <Path
            d="M1 4L3.5 6.5L9 1"
            stroke={checkColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create(({ colors }) => ({
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxActive: {
    borderColor: colors.gray[100],
  },
  boxDisabled: {
    borderColor: colors.gray[20],
  },
  boxChecked: {
    backgroundColor: colors.primary[100],
    borderColor: colors.gray[100],
  },
  boxCheckedDisabled: {
    backgroundColor: colors.secondary.default,
    borderColor: colors.gray[20],
  },
}));
