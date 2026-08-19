import React from 'react';
import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import {
    AppButton,
    AppCard,
    AppScreen,
    AppText,
    ScreenActions,
    SegmentedControl,
    TopBar,
} from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { QUANTITY_KEYS, useSettingsUnitsScreen } from './useSettingsUnitsScreen';

/** Metric or imperial, per quantity (804:24715). */
export const SettingsUnitsScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const { quantities, units, select, handleSave } = useSettingsUnitsScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:units-screen.title')} />

            <View style={styles.content}>
                <AppCard style={styles.card}>
                    {quantities.map(quantity => (
                        <View key={quantity} style={styles.row}>
                            <AppText variant="bodySmallBold" style={styles.label}>
                                {t(`profile:units-screen.quantities.${QUANTITY_KEYS[quantity]}`)}
                            </AppText>
                            <SegmentedControl
                                tone="accent"
                                equalWidths
                                style={styles.control}
                                activeKey={units[quantity]}
                                onChange={key => select(quantity, key === 'imperial' ? 'imperial' : 'metric')}
                                items={[
                                    {
                                        key: 'metric',
                                        label: t(`profile:units-screen.metric.${QUANTITY_KEYS[quantity]}`),
                                    },
                                    {
                                        key: 'imperial',
                                        label: t(`profile:units-screen.imperial.${QUANTITY_KEYS[quantity]}`),
                                    },
                                ]}
                            />
                        </View>
                    ))}
                </AppCard>
            </View>

            <ScreenActions>
                <AppButton label={t('profile:settings.save')} onPress={handleSave} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
    },
    card: {
        alignItems: 'flex-start',
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        minHeight: 52,
        paddingHorizontal: theme.spacing[3],
    },
    label: {
        flex: 1,
        minWidth: 0,
    },
    control: {
        width: 120,
    },
}));
