import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { colors } from '../../theme'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'success' | 'ghost'
type ButtonSize = 'large' | 'medium' | 'small'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title?: string
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  isLoading?: boolean
  style?: StyleProp<ViewStyle>
}

const variantStyles: Record<ButtonVariant, { bg: string; activeBg: string; text: string }> = {
  primary: { bg: colors.primary.default, activeBg: colors.primary.active, text: colors.primary.onPrimary },
  secondary: { bg: colors.primary.subtle, activeBg: colors.secondary.active, text: colors.primary.onSubtle },
  destructive: { bg: colors.error.default, activeBg: colors.error.active, text: colors.error.onError },
  success: { bg: colors.success.default, activeBg: colors.success.active, text: colors.success.onSuccess },
  ghost: { bg: 'transparent', activeBg: colors.secondary.active, text: colors.primary.onSubtle },
}

const sizeStyles: Record<ButtonSize, { minHeight: number; paddingH: number; paddingV: number; fontSize: number }> = {
  large: { minHeight: 52, paddingH: 16, paddingV: 8, fontSize: 15 },
  medium: { minHeight: 44, paddingH: 14, paddingV: 6, fontSize: 14 },
  small: { minHeight: 32, paddingH: 12, paddingV: 4, fontSize: 13 },
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  isLoading = false,
  style,
  ...rest
}) => {
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  const bg = disabled ? colors.disabled.background : v.bg
  const textColor = disabled ? colors.disabled.content : v.text

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: s.minHeight,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderRadius: 9999,
          backgroundColor: pressed ? v.activeBg : bg,
          gap: 8,
        },
        style as ViewStyle,
      ]}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        title && (
          <View style={{ paddingHorizontal: 4 }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontWeight: '600',
                fontSize: s.fontSize,
                lineHeight: s.fontSize + 6,
                color: textColor,
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
          </View>
        )
      )}
    </Pressable>
  )
}
