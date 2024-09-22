import { create } from "zustand";

export interface TooltipsState {
  show: boolean;
  setShowTooltips: (show: boolean) => void;
}

export const useShowHotkeys = create<TooltipsState>((set) => ({
  show: false,
  setShowTooltips: (show: boolean) => set({ show }),
}));
