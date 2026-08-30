'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useApiMutation } from '@/hooks/use-api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const mutation = useApiMutation<{ success: boolean }, { token: string; newPassword: string }>('post', '/auth/reset-password');

  // If no token is present, we shouldn't be here
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    setError(null);
    try {
      await mutation.mutateAsync({ token, newPassword: data.newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password.');
    }
  };

  if (success) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-green-600">Password Reset Successfully</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create new password</h1>
          <p className="text-gray-500 mt-2">Please enter your new password below.</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              disabled={!token}
              {...form.register('newPassword')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
            />
            {form.formState.errors.newPassword && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              disabled={!token}
              {...form.register('confirmPassword')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:text-sm"
            />
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || !token}
            className="w-full flex justify-center rounded-md border border-transparent bg-black py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none disabled:opacity-50"
          >
            {mutation.isPending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-black hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
