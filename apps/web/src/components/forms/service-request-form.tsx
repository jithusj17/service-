import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { api } from '../../lib/api-client';

const serviceRequestSchema = z.object({
  assetId: z.string().min(1, 'Please select an asset'),
  problemDescription: z.string().min(10, 'Problem description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

interface Asset {
  id: string;
  brand: string;
  model: string;
}

export function ServiceRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    assetId: '',
    problemDescription: '',
    priority: 'MEDIUM',
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceRequestFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  useEffect(() => {
    // Fetch customer's assets
    const fetchAssets = async () => {
      try {
        const response = await api.get<{ data: Asset[] }>('/assets');
        setAssets(response.data);
      } catch (error) {
        console.error('Failed to load assets', error);
      } finally {
        setIsLoadingAssets(false);
      }
    };
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validData = serviceRequestSchema.parse(formData);

      await api.post('/service-requests', validData);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(err?.response?.data?.message || err.message || 'Failed to submit request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700">Select Asset *</label>
        {isLoadingAssets ? (
          <p className="text-sm text-gray-500 mt-1">Loading assets...</p>
        ) : (
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
            value={formData.assetId}
            onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
            required
          >
            <option value="" disabled>Select an asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.brand} {asset.model}
              </option>
            ))}
          </select>
        )}
        {errors.assetId && <p className="text-red-500 text-xs mt-1">{errors.assetId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Problem Description *</label>
        <textarea
          rows={4}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          value={formData.problemDescription}
          onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
          placeholder="Please describe the issue in detail..."
        />
        {errors.problemDescription && <p className="text-red-500 text-xs mt-1">{errors.problemDescription}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Priority</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoadingAssets}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
