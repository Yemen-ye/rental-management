import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Payment } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import toast from 'react-hot-toast';

export function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, statusFilter],
    queryFn: () => api.get(`/payments?page=${page}&limit=20${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data),
  });

  const recordPayment = useMutation({
    mutationFn: (id: string) => api.post(`/payments/${id}/record-payment`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('تم تسجيل الدفعة'); },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border rounded-lg px-4 py-2 text-sm">
          <option value="">جميع المدفوعات</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="PAID">مدفوعة</option>
          <option value="OVERDUE">متأخرة</option>
        </select>
        <h2 className="text-xl font-semibold">المدفوعات</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المستأجر</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">المبلغ</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ الاستحقاق</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">تاريخ الدفع</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الحالة</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.data?.map((payment: Payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                <td className="px-4 py-3 text-sm">{formatDate(payment.dueDate)}</td>
                <td className="px-4 py-3 text-sm">{payment.paidDate ? formatDate(payment.paidDate) : '-'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payment.status)}`}>{payment.status}</span></td>
                <td className="px-4 py-3 text-sm">
                  {payment.status === 'PENDING' && (
                    <button onClick={() => recordPayment.mutate(payment.id)} className="text-green-600 hover:text-green-800">تسجيل الدفع</button>
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
