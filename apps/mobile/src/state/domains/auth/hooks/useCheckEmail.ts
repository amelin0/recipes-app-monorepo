import { useMutation } from '@tanstack/react-query';

import { AuthApi } from '@/data/remote/domains/auth';
import type { CheckEmailRequest } from '@/data/remote/domains/auth';

export const useCheckEmail = () => {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: CheckEmailRequest) => AuthApi.checkEmail(data),
  });

  return { checkEmail: mutateAsync, isPending, error };
};
