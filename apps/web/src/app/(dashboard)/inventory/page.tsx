'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { PartForm } from '@/components/forms/part-form';
import { SupplierForm } from '@/components/forms/supplier-form';
import { AdjustStockForm } from '@/components/forms/adjust-stock-form';

export default function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<'parts' | 'suppliers'>('parts');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory Management</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('parts')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'parts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Parts
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Suppliers
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'parts' && <PartsList />}
        {activeTab === 'suppliers' && <SuppliersList />}
      </div>
    </div>
  );
}

// ─── PARTS LIST ─────────────────────────────────────────────────────────────
function PartsList() {
  const [parts, setParts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockParts, setLowStockParts] = useState<any[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<any | null>(null);

  const fetchParts = async () => {
    try {
      const [partsRes, lowStockRes, suppRes] = await Promise.all([
        api.get<{ data: any[] }>('/parts'),
        api.get<any[]>('/parts/low-stock'),
        api.get<{ data: any[] }>('/suppliers'),
      ]);
      setParts(partsRes.data);
      setLowStockParts(lowStockRes || []);
      setSuppliers(suppRes.data);
    } catch (error) {
      console.error('Failed to fetch parts data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  return (
    <div className="space-y-6">
      {lowStockParts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Low Stock Alert ({lowStockParts.length} items)
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {lowStockParts.map(p => (
                    <li key={p.id}>
                      {p.name} - {p.stockQuantity} remaining (Min: {p.minStockQuantity})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showForm && !showAdjust && (
        <div className="flex justify-end">
          <button
            onClick={() => { setEditingPart(null); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition"
          >
            + Add Part
          </button>
        </div>
      )}

      {showForm && (
        <PartForm 
          part={editingPart} 
          suppliers={suppliers}
          onSuccess={() => { setShowForm(false); fetchParts(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showAdjust && (
        <AdjustStockForm
          partId={showAdjust}
          onSuccess={() => { setShowAdjust(null); fetchParts(); }}
          onCancel={() => setShowAdjust(null)}
        />
      )}

      {!showForm && !showAdjust && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading parts...</div>
          ) : parts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No parts found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{part.name}</div>
                      <div className="text-sm text-gray-500">{part.partNumber || 'No PN'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Cost: ${part.costPrice}</div>
                      <div className="text-sm text-gray-500">Retail: ${part.retailPrice}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${part.stockQuantity <= part.minStockQuantity ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {part.stockQuantity} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => { setEditingPart(part); setShowForm(true); }} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => setShowAdjust(part.id)} className="text-gray-600 hover:text-gray-900 font-semibold">Adjust Stock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SUPPLIERS LIST ─────────────────────────────────────────────────────────
function SuppliersList() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get<{ data: any[] }>('/suppliers');
      setSuppliers(res.data);
    } catch (error) {
      console.error('Failed to fetch suppliers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex justify-end">
          <button
            onClick={() => { setEditingSupplier(null); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition"
          >
            + Add Supplier
          </button>
        </div>
      )}

      {showForm && (
        <SupplierForm 
          supplier={editingSupplier}
          onSuccess={() => { setShowForm(false); fetchSuppliers(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No suppliers found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.contactName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => { setEditingSupplier(supplier); setShowForm(true); }} className="text-blue-600 hover:text-blue-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
