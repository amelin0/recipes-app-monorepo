import React from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';

import Carousel from 'react-native-reanimated-carousel';
import { StyleSheet } from 'react-native-unistyles';

import { AppScreen } from '@/shared/ui/components/layouts';

import { Header, ProgressBar, Slide1, Slide2, Slide3 } from './components';
import { SLIDE_COUNT, useOnboardingScreen } from './useOnboardingScreen';

export const OnboardingScreen = () => {
  const {
    activeIndex,
    slideProgress,
    carouselRef,

    carouselHeight,

    handleSnapToItem,
    handleNext,

    handleSkip,
    handleGetStarted,
    handleCarouselLayout,
  } = useOnboardingScreen();

  const { width } = useWindowDimensions();

  return (
    <>
      <Header handleSkip={handleSkip} />

      <AppScreen pHorizontal={0}>
        <View style={styles.progressBars}>
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <ProgressBar
              key={i}
              index={i}
              activeIndex={activeIndex}
              slideProgress={slideProgress}
            />
          ))}
        </View>

        <View
          style={styles.carouselWrapper}
          onLayout={e => handleCarouselLayout(e.nativeEvent.layout.height)}>
          {carouselHeight > 0 && (
            <Carousel
              ref={carouselRef}
              width={width}
              height={carouselHeight}
              data={[0, 1, 2]}
              loop={false}
              scrollAnimationDuration={380}
              onSnapToItem={handleSnapToItem}
              renderItem={({ index }) => {
                if (index === 0) return <Slide1 />;
                if (index === 1) return <Slide2 />;
                return <Slide3 />;
              }}
            />
          )}
        </View>

        <View style={styles.bar}>
          <Pressable style={styles.arrowBtn} onPress={handleNext}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>

          <Pressable style={styles.getStartedBtn} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>

          <View style={styles.checkBtn}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        </View>
      </AppScreen>
    </>
  );
};

const styles = StyleSheet.create(({ colors, spacing }, rt) => ({
  progressBars: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    // backgroundColor: 'red',
    justifyContent: 'center',
  },

  carouselWrapper: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },

  bar: {
    position: 'absolute',
    bottom:
      rt.insets.bottom > 0
        ? rt.insets.bottom + (Platform.OS === 'ios' ? 0 : spacing[4])
        : spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    paddingTop: 4,
    gap: 12,
  },
  arrowBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: colors.primary.onPrimary,
    fontSize: 28,
    fontFamily: 'Figtree_700Bold',
    lineHeight: 32,
    marginTop: -2,
  },
  getStartedBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    color: colors.text.inverse,
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 15,
  },
  checkBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary.active,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 18, color: colors.text.secondary },
}));
