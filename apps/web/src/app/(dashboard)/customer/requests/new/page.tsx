'use client';

import React from 'react';
import { ServiceRequestForm } from '@/components/forms/service-request-form';
import { useRouter } from 'next/navigation';

export default function NewServiceRequestPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-semibold text-gray-900">Submit a Service Request</h1>
        <p className="mt-2 text-sm text-gray-500">
          Describe the issue with your asset and we will get back to you shortly.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ServiceRequestForm onSuccess={() => router.push('/customer/dashboard')} />
        </div>
      </div>
    </div>
  );
}
