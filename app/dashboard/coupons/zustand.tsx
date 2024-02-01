import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { createContext } from "react";
import Fuse from "fuse.js";
import { Coupons, fetchCoupons, insertCoupons } from "./serverActions";
import { InsertCoupons } from "@/utils/supabase/database.types";

function search(coupons: Coupons[], term: string): Coupons[] {
  if (term === "") {
    return coupons;
  }

  const fuse = new Fuse<Coupons>(coupons, {
    keys: ["code"],
    shouldSort: true,
  });

  return fuse.search(term).map((r) => r.item);
}

type State = {
  coupons: Coupons[];
  allCoupons: Coupons[];
  searchTerm: string;
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => Promise<void>;
  search: (term: string, allCoupons?: Coupons[]) => void;

  addCoupons: (coupons: InsertCoupons[]) => Promise<void>;
};

export type CouponsStore = ReturnType<typeof createCouponsStore>;

export const createCouponsStore = (props?: Partial<State>) => {
  const defaultProps: State = {
    coupons: [],
    allCoupons: [],
    searchTerm: "",
    isRefreshing: false,
  };
  return createStore<State & Actions>()(
    persist(
      immer((set, get) => ({
        ...defaultProps,
        ...props,
        refresh: async () => {
          set((state) => {
            state.isRefreshing = !state.isRefreshing;
          });
          const { data: allCoupons, error } = await fetchCoupons();
          if (error) {
            console.error(error);
          } else {
            set((state) => {
              state.allCoupons = allCoupons;
              state.isRefreshing = false;
              state.coupons = search(state.allCoupons, state.searchTerm);
            });
          }
        },

        search: (term, allCoupons) =>
          set((state) => {
            state.searchTerm = term;
            if (term === "") {
              state.coupons = allCoupons || state.allCoupons;
              return;
            }
            state.coupons = search(
              allCoupons || state.allCoupons,
              state.searchTerm,
            );
          }),

        addCoupons: async (coupons) => {
          const r = await insertCoupons(coupons);
          if (r.error) throw new Error(r.error.message);
          get().refresh();
        },
      })),
      {
        name: "coupons-store",
      },
    ),
  );
};

export const CouponsContext = createContext<CouponsStore | null>(null);
