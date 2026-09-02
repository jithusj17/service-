import React, { useState } from 'react';
import { z } from 'zod';
import { api } from '@/lib/api-client';

const diagnosisSchema = z.object({
  problemFound: z.string().min(1, 'Problem found is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  notes: z.string().optional(),
});

type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

export function DiagnosisForm({ workOrderId, onSuccess }: { workOrderId: string; onSuccess?: () => void }) {
  const [formData, setFormData] = useState<DiagnosisFormData>({
    problemFound: '',
    recommendation: '',
    severity: 'MEDIUM',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DiagnosisFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validData = diagnosisSchema.parse(formData);

      const submitData = {
        ...validData,
        workOrderId,
        attachments: [], // Simplified for now
      };

      await api.post('/diagnoses', submitData);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: any = {};
        err.errors.forEach((e) => {
          if (e.path[0]) fieldErrors[e.path[0]] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        alert(err?.response?.data?.message || err.message || 'Failed to create diagnosis');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium text-gray-700">Problem Found *</label>
        <textarea
          rows={3}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          value={formData.problemFound}
          onChange={(e) => setFormData({ ...formData, problemFound: e.target.value })}
        />
        {errors.problemFound && <p className="text-red-500 text-xs mt-1">{errors.problemFound}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Recommendation *</label>
        <textarea
          rows={3}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          value={formData.recommendation}
          onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
        />
        {errors.recommendation && <p className="text-red-500 text-xs mt-1">{errors.recommendation}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Severity</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes (Internal)</label>
        <textarea
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Diagnosis'}
      </button>
    </form>
  );
}
