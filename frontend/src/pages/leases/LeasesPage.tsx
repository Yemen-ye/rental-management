import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Lease } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export function LeasesPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ unitId: '', tenantId: '', startDate: '', endDate: '', rentAmount: '', paymentFrequency: 'MONTHLY', paymentDay: '1', noticePeriodDays: '30' });
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: units } = useQuery({ queryKey: ['all-units'], queryFn: () => api.get('/properties').then((r) => {
    const allUnits = r.data.data?.flatMap((p: any) => p.units || []) || [];
    return allUnits;
  })});

  const { data: tenants } = useQuery({ queryKey: ['all-tenants'], queryFn: () => api.get('/tenants?limit=100').then((r) => r.data.data || []) });

  const { data, isLoading } = useQuery({
    queryKey: ['leases', page],
    queryFn: () => api.get(`/leases?page=${page}&limit=20`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/leases', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leases'] }); toast.success('تم إضافة العقد'); setShowForm(false); },
    onError: () => toast.error('فشل في إضافة العقد'),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/leases/${id}/terminate`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leases'] }); toast.success('تم إنهاء العقد'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, rentAmount: parseFloat(form.rentAmount), paymentDay: parseInt(form.paymentDay), noticePeriodDays: parseInt(form.noticePeriodDays) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">عقود الإيجار</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          {showForm ? 'إلغاء' : 'إضافة عقد'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الوحدة *</label>
              <select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">اختر الوحدة</option>
                {units?.filter((u: any) => u.status === 'AVAILABLE').map((unit: any) => (
                  <option key={unit.id} value={unit.id}>وحدة {unit.unitNumber} - {formatCurrency(unit.rentAmount)}/شهر</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المستأجر *</label>
              <select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">اختر المستأجر</option>
                {tenants?.map((tenant: any) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.firstName} {tenant.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">قيمة الإيجار *</label>
              <input value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البداية *</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ النهاية *</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">دورية السداد</label>
              <select value={form.paymentFrequency} onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="MONTHLY">شهري</option>
                <option value="QUARTERLY">ربع سنوي</option>
                <option value="SEMI_ANNUALLY">نصف سنوي</option>
                <option value="ANNUALLY">سنوي</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700">حفظ العقد</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المستأجر</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الوحدة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">قيمة الإيجار</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ البداية</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ النهاية</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((lease: Lease) => (
              <tr key={lease.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{lease.tenant?.firstName} {lease.tenant?.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{lease.unit?.property?.name} - {lease.unit?.unitNumber}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(lease.rentAmount)}</td>
                <td className="px-4 py-3 text-sm">{formatDate(lease.startDate)}</td>
                <td className="px-4 py-3 text-sm">{formatDate(lease.endDate)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lease.status)}`}>{lease.status}</span></td>
                <td className="px-4 py-3 text-sm">
                  {lease.status === 'ACTIVE' && (
                    <button onClick={() => { if (confirm('إنهاء العقد؟')) terminateMutation.mutate(lease.id); }} className="text-red-600 hover:text-red-800">إنهاء</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
