import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions } from 'react-native';

import { useRouter } from 'expo-router';
import { cancelAnimation, Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';

export const SLIDE_COUNT = 3;
export const SLIDE_DURATION = 4000;
export const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const useOnboardingScreen = () => {
  const [carouselHeight, setCarouselHeight] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const activeIndex = useSharedValue(0);
  const slideProgress = useSharedValue(0);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    slideProgress.value = 0;
    slideProgress.value = withTiming(1, { duration: SLIDE_DURATION, easing: Easing.linear });

    timerRef.current = setTimeout(() => {
      const nextIndex = currentIndexRef.current + 1;
      if (nextIndex < SLIDE_COUNT) {
        currentIndexRef.current = nextIndex;
        activeIndex.value = nextIndex;
        carouselRef.current?.scrollTo({ index: nextIndex, animated: true });
        startAutoPlay();
      }
    }, SLIDE_DURATION);
  }, [activeIndex, slideProgress]);

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimation(slideProgress);
    };
  }, [startAutoPlay, slideProgress]);

  const handleSnapToItem = (index: number) => {
    if (index === currentIndexRef.current) return;
    currentIndexRef.current = index;
    activeIndex.value = index;
    startAutoPlay();
  };

  const handleNext = () => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < SLIDE_COUNT) {
      currentIndexRef.current = nextIndex;
      activeIndex.value = nextIndex;
      carouselRef.current?.scrollTo({ index: nextIndex, animated: true });
      startAutoPlay();
    } else {
      router.replace('/(app)/(auth)');
    }
  };

  const handleSkip = () => router.replace('/(app)/(auth)');

  const handleGetStarted = () => router.replace('/(app)/(auth)');

  const handleCarouselLayout = (height: number) => setCarouselHeight(height);

  return {
    activeIndex,
    slideProgress,
    carouselRef,
    carouselHeight,
    handleSnapToItem,
    handleNext,
    handleSkip,
    handleGetStarted,
    handleCarouselLayout,
  };
};
