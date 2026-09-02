import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api-client';

const adjustSchema = z.object({
  type: z.enum(['PURCHASE', 'ADJUSTMENT', 'USED_IN_REPAIR', 'RETURN', 'DAMAGE']),
  quantity: z.coerce.number().refine(val => val !== 0, 'Quantity cannot be 0'),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

export function AdjustStockForm({ partId, onSuccess, onCancel }: { partId: string; onSuccess: () => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      type: 'ADJUSTMENT',
      quantity: 1,
      notes: '',
    },
  });

  const onSubmit = async (data: AdjustFormData) => {
    try {
      await api.post(`/parts/${partId}/stock`, data);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to adjust stock', error);
      alert(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-md shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        Adjust Stock
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
          <select
            {...register('type')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
          >
            <option value="PURCHASE">Purchase (Add)</option>
            <option value="ADJUSTMENT">Adjustment (Add/Remove)</option>
            <option value="USED_IN_REPAIR">Used in Repair (Remove)</option>
            <option value="RETURN">Return (Add)</option>
            <option value="DAMAGE">Damage (Remove)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity Change *</label>
          <input
            type="number"
            {...register('quantity')}
            placeholder="e.g. 5 or -2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          <p className="text-xs text-gray-500 mt-1">Use negative values to deduct stock.</p>
          {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Reference ID (Work Order #, PO #)</label>
        <input
          {...register('referenceId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Submit Transaction'}
        </button>
      </div>
    </form>
  );
}
