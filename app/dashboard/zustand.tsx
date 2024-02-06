"use client";

import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createContext, useEffect, useRef } from "react";

import * as EventsSlice from "./events/zustand";
import * as CouponsSlice from "./coupons/zustand";

type EventsStore = EventsSlice.State & EventsSlice.Actions;

type CouponsStore = CouponsSlice.State & CouponsSlice.Actions;

type StoreType = { events: EventsStore; coupons: CouponsStore };

type StoreState = { events: EventsSlice.State; coupons: CouponsSlice.State };

export const createDashboardStore = (initStoreState?: Partial<StoreState>) => {
  return createStore<StoreType>()(
    persist(
      immer((set, get, store) => ({
        events: {
          ...initStoreState?.events,
          ...EventsSlice.getActions<StoreType, "events">("events", [
            set,
            get,
            store,
          ]),
        },
        coupons: {
          ...initStoreState?.coupons,
          ...CouponsSlice.getActions<StoreType, "coupons">("coupons", [
            set,
            get,
            store,
          ]),
        },
      })),
      {
        name: "dashboard-store",
        version: 1,
      },
    ),
  );
};

type DashboardStore = ReturnType<typeof createDashboardStore>;

export const DashboardContext = createContext<DashboardStore | null>(null);

export default function DashboardContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = useRef(createDashboardStore()).current;
  useEffect(() => {
    const state = store.getState();
    state.events.refresh();
    state.coupons.refresh();
  }, []);

  return (
    <DashboardContext.Provider value={store}>
      {children}
    </DashboardContext.Provider>
  );
}
