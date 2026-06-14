import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Property } from '../../types';
import { getStatusColor, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function PropertiesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [form, setForm] = useState({ name: '', type: 'APARTMENT', address: '', city: '', area: '' });
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['properties', page],
    queryFn: () => api.get(`/properties?page=${page}&limit=20`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/properties', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); toast.success('تم إضافة العقار'); setShowForm(false); resetForm(); },
    onError: () => toast.error('فشل في إضافة العقار'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: Record<string, unknown> }) => api.put(`/properties/${data.id}`, data.body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); toast.success('تم تحديث العقار'); setEditing(null); setShowForm(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['properties'] }); toast.success('تم حذف العقار'); },
  });

  const resetForm = () => setForm({ name: '', type: 'APARTMENT', address: '', city: '', area: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, body: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (property: Property) => {
    setEditing(property);
    setForm({ name: property.name, type: property.type, address: property.address || '', city: property.city || '', area: property.area || '' });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">العقارات</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); resetForm(); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          {showForm ? 'إلغاء' : 'إضافة عقار'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">اسم العقار *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">النوع</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                <option value="APARTMENT">شقة</option>
                <option value="HOUSE">منزل</option>
                <option value="VILLA">فيلا</option>
                <option value="COMMERCIAL">تجاري</option>
                <option value="OFFICE">مكتب</option>
                <option value="WAREHOUSE">مستودع</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدينة</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">الحي</label>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">العنوان</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700">
            {editing ? 'تحديث' : 'حفظ'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الاسم</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">النوع</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المدينة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الوحدات</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((property: Property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{property.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{property.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{property.city || '-'}</td>
                <td className="px-4 py-3 text-sm">{property.totalUnits || 0}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(property.status)}`}>{property.status}</span>
                </td>
                <td className="px-4 py-3 text-sm space-x-2 space-x-reverse">
                  <button onClick={() => startEdit(property)} className="text-primary-600 hover:text-primary-800 ml-2">تعديل</button>
                  <button onClick={() => { if (confirm('متأكد من الحذف؟')) deleteMutation.mutate(property.id); }} className="text-red-600 hover:text-red-800">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.meta && (
          <div className="flex items-center justify-between p-4 border-t text-sm">
            <span>إجمالي {data.meta.total}</span>
            <div className="space-x-2 space-x-reverse">
              <button disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50">السابق</button>
              <button disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">التالي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
