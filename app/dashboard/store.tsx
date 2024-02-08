"use client";

import { createGlobalStoreContext } from "@/utils/zustand";
import eventsSlice from "./events/store";
import couponsSlice from "./coupons/store";

export const { ContextProvider, useStoreContext } = createGlobalStoreContext({
  events: eventsSlice,
  coupons: couponsSlice,
});
