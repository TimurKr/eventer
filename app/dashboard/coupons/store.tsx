import Fuse from "fuse.js";
import { Coupons, fetchCoupons } from "./serverActions";
import moment from "moment";
import { validateCoupon } from "./utils";
import { createStoreSlice } from "zimmer-context";

function search(coupons: Coupons[], term: string): Coupons[] {
  if (term === "") {
    return coupons;
  }

  const fuse = new Fuse<Coupons>(coupons, {
    keys: [
      "code",
      "note",
      "amount",
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

  addCoupons: (coupons: Coupons[]) => void;
  removeCoupon: (coupon: { id: Coupons["id"] }) => void;

  setPartialCoupon: (
    coupon: Partial<Coupons> & NonNullable<{ id: Coupons["id"] }>,
  ) => Promise<void>;
};

const couponsSlice = createStoreSlice<State, Actions>((set, get) => ({
  coupons: [],
  allCoupons: [],
  searchTerm: "",
  isRefreshing: false,
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
      state.coupons = search(allCoupons || state.allCoupons, state.searchTerm);
    }),

  addCoupons: async (coupons) => {
    set((state) => {
      state.allCoupons = [...state.allCoupons, ...coupons];
      state.coupons = search(state.allCoupons, state.searchTerm);
    });
  },
  removeCoupon: (coupon) => {
    set((state) => {
      state.allCoupons = state.allCoupons.filter((c) => c.id !== coupon.id);
      state.coupons = search(state.allCoupons, state.searchTerm);
    });
  },

  setPartialCoupon: async (coupon) => {
    set((state) => {
      const index = state.allCoupons.findIndex((c) => c.id === coupon.id);
      state.allCoupons[index] = { ...state.allCoupons[index], ...coupon };
      state.allCoupons[index].valid = validateCoupon(state.allCoupons[index]);
      state.coupons = search(state.allCoupons, state.searchTerm);
    });
  },
}));

export default couponsSlice;
