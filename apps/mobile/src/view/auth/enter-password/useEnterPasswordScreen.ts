import { useState } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useLogin } from '@/state/domains/auth';

export const useEnterPasswordScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { login, isPending, error } = useLogin();

  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isValid = password.length >= 6;

  const handleLogin = async () => {
    if (!isValid || !email) return;

    try {
      await login({ email, password });
      router.replace('/(app)/(home)');
    } catch {
      // error is captured in the hook
    }
  };

  const handleBack = () => router.back();

  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  return {
    email: email ?? '',
    password,
    setPassword,
    isPasswordVisible,
    togglePasswordVisibility,
    isValid,
    isLoading: isPending,
    error: error?.message ?? null,
    handleLogin,
    handleBack,
  };
};
