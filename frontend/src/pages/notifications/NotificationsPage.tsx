import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Notification } from '../../types';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data as Notification[]),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
  });

  const markAllRead = async () => {
    if (!data) return;
    for (const n of data.filter((n) => n.status === 'SENT')) {
      await markRead.mutateAsync(n.id);
    }
    toast.success('تم تحديد الكل كمقروء');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">الإشعارات</h2>
        <button onClick={markAllRead} className="text-sm text-primary-600 hover:text-primary-700">تحديد الكل كمقروء</button>
      </div>

      <div className="space-y-3">
        {data?.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد إشعارات</p>}
        {data?.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-colors ${notification.status === 'SENT' ? 'border-primary-200 bg-primary-50/30' : ''}`}
            onClick={() => markRead.mutate(notification.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-sm">{notification.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{notification.body}</p>
              </div>
              <div className="text-left text-xs text-gray-400">
                <p>{formatDate(notification.createdAt)}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{notification.channel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
