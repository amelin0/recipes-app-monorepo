import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Button } from '@/shared/ui/components/buttons';
import { AppHeader } from '@/shared/ui/components/headers/AppHeader';
import { AppScreen } from '@/shared/ui/components/layouts/AppScreen';

import { useSignInScreen } from './useSignInScreen';

export const SignInScreen = () => {
  const { theme } = useUnistyles();
  const { email, setEmail, isValid, isLoading, handleNext, handleBack } = useSignInScreen();

  return (
    <AppScreen style={styles.screen}>
      {/* Header */}
      <AppHeader>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.gray[100]} />
          </Pressable>
          <Text style={styles.headerTitle}>Вхід</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </AppHeader>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.body}>
        {/* Description */}
        <Text style={styles.description}>
          Вкажіть свій E-mail. Переконайтеся, що маєте до нього доступ
        </Text>

        {/* Email input */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor={theme.colors.gray[30]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Next button */}
        <Button
          title="Далі"
          disabled={!isValid}
          isLoading={isLoading}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create(({ colors, typography, spacing }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.gray[100],
    textAlign: 'center',
    width: 180,
  },
  headerPlaceholder: {
    width: 24,
    height: 24,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  description: {
    ...typography.bodyLg,
    color: colors.gray[100],
    marginTop: spacing[4],
  },
  inputCard: {
    backgroundColor: colors.gray[10],
    borderRadius: 22,
    padding: spacing[4],
    marginTop: spacing[8],
  },
  input: {
    ...typography.bodyLg,
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    color: colors.gray[100],
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    marginBottom: spacing[10],
  },
}));
