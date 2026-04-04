import { useMutation } from '@tanstack/react-query';

import { AuthStorage } from '@/data/local/domains/auth/auth-storage';
import { AuthApi } from '@/data/remote/domains/auth';
import type { LoginRequest } from '@/data/remote/domains/auth';
import { useStore } from '@/state/store';

export const useLogin = () => {
  const switchAuthenticated = useStore((s) => s.switchAuthenticatedAction);

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: LoginRequest) => AuthApi.login(data),
    onSuccess: async (result) => {
      await AuthStorage.saveTokens({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      });
      switchAuthenticated(true);
    },
  });

  return { login: mutateAsync, isPending, error };
};
