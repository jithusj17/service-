import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

interface LaborItem {
  id: string;
  name: string;
  hours: number;
  rate: number;
  total: number;
}

interface PartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export function EstimateForm({ workOrderId, onSuccess }: { workOrderId: string; onSuccess?: () => void }) {
  const [laborItems, setLaborItems] = useState<LaborItem[]>([]);
  const [parts, setParts] = useState<PartItem[]>([]);
  
  const [tax, setTax] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [expirationDate, setExpirationDate] = useState<string>('');
  
  const [subtotal, setSubtotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recalculate totals whenever items, tax, or discount change
  useEffect(() => {
    const laborTotal = laborItems.reduce((acc, item) => acc + (item.hours * item.rate), 0);
    const partsTotal = parts.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const newSubtotal = laborTotal + partsTotal;
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + tax - discount);
  }, [laborItems, parts, tax, discount]);

  const addLaborItem = () => {
    setLaborItems([
      ...laborItems, 
      { id: Date.now().toString(), name: '', hours: 1, rate: 0, total: 0 }
    ]);
  };

  const updateLaborItem = (id: string, field: keyof LaborItem, value: any) => {
    setLaborItems(laborItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.hours * updated.rate;
        return updated;
      }
      return item;
    }));
  };

  const removeLaborItem = (id: string) => {
    setLaborItems(laborItems.filter(item => item.id !== id));
  };

  const addPart = () => {
    setParts([
      ...parts, 
      { id: Date.now().toString(), name: '', quantity: 1, price: 0, total: 0 }
    ]);
  };

  const updatePart = (id: string, field: keyof PartItem, value: any) => {
    setParts(parts.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.price;
        return updated;
      }
      return item;
    }));
  };

  const removePart = (id: string) => {
    setParts(parts.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        workOrderId,
        laborItems,
        parts,
        subtotal,
        tax,
        discount,
        total,
        expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
      };

      await api.post('/estimates', submitData);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(err?.response?.data?.message || err.message || 'Failed to create estimate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Labor Items */}
      <div className="bg-gray-50 p-4 rounded-md border">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-900">Labor</h4>
          <button type="button" onClick={addLaborItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            + Add Labor
          </button>
        </div>
        {laborItems.map((item, index) => (
          <div key={item.id} className="flex space-x-2 mb-2 items-center">
            <input
              type="text"
              placeholder="Description"
              required
              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.name}
              onChange={(e) => updateLaborItem(item.id, 'name', e.target.value)}
            />
            <input
              type="number"
              placeholder="Hours"
              required min="0" step="0.1"
              className="w-20 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.hours}
              onChange={(e) => updateLaborItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
            />
            <input
              type="number"
              placeholder="Rate"
              required min="0" step="0.01"
              className="w-24 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.rate}
              onChange={(e) => updateLaborItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
            />
            <div className="w-20 text-right text-sm font-medium text-gray-700">
              ${item.total.toFixed(2)}
            </div>
            <button type="button" onClick={() => removeLaborItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
              &times;
            </button>
          </div>
        ))}
        {laborItems.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No labor items added.</p>}
      </div>

      {/* Parts */}
      <div className="bg-gray-50 p-4 rounded-md border">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-gray-900">Parts</h4>
          <button type="button" onClick={addPart} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            + Add Part
          </button>
        </div>
        {parts.map((item, index) => (
          <div key={item.id} className="flex space-x-2 mb-2 items-center">
            <input
              type="text"
              placeholder="Part Name / Number"
              required
              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.name}
              onChange={(e) => updatePart(item.id, 'name', e.target.value)}
            />
            <input
              type="number"
              placeholder="Qty"
              required min="1" step="1"
              className="w-20 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.quantity}
              onChange={(e) => updatePart(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
            />
            <input
              type="number"
              placeholder="Price"
              required min="0" step="0.01"
              className="w-24 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              value={item.price}
              onChange={(e) => updatePart(item.id, 'price', parseFloat(e.target.value) || 0)}
            />
            <div className="w-20 text-right text-sm font-medium text-gray-700">
              ${item.total.toFixed(2)}
            </div>
            <button type="button" onClick={() => removePart(item.id)} className="text-red-500 hover:text-red-700 p-1">
              &times;
            </button>
          </div>
        ))}
        {parts.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No parts added.</p>}
      </div>

      {/* Summary & Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Subtotal</span>
            <span className="text-sm text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-500">Tax ($)</label>
            <input
              type="number"
              min="0" step="0.01"
              className="w-24 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border text-right"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-500">Discount ($)</label>
            <input
              type="number"
              min="0" step="0.01"
              className="w-24 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-2 py-1 border text-right"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-semibold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Expiration Date (Optional)</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border max-w-xs"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || (laborItems.length === 0 && parts.length === 0)}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Create Estimate'}
      </button>
    </form>
  );
}
