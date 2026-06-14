import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Tenant } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function TenantsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', idType: '', idNumber: '', nationality: '' });
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, search],
    queryFn: () => api.get(`/tenants?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/tenants', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tenants'] }); toast.success('تم إضافة المستأجر'); setShowForm(false); },
    onError: () => toast.error('فشل في إضافة المستأجر'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="بحث عن مستأجر..."
          className="border rounded-lg px-4 py-2 w-64 text-sm"
        />
        <button onClick={() => setShowForm(!showForm)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          {showForm ? 'إلغاء' : 'إضافة مستأجر'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">الاسم الأول *</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">اسم العائلة *</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الجوال</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نوع الهوية</label>
              <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="">اختر</option>
                <option value="National ID">هوية وطنية</option>
                <option value="Iqama">إقامة</option>
                <option value="Passport">جواز سفر</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">رقم الهوية</label>
              <input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700">حفظ</button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الاسم</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">البريد الإلكتروني</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">رقم الجوال</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الجنسية</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">عدد العقود</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((tenant: Tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{tenant.firstName} {tenant.lastName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tenant.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tenant.phone || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{tenant.nationality || '-'}</td>
                <td className="px-4 py-3 text-sm">{tenant._count?.leases || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tenant.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
