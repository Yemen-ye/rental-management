import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { DashboardSummary, Payment, Lease } from '../../types';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.get('/dashboard/summary').then((r) => r.data.data as DashboardSummary),
  });

  const { data: upcomingPayments } = useQuery({
    queryKey: ['upcoming-payments'],
    queryFn: () => api.get('/dashboard/upcoming-payments').then((r) => r.data.data as Payment[]),
  });

  const { data: expiringLeases } = useQuery({
    queryKey: ['expiring-leases'],
    queryFn: () => api.get('/dashboard/expiring-leases').then((r) => r.data.data as Lease[]),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'العقارات', value: summary?.properties.total || 0, icon: '🏢', color: 'bg-blue-50 text-blue-600' },
    { label: 'الوحدات المؤجرة', value: summary?.units.rented || 0, icon: '🔑', color: 'bg-green-50 text-green-600' },
    { label: 'العقود النشطة', value: summary?.leases.active || 0, icon: '📋', color: 'bg-purple-50 text-purple-600' },
    { label: 'المستأجرين', value: summary?.tenants.total || 0, icon: '👥', color: 'bg-amber-50 text-amber-600' },
    { label: 'نسبة الإشغال', value: `${summary?.units.occupancyRate || 0}%`, icon: '📈', color: 'bg-teal-50 text-teal-600' },
    { label: 'الإيرادات', value: formatCurrency(summary?.revenue.total || 0), icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.color}`}>
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">المدفوعات القادمة</h2>
            <Link to="/payments" className="text-sm text-primary-600 hover:text-primary-700">عرض الكل</Link>
          </div>
          {(!upcomingPayments || upcomingPayments.length === 0) ? (
            <p className="text-gray-500 text-sm">لا توجد مدفوعات قادمة</p>
          ) : (
            <div className="space-y-3">
              {upcomingPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{payment.lease?.tenant?.firstName} {payment.lease?.tenant?.lastName}</p>
                    <p className="text-xs text-gray-500">{payment.lease?.unit?.property?.name} - وحدة {payment.lease?.unit?.unitNumber}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">{formatDate(payment.dueDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">العقود المنتهية قريباً</h2>
            <Link to="/leases" className="text-sm text-primary-600 hover:text-primary-700">عرض الكل</Link>
          </div>
          {(!expiringLeases || expiringLeases.length === 0) ? (
            <p className="text-gray-500 text-sm">لا توجد عقود تنتهي قريباً</p>
          ) : (
            <div className="space-y-3">
              {expiringLeases.slice(0, 5).map((lease) => (
                <div key={lease.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{lease.tenant?.firstName} {lease.tenant?.lastName}</p>
                    <p className="text-xs text-gray-500">{lease.unit?.property?.name} - وحدة {lease.unit?.unitNumber}</p>
                  </div>
                  <div className="text-left">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(lease.status)}`}>
                      {lease.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">ينتهي: {formatDate(lease.endDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
