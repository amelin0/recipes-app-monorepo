import { PropsWithChildren } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { spacing } from '../../theme';

type Props = {
  style?: StyleProp<ViewStyle>;
  pHorizontal?: keyof typeof spacing;
};

export const AppScreen = ({ children, style, pHorizontal = 4 }: PropsWithChildren<Props>) => {
  return (
    <View
      style={[
        styles.container,
        !!pHorizontal && {
          paddingHorizontal: spacing[4],
        },
        style,
      ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create(({ spacing, colors }, rt) => {
  return {
    container: {
      flex: 1,
      // paddingTop: rt.insets.top,
      backgroundColor: colors.bg.canvas,
      // paddingBottom:
      //   rt.insets.bottom > 0
      //     ? rt.insets.bottom + (Platform.OS === 'ios' ? 0 : spacing[4])
      //     : spacing[4],
    },
  };
});
