import { Services } from "@/utils/supabase/database.types";
import { createStoreSlice } from "@/utils/zustand";

type State = {
  services: Services[];
  selectedService: Services | null;
};

type Actions = {
  selectService: (service: Services) => void;
};

const servicesSlice = createStoreSlice<State, Actions>((set, get) => ({
  services: [],
  selectedService: null,
  selectService: (service) => {
    set((state) => {
      state.selectedService = service;
    });
  },
}));

export default servicesSlice;
