'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Asset {
  id: string;
  assetType: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  assets: Asset[];
}

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const res = await fetch(`http://localhost:3000/api/v1/customers/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
        }
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-red-500">Customer not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/customers" className="text-gray-500 hover:text-gray-700">
          &larr; Back to Customers
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer.firstName} {customer.lastName}
          </h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Edit Profile
          </button>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.phone || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.notes || 'No notes provided.'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Assets</h3>
          <button
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            onClick={() => alert('Asset creation modal would open here')}
          >
            Add Asset
          </button>
        </div>
        
        {customer.assets && customer.assets.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {customer.assets.map((asset) => (
              <li key={asset.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {asset.brand} {asset.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      Type: <span className="capitalize">{asset.assetType.toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end">
                    <p className="text-xs text-gray-500">
                      S/N: {asset.serialNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            This customer has no recorded assets.
          </div>
        )}
      </div>
    </div>
  );
}
