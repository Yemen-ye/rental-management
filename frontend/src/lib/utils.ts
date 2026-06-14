import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ar-SA', { dateStyle: 'medium' }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    TERMINATED: 'bg-red-100 text-red-800',
    BOUNCED: 'bg-red-100 text-red-800',
    CLEARED: 'bg-green-100 text-green-800',
    DEPOSITED: 'bg-blue-100 text-blue-800',
    AVAILABLE: 'bg-green-100 text-green-800',
    RENTED: 'bg-blue-100 text-blue-800',
    MAINTENANCE: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}
