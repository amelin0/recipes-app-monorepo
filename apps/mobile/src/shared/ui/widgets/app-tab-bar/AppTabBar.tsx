import React from 'react';
import { Pressable, View } from 'react-native';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { SvgProps } from 'react-native-svg';

import { AppText, CountDot } from '@/shared/ui/components';
import { Haptics } from '@/shared/utils';

import BasketIcon from '../../../../../assets/icons/tab-bar/basket.svg';
import BookIcon from '../../../../../assets/icons/tab-bar/book.svg';
import CalendarIcon from '../../../../../assets/icons/tab-bar/calendar.svg';
import HomeDoorIcon from '../../../../../assets/icons/tab-bar/home-door.svg';
import StatusUpIcon from '../../../../../assets/icons/tab-bar/status-up.svg';

/** Map tab route name → icon. Update when adding/renaming tab routes. */
const ICON_BY_ROUTE: Record<string, React.FC<SvgProps>> = {
    home: HomeDoorIcon,
    recipes: BookIcon,
    'meal-plan': CalendarIcon,
    progress: StatusUpIcon,
    'shopping-list': BasketIcon,
};

/**
 * Floating liquid-glass bottom tab bar — RFDS `Tab Bar` (node 54642:1042):
 * blurred white-80 pill with the elements shadow; the active tab gets a soft
 * accent selection pill. Sits over the content, so scroll views behind it
 * need matching bottom padding.
 */
export const AppTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <View style={styles.pillShadow}>
                <View style={styles.pill}>
                    <BlurView intensity={30} tint="light" style={styles.blur} />
                    <View style={styles.fill} />
                    <View style={styles.row}>
                        {state.routes.map((route, index) => (
                            <TabCell
                                key={route.key}
                                name={route.name}
                                label={resolveLabel(descriptors, route.key, route.name)}
                                badge={resolveBadge(descriptors, route.key)}
                                isFocused={state.index === index}
                                onPress={() => handleTabPress(navigation, route, state.index === index)}
                                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                            />
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};

interface TabCellProps {
    name: string;
    label: string;
    badge?: number;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

const TabCell = ({ name, label, badge, isFocused, onPress, onLongPress }: TabCellProps) => {
    const { theme } = useUnistyles();
    const Icon = ICON_BY_ROUTE[name];
    const color = isFocused ? theme.colors.branding.accent : theme.colors.elements.primary;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={label}
            onPress={() => {
                Haptics.light();
                onPress();
            }}
            onLongPress={onLongPress}
            style={styles.cell}
        >
            {isFocused ? <View style={styles.selection} /> : null}
            {Icon ? <Icon width={20} height={20} color={color} /> : null}
            <AppText variant="buttonTab" numberOfLines={1} style={[styles.label, { color }]}>
                {label}
            </AppText>
            {badge ? <CountDot count={badge} style={styles.badge} /> : null}
        </Pressable>
    );
};

const resolveLabel = (descriptors: BottomTabBarProps['descriptors'], routeKey: string, fallback: string): string => {
    const opts = descriptors[routeKey]?.options;
    const raw = opts?.tabBarLabel ?? opts?.title ?? fallback;
    return typeof raw === 'string' ? raw : fallback;
};

const resolveBadge = (descriptors: BottomTabBarProps['descriptors'], routeKey: string): number | undefined => {
    const badge = descriptors[routeKey]?.options?.tabBarBadge;
    return typeof badge === 'number' ? badge : undefined;
};

const handleTabPress = (
    navigation: BottomTabBarProps['navigation'],
    route: BottomTabBarProps['state']['routes'][number],
    isFocused: boolean,
): void => {
    const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
    }
};

const styles = StyleSheet.create((theme, rt) => ({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: rt.insets.bottom > 0 ? rt.insets.bottom : theme.spacing[6],
    },
    pillShadow: {
        borderRadius: theme.radius.full,
        ...theme.shadow.elements,
    },
    pill: {
        borderRadius: theme.radius.full,
        overflow: 'hidden',
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
    },
    fill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.semantic.glassFill,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing[1],
    },
    cell: {
        width: 68,
        minHeight: 50,
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1],
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
    },
    selection: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.semantic.glassSelection,
    },
    label: {
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: 6,
        left: '50%',
        marginLeft: theme.spacing[2],
    },
}));
