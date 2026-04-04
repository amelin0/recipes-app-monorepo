import React from 'react';
import { View } from 'react-native';

import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

interface ProgressBarProps {
  index: number;
  activeIndex: SharedValue<number>;
  slideProgress: SharedValue<number>;
}

export const ProgressBar = ({ index, activeIndex, slideProgress }: ProgressBarProps) => {
  const fillStyle = useAnimatedStyle(() => {
    'worklet';

    let width: number;

    if (index < activeIndex.value) {
      width = 100;
    } else if (index === activeIndex.value) {
      width = slideProgress.value * 100;
    } else {
      width = 0;
    }

    return { width: `${width}%` as unknown as number };
  });

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(77, 77, 77, 0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3C3C3C',
  },
});
