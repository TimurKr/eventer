"use client";

import { createGlobalStoreContext } from "zimmer-context";
import couponsSlice from "./coupons/store";
import eventsSlice from "./events/store";
import servicesSlice from "./services/store";

export const { ContextProvider, useStoreContext } = createGlobalStoreContext(
  {
    events: eventsSlice,
    coupons: couponsSlice,
    services: servicesSlice,
  },
  // {
  //   persist: { version: 10 },
  // },
);
