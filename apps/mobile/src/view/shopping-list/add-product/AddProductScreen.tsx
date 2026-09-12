import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppInput, AppScreen, AppText, QueryState, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import SearchIcon from '../../../../assets/icons/search.svg';
import ShrugMascot from '../../../../assets/images/brand/mascot-shrug.svg';

import { ProductRow } from './components';
import { useAddProductScreen } from './useAddProductScreen';

export const AddProductScreen = () => {
    const { theme } = useUnistyles();
    const { t } = useAppTranslation(['shopping']);
    const {
        query,
        setQuery,
        products,
        isLoading,
        isError,
        isEmpty,
        handleRetry,
        handleEndReached,
        handleProductPress,
    } = useAddProductScreen();

    return (
        <AppScreen>
            {/* Компактний нав-бар RFDS (686:26467): назад ліворуч, заголовок
                по центру, без підзаголовка з датою. */}
            <TopBar title={t('shopping:add.title')} />

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
                onScrollEndDrag={handleEndReached}
                onMomentumScrollEnd={handleEndReached}
            >
                {isEmpty ? (
                    <View style={styles.empty}>
                        <ShrugMascot width={200} height={200} />
                        <AppText variant="bodyMediumReg" color="tertiary" style={styles.emptyText}>
                            {t('shopping:add.empty')}
                        </AppText>
                    </View>
                ) : (
                    <QueryState isLoading={isLoading} isError={isError} onRetry={handleRetry} style={styles.stateBox}>
                        {products.map(product => (
                            <ProductRow
                                key={product.id}
                                // Продукт несе емодзі своєї полиці, власного —
                                // ні; без групи лишається нейтральна плитка.
                                emoji={product.group?.emoji ?? '🥄'}
                                name={product.name}
                                onPress={() => handleProductPress(product.id)}
                            />
                        ))}
                    </QueryState>
                )}
            </ScrollView>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
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
    stateBox: {
        flex: 0,
        paddingVertical: theme.spacing[8],
    },
    empty: {
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingTop: theme.spacing[4],
        width: '100%',
    },
    emptyText: {
        textAlign: 'center',
    },
}));
