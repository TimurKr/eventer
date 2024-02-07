import { Draft } from "immer";
import { Updater } from "use-immer";
import { Mutate, StoreApi, createStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type SliceGenerator<S, A> = <
  MS extends Mutate<
    StoreApi<{ [P in K]: S & A }>,
    [["zustand/immer", unknown]]
  >,
  K extends keyof ReturnType<MS["getState"]> & string,
>(
  fullStore: MS,
  key: K,
  initialOverride?: Partial<S>,
) => Record<K, S & A>;

export function createStoreSlice<State extends object, Actions extends object>(
  sliceTemplate: (
    set: Updater<State & Actions>,
    get: () => State & Actions,
  ) => State & Actions,
): SliceGenerator<State, Actions> {
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
  ): Record<K, State & Actions> => {
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
    return { [key]: slice } as Record<K, State & Actions>;
  };
}
