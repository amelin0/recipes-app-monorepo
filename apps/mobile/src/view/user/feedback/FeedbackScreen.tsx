import React from 'react';
import { ScrollView, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { AppButton, AppInput, AppScreen, OptionRow, ScreenActions, TopBar } from '@/shared/ui/components';
import { useAppTranslation } from '@/shared/utils/translations';

import { FEEDBACK_MAX_PHOTOS } from '../user.constants';

import { ErrorBanner, FormSection, PhotoPicker } from './components';
import { useFeedbackScreen } from './useFeedbackScreen';

/** Bug reports and ideas from the support section (804:25464). */
export const FeedbackScreen = () => {
    const { t } = useAppTranslation(['profile']);
    const {
        kinds,
        kind,
        selectKind,
        description,
        setDescription,
        descriptionError,
        counter,
        photos,
        addPhoto,
        removePhoto,
        email,
        setEmail,
        handleSubmit,
    } = useFeedbackScreen();

    return (
        <AppScreen>
            <TopBar title={t('profile:feedback.title')} />

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FormSection step={1} title={t('profile:feedback.kind-title')} required>
                    <View style={styles.options}>
                        {kinds.map(item => (
                            <OptionRow
                                key={item}
                                size="md"
                                title={t(`profile:feedback.kinds.${item}.title`)}
                                description={t(`profile:feedback.kinds.${item}.description`)}
                                selected={item === kind}
                                onPress={() => selectKind(item)}
                            />
                        ))}
                    </View>
                </FormSection>

                <FormSection step={2} title={t('profile:feedback.description-title')} required>
                    <AppInput
                        multiline
                        value={description}
                        onChangeText={setDescription}
                        counterText={counter}
                        invalid={descriptionError}
                        style={styles.description}
                    />
                    {descriptionError ? <ErrorBanner message={t('profile:feedback.description-error')} /> : null}
                </FormSection>

                <FormSection
                    step={3}
                    title={t('profile:feedback.photos-title')}
                    note={t('profile:feedback.photos-note', { count: FEEDBACK_MAX_PHOTOS })}
                >
                    <PhotoPicker
                        photos={photos}
                        maxPhotos={FEEDBACK_MAX_PHOTOS}
                        addLabel={t('profile:feedback.photos-add')}
                        addAccessibilityLabel={t('profile:feedback.photos-add-a11y')}
                        removeAccessibilityLabel={t('profile:feedback.photos-remove-a11y')}
                        onAdd={addPhoto}
                        onRemove={removePhoto}
                    />
                </FormSection>

                <FormSection step={4} title={t('profile:feedback.email-title')} note={t('profile:feedback.optional')}>
                    <AppInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t('profile:feedback.email-placeholder')}
                        supportingText={t('profile:feedback.email-hint')}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                    />
                </FormSection>
            </ScrollView>

            <ScreenActions>
                <AppButton label={t('profile:feedback.submit')} onPress={handleSubmit} fullWidth />
            </ScreenActions>
        </AppScreen>
    );
};

const styles = StyleSheet.create(theme => ({
    content: {
        gap: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[3],
        paddingBottom: theme.spacing[4],
    },
    options: {
        width: '100%',
        gap: theme.spacing[2],
    },
    description: {
        height: 124,
    },
}));
