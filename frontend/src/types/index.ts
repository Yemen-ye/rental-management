export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'AGENT';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  settings: Record<string, unknown>;
}

export interface Property {
  id: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  area?: string;
  totalUnits: number;
  status: string;
  createdAt: string;
  units?: Unit[];
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number;
  rentAmount: number;
  securityDeposit: number;
  status: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
  nationality?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { leases: number };
}

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  paymentFrequency: string;
  paymentDay: number;
  status: string;
  autoRenewal: boolean;
  terms?: string;
  unit?: Unit & { property?: Property };
  tenant?: Tenant;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  paymentMethod?: string;
  referenceNumber?: string;
  lateFee: number;
  lease?: Lease & { tenant?: Tenant; unit?: Unit & { property?: Property } };
}

export interface Check {
  id: string;
  leaseId: string;
  paymentId: string;
  checkNumber: string;
  bankName: string;
  amount: number;
  issueDate: string;
  maturityDate: string;
  status: 'PENDING' | 'DEPOSITED' | 'BOUNCED' | 'CLEARED';
  notes?: string;
  lease?: Lease & { tenant?: Tenant };
  payment?: Payment;
}

export interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  status: string;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface DashboardSummary {
  properties: { total: number };
  units: { total: number; rented: number; available: number; occupancyRate: number };
  leases: { active: number; expiringSoon: number };
  tenants: { total: number };
  payments: { overdue: number };
  checks: { pending: number };
  revenue: { total: number };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginResponse {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}
