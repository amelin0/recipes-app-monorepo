import { useRouter } from 'expo-router';

import { AuthStorage } from '@/data/local/domains/auth/auth-storage';
import { useStore } from '@/state/store';

export const useLogout = () => {
  const router = useRouter();
  const reset = useStore((s) => s.reset);

  const logout = async () => {
    await AuthStorage.removeTokens();
    reset();
    router.replace('/(app)/(auth)');
  };

  return { logout };
};
