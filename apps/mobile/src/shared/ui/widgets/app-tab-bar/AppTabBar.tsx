import React from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppText } from '@/shared/ui/components';
import { Haptics } from '@/shared/utils';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** Map tab route name → icon pair. Update when adding/renaming tab routes. */
const ICON_BY_ROUTE: Record<string, { focused: IconName; blurred: IconName }> = {
    home: { focused: 'home', blurred: 'home-outline' },
    'meal-plan': { focused: 'calendar', blurred: 'calendar-outline' },
    tracking: { focused: 'stats-chart', blurred: 'stats-chart-outline' },
    recipes: { focused: 'book', blurred: 'book-outline' },
    profile: { focused: 'person', blurred: 'person-outline' },
};

/**
 * Custom bottom tab bar. Placeholder icons from Ionicons — will be
 * replaced by SVG icons from the Figma design system.
 */
export const AppTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    return (
        <View style={styles.bar}>
            {state.routes.map((route, index) => (
                <TabCell
                    key={route.key}
                    name={route.name}
                    label={resolveLabel(descriptors, route.key, route.name)}
                    isFocused={state.index === index}
                    onPress={() => handleTabPress(navigation, route, state.index === index)}
                    onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                />
            ))}
        </View>
    );
};

interface TabCellProps {
    name: string;
    label: string;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

const TabCell = ({ name, label, isFocused, onPress, onLongPress }: TabCellProps) => {
    const { theme } = useUnistyles();
    const icons = ICON_BY_ROUTE[name];
    const color = isFocused ? theme.colors.branding.primary : theme.colors.semantic.darkGrey;

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
            {icons ? <Ionicons name={isFocused ? icons.focused : icons.blurred} size={24} color={color} /> : null}
            <AppText variant="buttonTab" numberOfLines={1} style={[styles.label, { color }]}>
                {label}
            </AppText>
        </Pressable>
    );
};

const resolveLabel = (descriptors: BottomTabBarProps['descriptors'], routeKey: string, fallback: string): string => {
    const opts = descriptors[routeKey]?.options;
    const raw = opts?.tabBarLabel ?? opts?.title ?? fallback;
    return typeof raw === 'string' ? raw : fallback;
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
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.background.screen,
        borderTopWidth: 1,
        borderTopColor: theme.colors.forms.lightBorder,
        paddingTop: theme.spacing[2],
        paddingHorizontal: theme.spacing[2],
        paddingBottom: rt.insets.bottom + theme.spacing[1],
    },
    cell: {
        minHeight: 50,
        minWidth: 56,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[1],
        borderRadius: theme.radius.full,
    },
    label: {
        textAlign: 'center',
    },
}));
