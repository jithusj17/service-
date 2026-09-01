'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';

interface Estimate {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  laborItems: any[];
  parts: any[];
  createdAt: string;
}

export default function CustomerEstimateReviewPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEstimate = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: Estimate }>(`/estimates/${id}`);
      setEstimate(res.data);
    } catch (error) {
      console.error('Failed to fetch estimate', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEstimate();
  }, [id]);

  const handleAction = async (approved: boolean) => {
    try {
      await api.patch(`/estimates/${id}/approve`, { approved });
      alert(`Estimate ${approved ? 'approved' : 'rejected'} successfully.`);
      fetchEstimate();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to process approval');
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!estimate) return <div className="p-6">Estimate not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Estimate Review
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Review your repair estimate and approve to proceed.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {estimate.status}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Parts & Labor Summary</h4>
            <div className="text-sm text-gray-500">
              <p>Labor Items: {estimate.laborItems?.length || 0}</p>
              <p>Parts: {estimate.parts?.length || 0}</p>
            </div>
          </div>
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-2 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
              <dd className="text-sm text-gray-900">${estimate.subtotal.toFixed(2)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Tax</dt>
              <dd className="text-sm text-gray-900">${estimate.tax.toFixed(2)}</dd>
            </div>
            <div className="py-2 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Discount</dt>
              <dd className="text-sm text-red-600">-${estimate.discount.toFixed(2)}</dd>
            </div>
            <div className="py-3 flex justify-between border-t border-gray-300 mt-2 font-semibold">
              <dt className="text-base text-gray-900">Total</dt>
              <dd className="text-base text-gray-900">${estimate.total.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
        
        {/* Actions */}
        {(estimate.status === 'SENT' || estimate.status === 'VIEWED') && (
          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-3">
            <button
              onClick={() => handleAction(false)}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Reject Estimate
            </button>
            <button
              onClick={() => handleAction(true)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Approve Estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
