import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const { user } = useAuthStore();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
    onSuccess: () => { toast.success('تم تغيير كلمة المرور'); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: () => toast.error('فشل تغيير كلمة المرور'),
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    changePasswordMutation.mutate({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">المعلومات الشخصية</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500">الاسم</label>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">البريد الإلكتروني</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-gray-500">الدور</label>
            <p className="font-medium">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">تغيير كلمة المرور</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور الحالية</label>
            <input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">تأكيد كلمة المرور الجديدة</label>
            <input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <button type="submit" className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700">تغيير كلمة المرور</button>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">إعدادات الإشعارات</h3>
        <p className="text-sm text-gray-500">سيتم إضافة إعدادات الإشعارات في النسخة القادمة (البريد الإلكتروني، SMS، الإشعارات الفورية).</p>
      </div>
    </div>
  );
}
