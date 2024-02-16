"use client";

import eventsSlice from "./events/store";
import couponsSlice from "./coupons/store";
import servicesSlice from "./services/store";
import { createGlobalStoreContext } from "zimmer-context";

export const { ContextProvider, useStoreContext } = createGlobalStoreContext(
  {
    events: eventsSlice,
    coupons: couponsSlice,
    services: servicesSlice,
  },
  {
    version: 10,
  },
);
