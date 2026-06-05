import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user: User, token: string) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      isAdmin: () => get().user?.role === 'ADMIN',

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        _hasHydrated: state._hasHydrated 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
