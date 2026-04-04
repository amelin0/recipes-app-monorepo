import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        console.log('Query request error:', error);
        return failureCount < 2;
      }
    }
  }
});
