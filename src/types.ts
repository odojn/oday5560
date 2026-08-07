export type Role = 'SUPER_ADMIN' | 'STORE_OWNER' | 'ACCOUNTANT' | 'INVENTORY_MANAGER';

export interface UserPermissions {
  viewPurchasePrice: boolean;      // رؤية سعر التكلفة والأرباح
  maxDiscountPercent: number;      // الحد الأقصى للخصم المسموح به (%)
  canChangePrices: boolean;        // إمكانية تغيير أسعار البيع يدوياً
  canDeleteSales: boolean;         // إمكانية حذف المبيعات أو إلغاء الفواتير
  canManageInventory: boolean;     // إدارة المنتجات إضافة وتعديل
  canViewReports: boolean;         // رؤية التقارير والتقارير المالية
  canManageDebts: boolean;         // إدارة الديون وتحصيل الدفعات
  canApplyLandingCost: boolean;    // إدخال مصاريف الشحن والجمارك لحساب التكلفة الحقيقي (AVCO)
}

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
  permissions?: UserPermissions;
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

export interface ProductUnit {
  id: string;
  unitName: string;          // اسم الوحدة: كرتونة، علبة، طرد، كيلو، جرام
  conversionFactor: number;  // معامل التحويل للوحدة الأساسية (مثلاً الكرتونة = 24 حبة)
  price: number;             // سعر بيع هذه الوحدة
  barcode?: string;          // باركود مخصص للوحدة
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  barcode?: string;
  description?: string;
  purchasePrice: number;     // سعر الشراء/التكلفة المرجح (AVCO)
  wholesalePrice: number;    // سعر الجملة
  retailPrice?: number;      // سعر المفرق
  quantity: number;          // الكمية المتاحة بالوحدة الأساسية
  baseUnit?: string;         // الوحدة الأساسية (حبة، قطعة، كيلو، جرام، لتر)
  units?: ProductUnit[];     // الوحدات الفرعية (كرتونة، علبة، كيلو...)
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
  quantity: number;          // الكمية المباعة بالوحدة المختارة
  price: number;             // سعر البيع المطبق
  unitName?: string;         // اسم الوحدة (مثلاً كرتونة أو علبة)
  conversionFactor?: number; // معامل التحويل للوحدة الأساسية
  baseQuantitySold?: number; // الكمية الصافية المخصومة من المخزون الأساسي (quantity * conversionFactor)
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
  enableMultiUOM?: boolean;        // تفعيل إدارة وحدات القياس المتعددة (كرتونة/علبة/حبة)
  costingMethod?: 'AVCO' | 'FIFO'; // طريقة حساب التكلفة (المتوسط المرجح AVCO)
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
