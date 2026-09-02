'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  customer: { firstName: string; lastName: string };
  workOrder?: { workOrderNumber: string };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await api.get<{ data: Invoice[] }>('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Failed to fetch invoices', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const simulatePayment = async (invoice: Invoice) => {
    try {
      // Send a fake webhook payload directly to our backend's webhook endpoint
      // bypassing the api client to inject custom headers for the signature
      const res = await fetch('http://localhost:3000/api/payments/webhook/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': 'mock_bypass_signature',
        },
        body: JSON.stringify({
          type: 'payment.success',
          data: {
            id: `txn_${Date.now()}`,
            amount: invoice.total,
            currency: 'USD',
            metadata: {
              invoiceId: invoice.id,
            }
          }
        })
      });

      if (!res.ok) throw new Error('Payment simulation failed');
      
      alert('Mock payment webhook sent successfully! Refreshing...');
      fetchInvoices();
    } catch (error) {
      console.error(error);
      alert('Failed to simulate payment');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invoices</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">WO: {inv.workOrder?.workOrderNumber || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{inv.customer.firstName} {inv.customer.lastName}</div>
                    <div className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${inv.total.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      inv.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                      inv.status === 'VOID' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    {(inv.status === 'ISSUED' || inv.status === 'PARTIALLY_PAID') && (
                      <button 
                        onClick={() => simulatePayment(inv)}
                        className="text-green-600 hover:text-green-900 font-semibold"
                      >
                        Simulate Payment Webhook
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
