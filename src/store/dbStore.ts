import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Store, Category, Product, Sale, Expense, DamagedGood, StoreSettings, Customer, Supplier, DebtRecord, DebtPayment } from '../types';

interface DBState {
  users: User[];
  stores: Store[];
  categories: Category[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  damagedGoods: DamagedGood[];
  customers: Customer[];
  suppliers: Supplier[];
  debtRecords: DebtRecord[];
  debtPayments: DebtPayment[];
  settings: Record<string, StoreSettings>; // Keyed by storeId

  // Actions
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addStore: (store: Store) => void;
  updateStore: (id: string, data: Partial<Store>) => void;
  deleteStore: (id: string) => void;

  addCategory: (category: Category) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addSale: (sale: Sale) => void;
  updateSale: (id: string, data: Partial<Sale>) => void;
  deleteSale: (id: string) => void;

  addExpense: (expense: Expense) => void;
  
  addDamagedGood: (damaged: DamagedGood) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addDebtRecord: (debt: DebtRecord) => void;
  updateDebtRecord: (id: string, data: Partial<DebtRecord>) => void;
  deleteDebtRecord: (id: string) => void;

  addDebtPayment: (payment: DebtPayment) => void;

  updateSettings: (storeId: string, settings: StoreSettings) => void;
}

export const useDB = create<DBState>()(
  persist(
    (set) => ({
      users: [
        {
          id: 'sample-user-owner-1',
          storeId: 'sample-store-1',
          username: 'oday_owner',
          email: 'owner@ode5.com',
          role: 'STORE_OWNER',
          password: 'ownerpass123',
          isSuspended: false,
          isDeleted: false,
        }
      ],
      stores: [
        {
          id: 'sample-store-1',
          name: 'متجر عدي للتجارة والمواد الغذائية',
          phone: '0791234567',
          email: 'owner@ode5.com',
          createdAt: new Date().toISOString(),
          isDeleted: false,
        }
      ],
      categories: [],
      products: [],
      sales: [],
      expenses: [],
      damagedGoods: [],
      customers: [],
      suppliers: [],
      debtRecords: [],
      debtPayments: [],
      settings: {},

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (id, data) => set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
      })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter(u => u.id !== id) })),

      addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),
      updateStore: (id, data) => set((state) => ({
        stores: state.stores.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      deleteStore: (id) => set((state) => ({ stores: state.stores.filter(s => s.id !== id) })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, data) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter(c => c.id !== id) })),

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, data) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
      })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter(p => p.id !== id) })),

      addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
      updateSale: (id, data) => set((state) => ({
        sales: state.sales.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      deleteSale: (id) => set((state) => ({ sales: state.sales.filter(s => s.id !== id) })),

      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      
      addDamagedGood: (damaged) => set((state) => ({ damagedGoods: [...state.damagedGoods, damaged] })),

      addCustomer: (customer) => set((state) => ({ customers: [...(state.customers || []), customer] })),
      updateCustomer: (id, data) => set((state) => ({
        customers: (state.customers || []).map(c => c.id === id ? { ...c, ...data } : c)
      })),
      deleteCustomer: (id) => set((state) => ({ customers: (state.customers || []).filter(c => c.id !== id) })),

      addSupplier: (supplier) => set((state) => ({ suppliers: [...(state.suppliers || []), supplier] })),
      updateSupplier: (id, data) => set((state) => ({
        suppliers: (state.suppliers || []).map(s => s.id === id ? { ...s, ...data } : s)
      })),
      deleteSupplier: (id) => set((state) => ({ suppliers: (state.suppliers || []).filter(s => s.id !== id) })),

      addDebtRecord: (debt) => set((state) => ({ debtRecords: [...(state.debtRecords || []), debt] })),
      updateDebtRecord: (id, data) => set((state) => ({
        debtRecords: (state.debtRecords || []).map(d => d.id === id ? { ...d, ...data } : d)
      })),
      deleteDebtRecord: (id) => set((state) => ({ debtRecords: (state.debtRecords || []).filter(d => d.id !== id) })),

      addDebtPayment: (payment) => set((state) => {
        const debtPayments = [...(state.debtPayments || []), payment];
        const debtRecords = (state.debtRecords || []).map(d => {
          if (d.id === payment.debtId) {
            const newPaid = d.paidAmount + payment.amount;
            const newRemaining = Math.max(0, d.totalAmount - newPaid);
            const status: 'PAID' | 'PARTIAL' | 'UNPAID' = newRemaining <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'UNPAID');
            return { ...d, paidAmount: newPaid, remainingAmount: newRemaining, status };
          }
          return d;
        });
        return { debtPayments, debtRecords };
      }),

      updateSettings: (storeId, newSettings) => set((state) => ({
        settings: { ...state.settings, [storeId]: newSettings }
      })),
    }),
    {
      name: 'ode5-db-storage',
    }
  )
);
