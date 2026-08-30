import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import type { ApiError } from '@/types';

/**
 * Generic hook for GET requests with TanStack Query.
 */
export function useApiQuery<T>(
  key: string[],
  url: string,
  options?: Omit<UseQueryOptions<T, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T, AxiosError<ApiError>>({
    queryKey: key,
    queryFn: () => api.get<T>(url),
    ...options,
  });
}

/**
 * Generic hook for mutation requests (POST, PUT, PATCH, DELETE).
 */
export function useApiMutation<TData, TVariables>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options?: UseMutationOptions<TData, AxiosError<ApiError>, TVariables>,
) {
  return useMutation<TData, AxiosError<ApiError>, TVariables>({
    mutationFn: (variables) => {
      if (method === 'delete') {
        return api.delete<TData>(url);
      }
      return api[method]<TData>(url, variables);
    },
    ...options,
  });
}
