import type { ReactNode } from "react";
import { createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

import type { AppStore } from "~/store/app-store";
import { createAppStore, initAppStore } from "~/store/app-store";

export type AppStoreApi = ReturnType<typeof createAppStore>;

export const AppStoreContext = createContext<AppStoreApi | undefined>(
  undefined,
);

export interface AppStoreProviderProps {
  children: ReactNode;
}

export default function AppStoreProvider({ children }: AppStoreProviderProps) {
  const storeRef = useRef<AppStoreApi>();
  if (!storeRef.current) {
    storeRef.current = createAppStore(initAppStore());
  }

  return (
    <AppStoreContext.Provider value={storeRef.current}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (store: AppStore) => T): T {
  const context = useContext(AppStoreContext);

  if (!context) {
    throw new Error(`useAppStore must be used within AppStoreProvider`);
  }

  return useStore(context, selector);
}
