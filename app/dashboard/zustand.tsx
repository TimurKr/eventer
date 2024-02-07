"use client";

import { createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createContext, useContext, useEffect, useRef } from "react";

import * as EventsSlice from "./events/zustand";
import * as CouponsSlice from "./coupons/zustand";
import { SliceGenerator } from "@/utils/zustand";

function createGlobalStoreContext<
  StoreState extends { events: ES; coupons: CS },
  StoreActions extends { events: EA; coupons: CA },
  ES,
  EA,
  CS,
  CA,
>(storeSlice1: SliceGenerator<ES, EA>, storeSlice2: SliceGenerator<CS, CA>) {
  type StoreType = {
    events: StoreState["events"] & StoreActions["events"];
    coupons: StoreState["coupons"] & StoreActions["coupons"];
  };

  const createGlobalStore = (initStoreState?: Partial<StoreState>) => {
    return createStore<StoreType>()(
      persist(
        immer((set, get, store) => ({
          ...storeSlice1(store, "events", initStoreState?.events),
          ...storeSlice2(store, "coupons", initStoreState?.coupons),
        })),
        {
          name: "dashboard-store",
          version: 1,
          merge: (persistedState, defaultState) => {
            if (!persistedState || typeof persistedState !== "object") {
              return defaultState;
            }

            let resultState: StoreType = { ...defaultState };
            const keys = Object.keys(defaultState) as (keyof StoreType)[];

            keys.forEach((key) => {
              if (key in persistedState) {
                // @ts-ignore // TypeScript currently don't recognize that key exists in localState
                const state = persistedState[key];
                if (!!state) {
                  resultState = {
                    ...resultState,
                    [key]: { ...defaultState[key], ...state },
                  };
                }
              }
            });

            return resultState;
          },
        },
      ),
    );
  };

  type Store = ReturnType<typeof createGlobalStore>;

  const Context = createContext<Store | null>(null);

  return {
    ContextProvider: function DashboardContextProvider({
      children,
    }: {
      children: React.ReactNode;
    }) {
      const store = useRef(createGlobalStore()).current;

      return <Context.Provider value={store}>{children}</Context.Provider>;
    },

    useStoreContext: function useContextStore<U>(
      selector: (state: StoreType) => U,
    ) {
      const store = useContext(Context);
      if (!store) {
        throw new Error("useContextStore must be used within a context");
      }
      return useStore(store, selector);
    },
  };
}

export const { ContextProvider, useStoreContext } = createGlobalStoreContext(
  EventsSlice.storeSlice,
  CouponsSlice.storeSlice,
);
