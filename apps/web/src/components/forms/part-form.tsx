import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api-client';

const partSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  partNumber: z.string().optional(),
  supplierId: z.string().optional().or(z.literal('')),
  minStockQuantity: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  retailPrice: z.coerce.number().min(0).default(0),
});

type PartFormData = z.infer<typeof partSchema>;

export function PartForm({ part, suppliers, onSuccess, onCancel }: { part?: any; suppliers: any[]; onSuccess: () => void; onCancel: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PartFormData>({
    resolver: zodResolver(partSchema),
    defaultValues: part || {
      name: '',
      description: '',
      partNumber: '',
      supplierId: '',
      minStockQuantity: 0,
      costPrice: 0,
      retailPrice: 0,
    },
  });

  const onSubmit = async (data: PartFormData) => {
    try {
      const payload = {
        ...data,
        supplierId: data.supplierId === '' ? undefined : data.supplierId,
      };

      if (part) {
        await api.patch(`/parts/${part.id}`, payload);
      } else {
        await api.post('/parts', payload);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save part', error);
      alert('Failed to save part');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-md shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium leading-6 text-gray-900">
        {part ? 'Edit Part' : 'New Part'}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Part Name *</label>
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Part Number</label>
          <input
            {...register('partNumber')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Supplier</label>
        <select
          {...register('supplierId')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
        >
          <option value="">-- Select Supplier --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost Price ($)</label>
          <input
            type="number"
            step="0.01"
            {...register('costPrice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Retail Price ($)</label>
          <input
            type="number"
            step="0.01"
            {...register('retailPrice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Stock Alert</label>
          <input
            type="number"
            {...register('minStockQuantity')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
          />
        </div>
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
          {isSubmitting ? 'Saving...' : 'Save Part'}
        </button>
      </div>
    </form>
  );
}
