"use client";

import { Draft } from "immer";
import { Updater } from "use-immer";
import { Mutate, StoreApi, createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createContext, useContext, useRef } from "react";

export type SliceGenerator<S extends object, A extends object> = ReturnType<
  typeof createStoreSlice<S, A>
>;

export function createStoreSlice<State extends object, Actions extends object>(
  sliceTemplate: (
    set: Updater<State & Actions>,
    get: () => State & Actions,
  ) => State & Actions,
) {
  return <
    MS extends Mutate<
      StoreApi<{ [P in K]: State & Actions }>,
      [["zustand/immer", unknown]]
    >,
    K extends keyof ReturnType<MS["getState"]> & string,
  >(
    fullStore: MS,
    key: K,
    initialOverride?: Partial<State>,
  ): State & Actions => {
    type S = ReturnType<MS["getState"]>;
    const set: Updater<State & Actions> = (updater) => {
      if (typeof updater === "function") {
        fullStore.setState((state) =>
          updater((state as S)[key] as Draft<State & Actions>),
        );
      } else {
        fullStore.setState({ [key]: updater } as Record<K, State & Actions>);
      }
    };
    const get = () => fullStore.getState()[key];

    const slice = { ...sliceTemplate(set, get), ...initialOverride };
    return slice as State & Actions;
  };
}

export function createGlobalStoreContext<
  Slices extends { [K in keyof Slices]: SliceGenerator<any, any> },
  StoreState extends { [K in keyof Slices]: ReturnType<Slices[K]> },
>(slices: Slices) {
  const createGlobalStore = (initStoreState?: Partial<StoreState>) => {
    return createStore<StoreState>()(
      persist(
        immer((set, get, store) => {
          let result: Partial<StoreState> = {};

          for (let key in slices) {
            const typedKey = key as keyof Slices;
            result[typedKey] = slices[typedKey](
              // @ts-ignore
              store,
              typedKey,
              initStoreState?.[typedKey],
            );
          }

          return result as StoreState;
        }),
        {
          name: "dashboard-store",
          version: 1,
          merge: (persistedState, defaultState) => {
            if (!persistedState || typeof persistedState !== "object") {
              return defaultState;
            }

            let resultState: StoreState = { ...defaultState };
            const keys = Object.keys(defaultState) as (keyof StoreState)[];

            keys.forEach((key) => {
              if (key in persistedState) {
                const state = (persistedState as Partial<StoreState>)[key];
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
    ContextProvider: ({
      children,
      initStoreState,
    }: {
      children: React.ReactNode;
      initStoreState?: Partial<StoreState>;
    }) => {
      "use client";

      const store = useRef(createGlobalStore(initStoreState)).current;

      return <Context.Provider value={store}>{children}</Context.Provider>;
    },

    useStoreContext: function useContextStore<U>(
      selector: (state: StoreState) => U,
    ) {
      const store = useContext(Context);
      if (!store) {
        throw new Error("useContextStore must be used within a context");
      }
      return useStore(store, selector);
    },
  };
}
