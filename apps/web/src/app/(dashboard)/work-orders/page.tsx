'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import Link from 'next/link';
import { useSocketEvent } from '@/hooks/use-socket-event';

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  problem: string;
  priority: string;
  status: string;
  createdAt: string;
  asset: { brand: string; model: string };
  customer: { firstName: string; lastName: string };
  technician?: { name: string };
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkOrders = async () => {
    try {
      const res = await api.get<{ data: WorkOrder[] }>('/work-orders');
      setWorkOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch work orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  useSocketEvent('workOrder.updated', () => {
    console.log('Work order updated, refreshing list...');
    fetchWorkOrders();
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Work Orders (Repairs)</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : workOrders.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No work orders found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {workOrders.map((wo) => (
              <li key={wo.id} className="p-4 hover:bg-gray-50 transition">
                <Link href={`/work-orders/${wo.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {wo.workOrderNumber} - {wo.asset?.brand} {wo.asset?.model}
                      </p>
                      <p className="mt-1 text-sm text-gray-900 truncate">
                        {wo.customer?.firstName} {wo.customer?.lastName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 truncate">
                        {wo.problem}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 space-x-4">
                        <span>Priority: <span className="font-semibold">{wo.priority}</span></span>
                        <span>Tech: {wo.technician?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {wo.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
