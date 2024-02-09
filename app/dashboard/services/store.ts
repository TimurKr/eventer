import { Services } from "@/utils/supabase/database.types";
import { createStoreSlice } from "@/utils/zustand";
import Fuse from "fuse.js";
import { fetchServices } from "../serverActions";

type State = {
  services: Services[];
  allServices: Services[];
  searchTerm: string;
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => void;
  search: (query: string, save?: boolean, services?: Services[]) => Services[];
};

const servicesSlice = createStoreSlice<State, Actions>((set, get) => ({
  services: [],
  allServices: [],
  searchTerm: "",
  isRefreshing: false,
  refresh: async () => {
    set((state) => {
      state.isRefreshing = true;
    });
    const r = await fetchServices();
    if (r.error) {
      console.error(r.error);
      return;
    }
    set((state) => {
      state.allServices = r.data;
      state.services = state.search(state.searchTerm, false, r.data);
      state.isRefreshing = false;
    });
  },
  search: (query, save = true, services) => {
    set((state) => {
      state.searchTerm = query;
    });
    let r = services || get().allServices;
    if (query) {
      const fuse = new Fuse(r, {
        keys: Object.keys(r[0]),
      });
      r = fuse.search(query).map((result) => result.item);
    }
    if (save) {
      set((state) => {
        state.services = r;
      });
    }
    return r;
  },
}));

export default servicesSlice;
