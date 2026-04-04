import React, { ReactElement, ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { getDefaultHeaderHeight } from '@react-navigation/elements';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { colors } from '@/shared/ui/theme/colors';

export type AppHeaderProps = {
  children: ReactNode;
  bgColor?: keyof typeof colors.bg;
  statusBarProps?: StatusBarProps;
  style?: StyleProp<ViewStyle>;
};

export const AppHeader = ({
  children,
  bgColor = 'canvas',
  statusBarProps = {
    style: 'dark',
    backgroundColor: 'transparent',
    translucent: true,
  },
  style,
}: AppHeaderProps): ReactElement => {
  const { top } = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const { theme } = useUnistyles();

  const defaultHeight = getDefaultHeaderHeight(frame, false, top);

  return (
    <>
      <StatusBar {...statusBarProps} />

      <View
        style={[
          styles.container,
          style,
          {
            height: defaultHeight,
            backgroundColor: theme.colors.bg[bgColor],
          },
        ]}>
        <View style={{ height: top }} pointerEvents="none" />

        {children}
      </View>
    </>
  );
};

const styles = StyleSheet.create(({ spacing }) => ({
  container: {
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    // paddingBottom: spacing[2],
  },
}));
