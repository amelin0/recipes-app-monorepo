import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  bottomOffset?: number;
};

export const KeyboardScrollLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  bottomOffset = 20,
}) => {
  return (
    <KeyboardAwareScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={bottomOffset}>
      <View style={styles.content}>{children}</View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create(({ spacing }) => ({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
}));
