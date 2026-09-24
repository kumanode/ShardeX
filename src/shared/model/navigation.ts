import { create } from "zustand";
import type { Section } from "../types";

/// App-level navigation state (active sidebar section & sub-tabs).
type NavState = {
  section: Section;
  setSection: (section: Section) => void;
  proxyTab: "list" | "proxyshard";
  setProxyTab: (tab: "list" | "proxyshard") => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export const useNav = create<NavState>((set) => ({
  section: "browsers",
  setSection: (section) => {
    if (section === "proxyshard") {
      set({ section: "proxies", proxyTab: "proxyshard" });
    } else {
      set({ section });
    }
  },
  proxyTab: "list",
  setProxyTab: (proxyTab) => set({ proxyTab }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}));
