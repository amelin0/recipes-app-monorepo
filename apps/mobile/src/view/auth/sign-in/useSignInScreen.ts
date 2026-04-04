import { useState } from 'react';

import { useRouter } from 'expo-router';

import { useCheckEmail } from '@/state/domains/auth';

export const useSignInScreen = () => {
  const router = useRouter();
  const { checkEmail, isPending } = useCheckEmail();
  const [email, setEmail] = useState('');

  const isValid = email.trim().length > 0 && email.includes('@');

  const handleNext = async () => {
    if (!isValid) return;

    const result = await checkEmail({ email: email.trim() });

    if (result.exists) {
      router.push({ pathname: '/(app)/(auth)/enter-password', params: { email: email.trim() } });
    } else {
      // TODO: navigate to register flow
      router.push({ pathname: '/(app)/(auth)/enter-password', params: { email: email.trim() } });
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return {
    email,
    setEmail,
    isValid,
    isLoading: isPending,
    handleNext,
    handleBack,
  };
};
