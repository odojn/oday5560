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
  fetchServerDB: () => Promise<void>;
  syncCloud: () => Promise<void>;
}

const pushToCloud = (getState: () => DBState) => {
  setTimeout(async () => {
    try {
      const state = getState();
      const payload = {
        users: state.users || [],
        stores: state.stores || [],
        categories: state.categories || [],
        products: state.products || [],
        sales: state.sales || [],
        expenses: state.expenses || [],
        damagedGoods: state.damagedGoods || [],
        customers: state.customers || [],
        suppliers: state.suppliers || [],
        debtRecords: state.debtRecords || [],
        debtPayments: state.debtPayments || [],
        settings: state.settings || {},
      };
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Sync push skipped (offline):', e);
    }
  }, 50);
};

export const useDB = create<DBState>()(
  persist(
    (set, get) => ({
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

      fetchServerDB: async () => {
        try {
          const res = await fetch('/api/db');
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              set((state) => {
                const currentUsers = state.users || [];
                const currentStores = state.stores || [];
                const incomingUsers = data.users || [];
                const incomingStores = data.stores || [];

                // Merge users without duplicates
                const userMap = new Map();
                currentUsers.forEach((u: User) => userMap.set(u.id || u.username, u));
                incomingUsers.forEach((u: User) => userMap.set(u.id || u.username, u));

                // Merge stores
                const storeMap = new Map();
                currentStores.forEach((s: Store) => storeMap.set(s.id, s));
                incomingStores.forEach((s: Store) => storeMap.set(s.id, s));

                return {
                  users: Array.from(userMap.values()),
                  stores: Array.from(storeMap.values()),
                  categories: data.categories?.length ? data.categories : state.categories,
                  products: data.products?.length ? data.products : state.products,
                  sales: data.sales?.length ? data.sales : state.sales,
                  expenses: data.expenses?.length ? data.expenses : state.expenses,
                  damagedGoods: data.damagedGoods?.length ? data.damagedGoods : state.damagedGoods,
                  customers: data.customers?.length ? data.customers : state.customers,
                  suppliers: data.suppliers?.length ? data.suppliers : state.suppliers,
                  debtRecords: data.debtRecords?.length ? data.debtRecords : state.debtRecords,
                  debtPayments: data.debtPayments?.length ? data.debtPayments : state.debtPayments,
                  settings: data.settings ? { ...state.settings, ...data.settings } : state.settings,
                };
              });
            }
          }
        } catch (err) {
          console.warn('Server sync failed, running in local persistent mode:', err);
        }
      },

      syncCloud: async () => {
        pushToCloud(get);
      },

      addUser: (user) => {
        set((state) => ({ users: [...state.users, user] }));
        pushToCloud(get);
      },
      updateUser: (id, data) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
        }));
        pushToCloud(get);
      },
      deleteUser: (id) => {
        set((state) => ({ users: state.users.filter(u => u.id !== id) }));
        pushToCloud(get);
      },

      addStore: (store) => {
        set((state) => ({ stores: [...state.stores, store] }));
        pushToCloud(get);
      },
      updateStore: (id, data) => {
        set((state) => ({
          stores: state.stores.map(s => s.id === id ? { ...s, ...data } : s)
        }));
        pushToCloud(get);
      },
      deleteStore: (id) => {
        set((state) => ({ stores: state.stores.filter(s => s.id !== id) }));
        pushToCloud(get);
      },

      addCategory: (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        pushToCloud(get);
      },
      updateCategory: (id, data) => {
        set((state) => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c)
        }));
        pushToCloud(get);
      },
      deleteCategory: (id) => {
        set((state) => ({ categories: state.categories.filter(c => c.id !== id) }));
        pushToCloud(get);
      },

      addProduct: (product) => {
        set((state) => ({ products: [...state.products, product] }));
        pushToCloud(get);
      },
      updateProduct: (id, data) => {
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
        }));
        pushToCloud(get);
      },
      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter(p => p.id !== id) }));
        pushToCloud(get);
      },

      addSale: (sale) => {
        set((state) => ({ sales: [...state.sales, sale] }));
        pushToCloud(get);
      },
      updateSale: (id, data) => {
        set((state) => ({
          sales: state.sales.map(s => s.id === id ? { ...s, ...data } : s)
        }));
        pushToCloud(get);
      },
      deleteSale: (id) => {
        set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
        pushToCloud(get);
      },

      addExpense: (expense) => {
        set((state) => ({ expenses: [...state.expenses, expense] }));
        pushToCloud(get);
      },
      
      addDamagedGood: (damaged) => {
        set((state) => ({ damagedGoods: [...state.damagedGoods, damaged] }));
        pushToCloud(get);
      },

      addCustomer: (customer) => {
        set((state) => ({ customers: [...(state.customers || []), customer] }));
        pushToCloud(get);
      },
      updateCustomer: (id, data) => {
        set((state) => ({
          customers: (state.customers || []).map(c => c.id === id ? { ...c, ...data } : c)
        }));
        pushToCloud(get);
      },
      deleteCustomer: (id) => {
        set((state) => ({ customers: (state.customers || []).filter(c => c.id !== id) }));
        pushToCloud(get);
      },

      addSupplier: (supplier) => {
        set((state) => ({ suppliers: [...(state.suppliers || []), supplier] }));
        pushToCloud(get);
      },
      updateSupplier: (id, data) => {
        set((state) => ({
          suppliers: (state.suppliers || []).map(s => s.id === id ? { ...s, ...data } : s)
        }));
        pushToCloud(get);
      },
      deleteSupplier: (id) => {
        set((state) => ({ suppliers: (state.suppliers || []).filter(s => s.id !== id) }));
        pushToCloud(get);
      },

      addDebtRecord: (debt) => {
        set((state) => ({ debtRecords: [...(state.debtRecords || []), debt] }));
        pushToCloud(get);
      },
      updateDebtRecord: (id, data) => {
        set((state) => ({
          debtRecords: (state.debtRecords || []).map(d => d.id === id ? { ...d, ...data } : d)
        }));
        pushToCloud(get);
      },
      deleteDebtRecord: (id) => {
        set((state) => ({ debtRecords: (state.debtRecords || []).filter(d => d.id !== id) }));
        pushToCloud(get);
      },

      addDebtPayment: (payment) => {
        set((state) => {
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
        });
        pushToCloud(get);
      },

      updateSettings: (storeId, newSettings) => {
        set((state) => ({
          settings: { ...state.settings, [storeId]: newSettings }
        }));
        pushToCloud(get);
      },
    }),
    {
      name: 'ode5-db-storage',
    }
  )
);
