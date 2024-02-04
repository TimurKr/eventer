import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { createContext } from "react";
import Fuse from "fuse.js";
import {
  Coupons,
  deleteCoupon,
  fetchCoupons,
  insertCoupons,
} from "./serverActions";
import { InsertCoupons } from "@/utils/supabase/database.types";
import moment from "moment";
import { validateCoupon } from "./utils";

function search(coupons: Coupons[], term: string): Coupons[] {
  if (term === "") {
    return coupons;
  }

  const fuse = new Fuse<Coupons>(coupons, {
    keys: [
      "code",
      ["created_from", "redeemed_from"].flatMap((key1) =>
        ["guest", "billing"].flatMap((key2) =>
          ["name", "email", "phone"].flatMap((key3) =>
            [key1, key2, key3].join("."),
          ),
        ),
      ),
    ].flat(),
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
  removeCoupon: (coupon: { id: Coupons["id"] }) => void;

  setPartialCoupon: (
    coupon: Partial<Coupons> & NonNullable<{ id: Coupons["id"] }>,
  ) => Promise<void>;
};

export type CouponsStore = ReturnType<typeof createCouponsStore>;

export const createCouponsStore = (props?: Partial<State>) => {
  const defaultProps = {
    // coupons: [],
    // allCoupons: [],
    searchTerm: "",
    isRefreshing: false,
  } as unknown as State;
  return createStore<State & Actions>()(
    persist(
      immer((set, get) => ({
        ...defaultProps,
        ...props,
        refresh: async () => {
          set((state) => {
            state.isRefreshing = !state.isRefreshing;
          });
          const fetchedCouponsResponse = await fetchCoupons();

          if (fetchedCouponsResponse.error) {
            throw new Error(fetchedCouponsResponse.error.message);
          } else {
            set((state) => {
              state.allCoupons = fetchedCouponsResponse.data.map((c) => ({
                ...c,
                validate() {
                  return (
                    this.amount > 0 &&
                    moment(this.valid_until).endOf("day").isAfter(moment())
                  );
                },
              }));
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
        removeCoupon: (coupon) => {
          set((state) => {
            state.allCoupons = state.allCoupons.filter(
              (c) => c.id !== coupon.id,
            );
            state.coupons = search(state.allCoupons, state.searchTerm);
          });
        },

        setPartialCoupon: async (coupon) => {
          set((state) => {
            const index = state.allCoupons.findIndex((c) => c.id === coupon.id);
            state.allCoupons[index] = { ...state.allCoupons[index], ...coupon };
            state.allCoupons[index].valid = validateCoupon(
              state.allCoupons[index],
            );
            state.coupons = search(state.allCoupons, state.searchTerm);
          });
        },
      })),
      {
        name: "coupons-store",
      },
    ),
  );
};

export const CouponsContext = createContext<CouponsStore | null>(null);
