import type { PersistStorage } from "zustand/middleware";
import { parse, stringify } from "superjson";

export const storage: PersistStorage<unknown> = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return parse(str);
  },
  setItem: (name, value) => {
    localStorage.setItem(name, stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
};
