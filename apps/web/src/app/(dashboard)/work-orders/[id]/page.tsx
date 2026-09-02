'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import { DiagnosisForm } from '@/components/forms/diagnosis-form';
import { EstimateForm } from '@/components/forms/estimate-form';

interface User {
  id: string;
  name: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  details: any;
  createdAt: string;
  user?: User;
}

interface Diagnosis {
  id: string;
  problemFound: string;
  recommendation: string;
  severity: string;
  notes?: string;
  createdAt: string;
}

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

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  problem: string;
  priority: string;
  status: string;
  notes: string;
  createdAt: string;
  asset: { brand: string; model: string };
  customer: { firstName: string; lastName: string };
  technician?: User;
  timeline: TimelineEvent[];
}

const AVAILABLE_STATUSES = [
  'RECEIVED', 'DIAGNOSING', 'WAITING_FOR_APPROVAL', 'APPROVED',
  'WAITING_FOR_PARTS', 'IN_REPAIR', 'QUALITY_CHECK',
  'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'
];

export default function WorkOrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [assigningId, setAssigningId] = useState('');
  
  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showEstimateForm, setShowEstimateForm] = useState(false);

  const fetchWorkOrder = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ data: WorkOrder }>(`/work-orders/${id}`);
      setWorkOrder(res.data);
      setAssigningId(res.data.technician?.id || '');
    } catch (error) {
      console.error('Failed to fetch work order', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiagnosis = async () => {
    try {
      const res = await api.get<{ data: Diagnosis }>(`/diagnoses/work-order/${id}`);
      setDiagnosis(res.data);
    } catch (error) {
      console.error('Failed to fetch diagnosis', error);
    }
  };

  const fetchEstimates = async () => {
    try {
      const res = await api.get<{ data: Estimate[] }>(`/estimates/work-order/${id}`);
      setEstimates(res.data);
    } catch (error) {
      console.error('Failed to fetch estimates', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      setTechnicians([{ id: 'tech-1', name: 'John Doe (Tech)' }]);
    } catch (error) {
      console.error('Failed to fetch technicians', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkOrder();
      fetchTechnicians();
      fetchDiagnosis();
      fetchEstimates();
    }
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const note = prompt('Add an optional note for this status change:');
      await api.patch(`/work-orders/${id}/status`, { status: newStatus, note });
      fetchWorkOrder();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignTechnician = async () => {
    try {
      await api.patch(`/work-orders/${id}/assign`, { technicianId: assigningId });
      fetchWorkOrder();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to assign technician');
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!workOrder) return <div className="p-6">Work Order not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Work Order {workOrder.workOrderNumber}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Details and timeline.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {workOrder.status}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.customer.firstName} {workOrder.customer.lastName}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Asset</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.asset.brand} {workOrder.asset.model}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Problem Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {workOrder.problem}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Change Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm border bg-white"
                  value={workOrder.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  {AVAILABLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned Technician</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex space-x-2">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm border bg-white"
                  value={assigningId}
                  onChange={(e) => setAssigningId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button 
                  onClick={handleAssignTechnician}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Assign
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="bg-white shadow sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Diagnosis</h3>
          {!diagnosis && !showDiagnosisForm && (
            <button
              onClick={() => setShowDiagnosisForm(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Add Diagnosis
            </button>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5">
          {diagnosis ? (
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Problem Found</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{diagnosis.problemFound}</dd>
              </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Recommendation</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{diagnosis.recommendation}</dd>
              </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-500">Severity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800`}>
                    {diagnosis.severity}
                  </span>
                </dd>
              </div>
              {diagnosis.notes && (
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{diagnosis.notes}</dd>
                </div>
              )}
            </dl>
          ) : showDiagnosisForm ? (
            <div>
              <button 
                onClick={() => setShowDiagnosisForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                &larr; Cancel
              </button>
              <DiagnosisForm 
                workOrderId={id} 
                onSuccess={() => {
                  setShowDiagnosisForm(false);
                  fetchDiagnosis();
                }} 
              />
            </div>
          ) : (
             <p className="text-sm text-gray-500">No diagnosis recorded yet.</p>
          )}
        </div>
      </div>

      {/* Estimates Section */}
      <div className="bg-white shadow sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Estimates</h3>
          {!showEstimateForm && (
            <button
              onClick={() => setShowEstimateForm(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Create Estimate
            </button>
          )}
        </div>
        <div className="border-t border-gray-200 px-4 py-5">
          {showEstimateForm ? (
             <div>
               <button 
                 onClick={() => setShowEstimateForm(false)}
                 className="text-sm text-gray-500 hover:text-gray-700 mb-4"
               >
                 &larr; Cancel
               </button>
               <EstimateForm 
                 workOrderId={id} 
                 onSuccess={() => {
                   setShowEstimateForm(false);
                   fetchEstimates();
                 }} 
               />
             </div>
          ) : estimates.length > 0 ? (
            <ul className="space-y-4">
              {estimates.map(est => (
                <li key={est.id} className="border border-gray-200 rounded-md p-4 bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                      {est.status}
                    </span>
                    <p className="text-sm text-gray-700">Total: <span className="font-semibold">${est.total.toFixed(2)}</span></p>
                    <p className="text-xs text-gray-500 mt-1">Created: {new Date(est.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                     {est.status === 'DRAFT' && (
                       <button
                         onClick={async () => {
                           try {
                             await api.patch(`/estimates/${est.id}/status`, { status: 'SENT' });
                             fetchEstimates();
                           } catch (err) {
                             alert('Failed to send estimate');
                           }
                         }}
                         className="px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700"
                       >
                         Send to Customer
                       </button>
                     )}
                     <a href={`/customer/estimates/${est.id}`} target="_blank" rel="noreferrer" className="ml-3 text-sm text-blue-600 hover:underline">
                       Preview Customer Link
                     </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No estimates recorded yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Timeline</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5">
          <ul className="space-y-4">
            {workOrder.timeline.map((event) => (
              <li key={event.id} className="relative">
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                      <span className="text-blue-600 font-semibold text-xs">EV</span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{event.user?.name || 'System'}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleString()} - {event.type}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
