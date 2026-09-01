'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface ServiceRequest {
  id: string;
  problemDescription: string;
  priority: string;
  state: string;
  createdAt: string;
  asset: {
    brand: string;
    model: string;
  };
  customer: {
    firstName: string;
    lastName: string;
  };
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: ServiceRequest[] }>('/service-requests');
      setRequests(res.data);
    } catch (error) {
      console.error('Failed to fetch service requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStateChange = async (id: string, newState: string) => {
    try {
      await api.patch(`/service-requests/${id}`, { state: newState });
      fetchRequests(); // Refresh data
    } catch (error) {
      console.error('Failed to update request state', error);
      alert('Failed to update state');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Service Requests</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No service requests found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {request.asset?.brand} {request.asset?.model} - {request.customer?.firstName} {request.customer?.lastName}
                    </p>
                    <p className="mt-1 text-sm text-gray-900 truncate">
                      {request.problemDescription}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                      <span>Priority: <span className="font-semibold">{request.priority}</span></span>
                      <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm bg-white border"
                      value={request.state}
                      onChange={(e) => handleStateChange(request.id, e.target.value)}
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CONVERTED_TO_WORK_ORDER">Work Order</option>
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
