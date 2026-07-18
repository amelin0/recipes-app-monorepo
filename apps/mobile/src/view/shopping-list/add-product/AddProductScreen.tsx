import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppInput, AppScreen, AppText, CircleBackButton } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';

import { ProductRow } from './components';
import { useAddProductScreen } from './useAddProductScreen';

export const AddProductScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping']);
    const { subtitle, query, setQuery, products, handleProductPress } = useAddProductScreen();

    return (
        <AppScreen>
            {/* У макеті хедер без кнопки назад — додаємо CircleBackButton, бо
                інакше з екрана немає виходу (свайп-бек ненадійний). */}
            <View style={styles.headerBar}>
                <CircleBackButton />
                <View style={styles.headerTexts}>
                    <AppText variant="titleMedium">{t('shopping:add.title')}</AppText>
                    <AppText variant="bodyMediumReg" color="tertiary">
                        {subtitle}
                    </AppText>
                </View>
            </View>

            <View style={styles.search}>
                <AppInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('shopping:add.search-placeholder')}
                    leftSlot={<SearchIcon width={20} height={20} color={theme.colors.semantic.darkGrey} />}
                    autoCorrect={false}
                    returnKeyType="search"
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductRow
                            key={product.key}
                            emoji={product.emoji}
                            name={product.name}
                            onPress={() => handleProductPress(product.key)}
                        />
                    ))
                ) : (
                    <AppText variant="bodyMediumReg" color="tertiary" style={styles.emptyText}>
                        {t('shopping:add.empty')}
                    </AppText>
                )}
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
        minHeight: 72,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    headerTexts: {
        flex: 1,
        gap: theme.spacing[1],
    },
    search: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    scroll: {
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[2],
        paddingBottom: theme.spacing[10],
        gap: theme.spacing[2],
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: theme.spacing[6],
    },
}));
