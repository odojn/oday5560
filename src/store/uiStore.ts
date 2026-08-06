import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isMobileMode: boolean;
  toggleMobileMode: () => void;
  setMobileMode: (val: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobileMode: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      toggleMobileMode: () => set((state) => ({ isMobileMode: !state.isMobileMode })),
      setMobileMode: (val: boolean) => set({ isMobileMode: val }),
    }),
    {
      name: 'ode5-ui-storage',
    }
  )
);
