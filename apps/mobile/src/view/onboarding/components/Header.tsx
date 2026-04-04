import React, { FC } from 'react';
import { Text, View } from 'react-native';

import { PressableScale } from 'pressto';
import { StyleSheet } from 'react-native-unistyles';

import { AppHeader } from '@/shared/ui/components/headers';

type Props = {
  handleSkip: () => void;
};

export const Header: FC<Props> = ({ handleSkip }) => {
  return (
    <>
      <AppHeader>
        <View style={styles.content}>
          <Text style={styles.title}>Ratio Fit</Text>

          <PressableScale onPress={handleSkip} hitSlop={10}>
            <Text style={styles.buttonText}>Skip</Text>
          </PressableScale>
        </View>
      </AppHeader>
    </>
  );
};

const styles = StyleSheet.create(({ typography, colors }) => ({
  title: {
    ...typography['titleLg'],
    color: colors.text.primary,
  },
  buttonText: {
    ...typography['bodyLg'],
    color: colors.text.secondary,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));
