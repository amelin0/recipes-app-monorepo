import React from 'react';
import { Text, View } from 'react-native';

import { Image } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';

import vegetablesBgIllustration from '@assets/images/vegetables-bg.png';

export const Slide1 = () => {
  return (
    <View style={styles.slide}>
      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.displayText}>{'Personal\nMeals,'}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>🥗</Text>
            <Text style={styles.badgeTextTop}>Welcome to</Text>
            <Text style={styles.badgeTextBottom}>Ratio Fit</Text>
          </View>

          <Text style={styles.displayText}>{'Your Way,\nAnytime.'}</Text>
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>150 Kcal</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>340 Kcal</Text>
          </View>
        </View>
      </View>

      <View style={styles.illustrationContainer}>
        <Image source={vegetablesBgIllustration} style={styles.illustration} contentFit="cover" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create(({ colors, typography }) => ({
  slide: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    justifyContent: 'space-between',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  textBlock: {
    position: 'relative',
    marginTop: 24,
  },
  displayText: {
    ...typography['displayLg'],
    color: colors.text.primary,
  },
  badge: {
    position: 'absolute',
    right: 20,
    top: 40,
    width: 90,
    height: 90,
    borderRadius: 100,
    backgroundColor: colors.bg.canvas,
    borderWidth: 1.5,
    borderColor: colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 1,
  },
  badgeTextTop: {
    color: colors.text.secondary,
    ...typography['overline'],
  },
  badgeTextBottom: {
    color: colors.primary.default,
    ...typography['caption'],
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.primary.subtle,
  },
  tagText: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 13,
    color: colors.primary.onSubtle,
  },
  illustrationContainer: {
    height: 400,
    width: '100%',
  },
  illustration: {
    ...StyleSheet.absoluteFillObject,
  },
}));
