import React, { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import TabDiaryActiveIcon from '@assets/icons/tab-diary-active.svg';
import TabDiaryInactiveIcon from '@assets/icons/tab-diary-inactive.svg';
import TabHealthActiveIcon from '@assets/icons/tab-health-active.svg';
import TabHealthInactiveIcon from '@assets/icons/tab-health-inactive.svg';
import TabProfileActiveIcon from '@assets/icons/tab-profile-active.svg';
import TabProfileInactiveIcon from '@assets/icons/tab-profile-inactive.svg';
import TabStatsActiveIcon from '@assets/icons/tab-stats-active.svg';
import TabStatsInactiveIcon from '@assets/icons/tab-stats-inactive.svg';

const ICON_MAP: Record<string, { active: React.FC<any>; inactive: React.FC<any> }> = {
  health: { active: TabHealthActiveIcon, inactive: TabHealthInactiveIcon },
  diary: { active: TabDiaryActiveIcon, inactive: TabDiaryInactiveIcon },
  statistics: { active: TabStatsActiveIcon, inactive: TabStatsInactiveIcon },
  profile: { active: TabProfileActiveIcon, inactive: TabProfileInactiveIcon },
};

const LABEL_MAP: Record<string, string> = {
  health: "Здоров'я",
  diary: 'Щоденник',
  statistics: 'Статистика',
  profile: 'Профіль',
};

const ICON_SIZE = 24;
const TAB_WIDTH = 68;

export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const translateX = useSharedValue(0);
  const tabXPositions = useRef<number[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    const x = tabXPositions.current[state.index];
    if (x !== undefined) {
      const centerX = x + TAB_WIDTH / 2 - TAB_WIDTH / 2;
      if (!isInitialized.current) {
        translateX.value = centerX;
        isInitialized.current = true;
      } else {
        translateX.value = withSpring(centerX, { damping: 50, stiffness: 280 });
      }
    }
  }, [state.index, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleTabLayout = (index: number, isFocused: boolean) => (e: LayoutChangeEvent) => {
    const { x } = e.nativeEvent.layout;
    tabXPositions.current[index] = x;
    if (isFocused && !isInitialized.current) {
      translateX.value = x;
      isInitialized.current = true;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons = ICON_MAP[route.name];
        const label = LABEL_MAP[route.name] ?? route.name;

        if (!icons) return null;

        const IconComponent = isFocused ? icons.active : icons.inactive;

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            onLayout={handleTabLayout(index, isFocused)}
            style={styles.tab}>
            <Animated.View
              key={isFocused ? 'active' : 'inactive'}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}>
              <IconComponent
                width={ICON_SIZE}
                height={ICON_SIZE}
                color={isFocused ? '#00343E' : '#707070'}
              />
            </Animated.View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create(({ colors }, rt) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: rt.insets.bottom > 0 ? rt.insets.bottom : 16,
    backgroundColor: colors.bg.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  indicator: {
    position: 'absolute',
    top: 16,
    width: TAB_WIDTH,
    height: ICON_SIZE + 20,
    borderRadius: 9999,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    width: TAB_WIDTH,
    gap: 2,
  },
  label: {
    fontFamily: 'PTSans',
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary[100],
    fontWeight: '700',
  },
}));
