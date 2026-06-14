import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
  { path: '/properties', label: 'العقارات', icon: '🏢' },
  { path: '/tenants', label: 'المستأجرين', icon: '👥' },
  { path: '/leases', label: 'العقود', icon: '📋' },
  { path: '/payments', label: 'المدفوعات', icon: '💰' },
  { path: '/checks', label: 'الشيكات', icon: '🏦' },
  { path: '/notifications', label: 'الإشعارات', icon: '🔔' },
  { path: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, organization, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={`fixed top-0 right-0 z-40 h-screen w-64 bg-white border-l border-gray-200 shadow-sm transition-transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-bold text-primary-700">{organization?.name || 'نظام الإيجارات'}</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">&times;</button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(item.path)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-gray-500 text-xs">{user?.role === 'ORG_ADMIN' ? 'مدير المنظمة' : user?.role === 'MANAGER' ? 'مدير' : 'وكيل'}</p>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
              تسجيل خروج
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:mr-64">
        <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              ☰
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'نظام إدارة الإيجارات'}
            </h1>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' })}
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
