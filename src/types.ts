export type Role = 'SUPER_ADMIN' | 'STORE_OWNER' | 'ACCOUNTANT' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  username?: string;
  email?: string;
  role: Role;
  storeId?: string; // Null for SUPER_ADMIN
  password?: string;
  isSuspended?: boolean;
  suspendedReason?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Store {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  barcode?: string;
  description?: string;
  purchasePrice: number;
  wholesalePrice: number;
  retailPrice?: number;
  quantity: number;
  expiryDate?: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  company?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  price: number; // The price it was sold for
}

export interface Sale {
  id: string;
  storeId: string;
  type: 'RETAIL' | 'WHOLESALE' | 'GENERAL';
  paymentType?: 'CASH' | 'CREDIT' | 'CARD';
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerId?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  paidAmount?: number;
  debtAmount?: number;
  items: SaleItem[];
  totalAmount: number;
  totalProfit: number; // Calculated: totalAmount - (purchasePrice * quantity)
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  storeId: string;
  entityType: 'CUSTOMER' | 'SUPPLIER';
  entityId: string;
  entityName: string;
  saleId?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  notes?: string;
  createdAt: string;
  dueDate?: string;
}

export interface DebtPayment {
  id: string;
  storeId: string;
  debtId: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Expense {
  id: string;
  storeId: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface StoreSettings {
  currency: string;
}

export interface DamagedGood {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  lostValue: number;
  supplierCompany?: string;
  createdAt: string;
}
