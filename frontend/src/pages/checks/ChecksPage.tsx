import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Check } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export function ChecksPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaseId: '', paymentId: '', checkNumber: '', bankName: '', amount: '', issueDate: '', maturityDate: '' });
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ['checks', page],
    queryFn: () => api.get(`/checks?page=${page}&limit=20`).then((r) => r.data),
  });

  const { data: leases } = useQuery({
    queryKey: ['all-leases-simple'],
    queryFn: () => api.get('/leases?limit=100').then((r) => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/checks', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checks'] }); toast.success('تم إضافة الشيك'); setShowForm(false); },
    onError: () => toast.error('فشل في إضافة الشيك'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.post(`/checks/${id}/${action}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checks'] }); toast.success('تم تحديث حالة الشيك'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">الشيكات</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          {showForm ? 'إلغاء' : 'إضافة شيك'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">العقد *</label>
              <select value={form.leaseId} onChange={(e) => setForm({ ...form, leaseId: e.target.value })} className="w-full border rounded-lg px-3 py-2" required>
                <option value="">اختر العقد</option>
                {leases?.map((l: any) => (
                  <option key={l.id} value={l.id}>{l.tenant?.firstName} {l.tenant?.lastName} - {formatCurrency(l.rentAmount)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الشيك *</label>
              <input value={form.checkNumber} onChange={(e) => setForm({ ...form, checkNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم البنك *</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المبلغ *</label>
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الإصدار *</label>
              <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الاستحقاق *</label>
              <input type="date" value={form.maturityDate} onChange={(e) => setForm({ ...form, maturityDate: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700">حفظ</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">رقم الشيك</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">البنك</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المبلغ</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ الاستحقاق</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((check: Check) => (
              <tr key={check.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{check.checkNumber}</td>
                <td className="px-4 py-3 text-sm">{check.bankName}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(check.amount)}</td>
                <td className="px-4 py-3 text-sm">{formatDate(check.maturityDate)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(check.status)}`}>{check.status}</span></td>
                <td className="px-4 py-3 text-sm space-x-1 space-x-reverse">
                  {check.status === 'PENDING' && (
                    <>
                      <button onClick={() => statusMutation.mutate({ id: check.id, action: 'deposit' })} className="text-blue-600 hover:text-blue-800 ml-1">إيداع</button>
                    </>
                  )}
                  {check.status === 'DEPOSITED' && (
                    <>
                      <button onClick={() => statusMutation.mutate({ id: check.id, action: 'clear' })} className="text-green-600 hover:text-green-800 ml-1">مقبوض</button>
                      <button onClick={() => statusMutation.mutate({ id: check.id, action: 'bounce' })} className="text-red-600 hover:text-red-800">مرتجع</button>
                    </>
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
