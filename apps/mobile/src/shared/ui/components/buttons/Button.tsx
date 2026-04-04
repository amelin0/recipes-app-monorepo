import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type ViewStyle,
} from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  isLoading = false,
  style,
  children,
  ...rest
}) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primaryBg : styles.secondaryBg,
        pressed && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        disabled && (isPrimary ? styles.primaryDisabled : styles.secondaryDisabled),
        style as ViewStyle,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            disabled
              ? styles.disabledText.color
              : isPrimary
                ? styles.primaryText.color
                : styles.secondaryText.color
          }
        />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              isPrimary ? styles.primaryText : styles.secondaryText,
              disabled && styles.disabledText,
            ]}>
            {title}
          </Text>
          {children}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create(({ colors, typography }) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  text: {
    ...typography.h3,
    textAlign: 'center',
  },
  primaryBg: {
    backgroundColor: colors.primary[100],
  },
  primaryPressed: {
    backgroundColor: colors.gray[100],
  },
  primaryDisabled: {
    backgroundColor: colors.gray[30],
  },
  primaryText: {
    color: colors.gray[0],
  },
  secondaryBg: {
    backgroundColor: colors.secondary.default,
  },
  secondaryPressed: {
    backgroundColor: colors.secondary.default,
    opacity: 0.8,
  },
  secondaryDisabled: {
    backgroundColor: colors.gray[10],
  },
  secondaryText: {
    color: colors.gray[100],
  },
  disabledText: {
    color: colors.gray[60],
  },
}));
