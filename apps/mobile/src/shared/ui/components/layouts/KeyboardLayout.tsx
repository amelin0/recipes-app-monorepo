import React, { PropsWithChildren, ReactNode } from 'react';
import { Keyboard, Pressable, View } from 'react-native';

import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { StyleSheet } from 'react-native-unistyles';

type Props = {
  stickyContent?: ReactNode;
};

export const KeyboardLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  stickyContent,
}) => {
  return (
    <View style={styles.container}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        {children}
      </Pressable>
      {stickyContent && <KeyboardStickyView>{stickyContent}</KeyboardStickyView>}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flex: 1,
  },
}));
