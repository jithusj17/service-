'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useSocketEvent } from '@/hooks/use-socket-event';
import { 
  Wrench, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  FileText
} from 'lucide-react';

interface DashboardMetrics {
  repairsToday: number;
  repairsThisMonth: number;
  revenue: number;
  pendingEstimates: number;
  repairsInProgress: number;
  readyForPickup: number;
  averageRepairTimeSeconds: number;
  technicianWorkload: { id: string; name: string; count: number }[];
  popularParts: { id: string; name: string; quantityUsed: number }[];
  lowStockItems: { id: string; name: string; stockQuantity: number; minStockQuantity: number }[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await api.get<DashboardMetrics>('/reports/dashboard');
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Listen to various domain events to keep the dashboard fresh
  useSocketEvent('workOrder.updated', fetchMetrics);
  useSocketEvent('estimate.updated', fetchMetrics);
  useSocketEvent('payment.received', fetchMetrics);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="p-8 text-red-500">Failed to load dashboard.</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Business Dashboard</h1>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Revenue (This Month)" 
          value={formatCurrency(metrics.revenue)} 
          icon={<DollarSign className="w-6 h-6 text-green-600" />} 
          bgColor="bg-green-50"
        />
        <StatCard 
          title="Repairs Today" 
          value={metrics.repairsToday.toString()} 
          icon={<Wrench className="w-6 h-6 text-blue-600" />} 
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="Repairs This Month" 
          value={metrics.repairsThisMonth.toString()} 
          icon={<Wrench className="w-6 h-6 text-indigo-600" />} 
          bgColor="bg-indigo-50"
        />
        <StatCard 
          title="Avg Repair Time" 
          value={formatDuration(metrics.averageRepairTimeSeconds)} 
          icon={<Clock className="w-6 h-6 text-purple-600" />} 
          bgColor="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="In Progress" 
          value={metrics.repairsInProgress.toString()} 
          icon={<Wrench className="w-6 h-6 text-orange-600" />} 
          bgColor="bg-orange-50"
        />
        <StatCard 
          title="Ready For Pickup" 
          value={metrics.readyForPickup.toString()} 
          icon={<CheckCircle className="w-6 h-6 text-teal-600" />} 
          bgColor="bg-teal-50"
        />
        <StatCard 
          title="Pending Estimates" 
          value={metrics.pendingEstimates.toString()} 
          icon={<FileText className="w-6 h-6 text-gray-600" />} 
          bgColor="bg-gray-50"
        />
      </div>

      {/* Detail Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Technician Workload */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-gray-400" />
            Technician Workload
          </h2>
          {metrics.technicianWorkload.length === 0 ? (
            <p className="text-sm text-gray-500">No active work orders.</p>
          ) : (
            <ul className="space-y-4">
              {metrics.technicianWorkload.map(tech => (
                <li key={tech.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{tech.name}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tech.count} tasks
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Popular Parts */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-gray-400" />
            Popular Parts
          </h2>
          {metrics.popularParts.length === 0 ? (
            <p className="text-sm text-gray-500">No parts used yet.</p>
          ) : (
            <ul className="space-y-4">
              {metrics.popularParts.map(part => (
                <li key={part.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{part.name}</span>
                  <span className="text-sm text-gray-500">{part.quantityUsed} used</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
            Low Stock Alerts
          </h2>
          {metrics.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500">All parts are sufficiently stocked.</p>
          ) : (
            <ul className="space-y-4">
              {metrics.lowStockItems.map(item => (
                <li key={item.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                    {item.stockQuantity} / {item.minStockQuantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: string, icon: React.ReactNode, bgColor: string }) {
  return (
    <div className="bg-white overflow-hidden rounded-lg shadow border border-gray-100">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${bgColor}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
