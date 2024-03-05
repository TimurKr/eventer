import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { RxCollection, RxDatabase, RxQuery } from "rxdb";
import { RxReplicationState } from "rxdb/plugins/replication";

export function RxHookBuilder<
  Collections extends { [P in CollectionKeys]: RxCollection },
  CollectionKeys extends keyof Collections,
>(
  dbInitializator: () => Promise<{
    db: RxDatabase<Collections>;
    replications: { [P in CollectionKeys]: RxReplicationState<any, any> };
  }>,
) {
  const Context = createContext<RxDatabase<Collections> | null>(null);

  console.log("\n\n\nCreated context!!!!!!!!!!!!!!!!!!\n\n\n");

  let dbPromise: ReturnType<typeof dbInitializator> | undefined;

  /**
   * Provides a database context for the application.
   *
   * @param handleOffline The callback function to handle offline events. Don't forget to use `useCallback`.
   * @param handleOnline The callback function to handle online events. Don't forget to use `useCallback`.
   */
  function DbProvider({
    children,
    handleOffline,
    handleOnline,
  }: PropsWithChildren<{
    handleOnline?: () => any;
    handleOffline?: () => any;
  }>) {
    "use client";

    const [db, setDb] = useState<RxDatabase<Collections> | null>(null);
    const [replications, setReplications] =
      useState<{ [P in CollectionKeys]: RxReplicationState<any, any> }>();

    useEffect(() => {
      function _handleOnline() {
        console.log("Online");
        handleOnline && handleOnline();
        if (replications) {
          for (const key in replications) {
            replications[key].reSync();
          }
        }
      }

      function _handleOffline() {
        handleOffline && handleOffline();
      }

      handleOnline && window.addEventListener("online", _handleOnline);
      handleOffline && window.addEventListener("offline", _handleOffline);
      return () => {
        handleOnline && window.removeEventListener("online", _handleOnline);
        handleOffline && window.removeEventListener("offline", _handleOffline);
      };
    }, [handleOffline, handleOnline, replications]);

    useEffect(() => {
      if (!dbPromise) {
        dbPromise = dbInitializator();
        dbPromise.then((r) => {
          setDb(r.db);
          setReplications(r.replications);
        });
        return () => {
          if (!dbPromise) return;
          console.log("I am canceling my subscriptions!");
          dbPromise.then((r) => {
            for (const key in r.replications) {
              r.replications[key].cancel();
            }
          });
        };
      }
    }, []);

    return <Context.Provider value={db}>{children}</Context.Provider>;
  }

  /**
   * Custom hook that returns the RxDB instance from the nearest DbProvider.
   * - Outside of a DbProvider -> throws an error
   * - Database not initialized yet -> returns null
   * - Database initialized -> returns the RxDB instance
   * @returns The RxDB instance, or null if loading.
   */
  function useRxDB() {
    const db = useContext(Context);
    if (db === undefined) {
      throw new Error("RxDB hooks must be used within a DbProvider");
    }
    return db;
  }

  /**
   * Custom hook that returns the RxCollection instance for a given collection name.
   * @param name The name of the collection.
   * @returns The RxCollection instance or null if the db is loading.
   */
  function useRxCollection<Key extends CollectionKeys>(
    name: Key,
  ): Collections[Key] | null {
    const [collection, setCollection] = useState<Collections[Key] | null>(null);
    const db = useRxDB();

    useEffect(() => {
      if (!db) {
        return;
      }
      const found = db[name];
      if (found) {
        setCollection(found);
      } else {
        throw new Error(
          `Collection ${name.toString()} not found in database. This needs to be implemented for Lazy collection loading.`,
        ); //TODO
      }
      // if (db.newCollections$) {  // TODO: Support Lazy collection adding
      //   const sub = db.newCollections$.subscribe((col) => {
      //     if (col[name]) {
      //       // We don't unsubscribe so that we get notified
      //       // and update collection if it gets deleted/recreated
      //       setCollection(col[name]);
      //     }
      //   });
      //   return () => {
      //     sub.unsubscribe();
      //   };
      // }
    }, [db, name]);

    return collection;
  }

  type State<Result> = {
    result: Result | undefined;
    isFetching: boolean;
  };

  enum ActionType {
    SET_RESULT = "SET_RESULT",
    SET_FETCHING = "SET_FETCHING",
  }

  type Action<Result> =
    | { type: ActionType.SET_RESULT; result: Result }
    | { type: ActionType.SET_FETCHING; isFetching: boolean };

  function reducer<Result>(
    state: State<Result>,
    action: Action<Result>,
  ): State<Result> {
    switch (action.type) {
      case ActionType.SET_RESULT:
        return { ...state, result: action.result, isFetching: false };
      case ActionType.SET_FETCHING:
        return { ...state, isFetching: action.isFetching };
      default:
        return state;
    }
  }

  /**
   * Custom hook for executing an RxQuery and managing its state.
   *
   * @param query The RxQuery instance to execute.
   * @returns result - The query result, or undefined if the query is still fetching.
   */
  function useRxQuery<DocType, Result>(
    query: RxQuery<DocType, Result, {}, any> | undefined,
  ) {
    const [state, dispatch] = useReducer(reducer<Result>, {
      result: undefined,
      isFetching: true,
    });

    useEffect(() => {
      if (!query) {
        return;
      }
      const subscription = query.$.subscribe((result) => {
        dispatch({ type: ActionType.SET_RESULT, result });
      });
      return () => subscription.unsubscribe();
    }, [query]);

    return state;
  }

  /**
   * Custom fully typed hook for subscribing to a query in RxCollection.
   *
   * @param collectionKey The name of the collection to query.
   * @param query The query function that takes the collection and returns an RxQuery.
   * @returns The state object containing the query result and fetch status.
   */
  function useRxData<CollectionKey extends CollectionKeys, Result>(
    collectionKey: CollectionKey,
    queryConstructor: (
      collection: Collections[CollectionKey],
    ) => RxQuery<
      Collections[CollectionKey] extends RxCollection<infer DocType>
        ? DocType
        : never,
      Result,
      {},
      any
    >,
  ) {
    const collection = useRxCollection(collectionKey);

    const _query = useMemo(
      () => (collection ? queryConstructor(collection) : undefined),
      [collection, queryConstructor],
    );

    return { collection, ...useRxQuery(_query) };
  }

  return {
    Context,
    DbProvider,
    useRxDB,
    useRxCollection,
    useRxQuery,
    useRxData,
  };
}
