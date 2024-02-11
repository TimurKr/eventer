import { Services } from "@/utils/supabase/database.types";
import Fuse from "fuse.js";
import { fetchServices, insertServices } from "./serverActions";
import { createStoreSlice } from "zimmer-context";

type State = {
  services: Services[];
  allServices: Services[];
  searchTerm: string;
  isRefreshing: boolean;
};

type Actions = {
  refresh: () => void;
  search: (query: string, save?: boolean, services?: Services[]) => Services[];

  addServices: (services: Services[]) => void;
  setPartialService: (
    service: Partial<Services> & NonNullable<{ id: Services["id"] }>,
  ) => void;
  removeService: (id: Services["id"]) => void;
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
  addServices: async (services) => {
    set((state) => {
      state.allServices = [...state.allServices, ...services].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      state.services = state.search(state.searchTerm, false, state.allServices);
    });
  },
  setPartialService: (service) => {
    set((state) => {
      const index = state.allServices.findIndex((s) => s.id === service.id);
      if (index === -1) {
        console.error("Service with id", service.id, "not found.");
        return;
      }
      state.allServices[index] = { ...state.allServices[index], ...service };
      state.services = state.search(state.searchTerm, false, state.allServices);
    });
  },
  removeService: (id) => {
    set((state) => {
      state.allServices = state.allServices.filter((s) => s.id !== id);
      state.services = state.search(state.searchTerm, false, state.allServices);
    });
  },
}));

export default servicesSlice;
