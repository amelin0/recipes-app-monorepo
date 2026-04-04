import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { AppHeader } from '@/shared/ui/components/headers/AppHeader';
import { AppScreen } from '@/shared/ui/components/layouts/AppScreen';
import { Button } from '@/shared/ui/components/buttons';

import { useEnterPasswordScreen } from './useEnterPasswordScreen';

export const EnterPasswordScreen = () => {
  const { theme } = useUnistyles();
  const {
    password,
    setPassword,
    isPasswordVisible,
    togglePasswordVisibility,
    isValid,
    isLoading,
    error,
    handleLogin,
    handleBack,
  } = useEnterPasswordScreen();

  return (
    <AppScreen style={styles.screen}>
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
        <Text style={styles.description}>Щоб увійти в систему, вкажіть ваш пароль</Text>

        {/* Password input */}
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor={theme.colors.gray[30]}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />
            <Pressable onPress={togglePasswordVisibility} hitSlop={8} style={styles.eyeButton}>
              <MaterialIcons
                name={isPasswordVisible ? 'visibility' : 'visibility-off'}
                size={18}
                color={theme.colors.gray[60]}
              />
            </Pressable>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.spacer} />

        <Button
          title="Далі"
          disabled={!isValid}
          isLoading={isLoading}
          onPress={handleLogin}
          style={styles.loginButton}
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
    marginTop: spacing[4],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  input: {
    ...typography.bodyLg,
    flex: 1,
    color: colors.gray[100],
  },
  eyeButton: {
    marginLeft: spacing[2],
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error.default,
    marginTop: spacing[2],
  },
  spacer: {
    flex: 1,
  },
  loginButton: {
    marginBottom: spacing[10],
  },
}));
