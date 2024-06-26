import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
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

  let dbPromise: ReturnType<typeof dbInitializator> | undefined;

  /**
   * Function that destroys the database and allows for reinitialization
   * on next mount of DbProvider. Always use this to delete your database,
   * if you want to reinitialize it. Example usage is for logout.
   */
  async function destroyDb() {
    if (!dbPromise) return;
    const { db } = await dbPromise;
    await db.remove();
    await db.destroy();
    dbPromise = undefined;
  }

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
      // Handle online/offline events

      // Timout to debounce offline events, since the user doesn't
      // need to know thy are offline immediately
      let offlineTimeout: NodeJS.Timeout | undefined;

      function _handleOnline() {
        console.debug("Online!");
        if (replications) {
          for (const key in replications) {
            replications[key].reSync();
          }
        }
        if (offlineTimeout) {
          clearTimeout(offlineTimeout);
          offlineTimeout = undefined;
          return;
        }
        handleOnline && handleOnline();
      }

      function _handleOffline() {
        console.debug("Offline!");
        if (!handleOffline) return;
        if (offlineTimeout) clearTimeout(offlineTimeout);
        offlineTimeout = setTimeout(() => {
          handleOffline();
          offlineTimeout = undefined;
        }, 3000);
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

  type QueryOptions<Result> = {
    /**
     * If you set hold to true, the result will stay undefined and isFetching set to true
     * until the hold changes to false. This is useful for preventing the component from
     * fetching the data when the query is not ready yet.
     */
    hold?: boolean;

    /**
     * Initial result to result
     */
    initialResult?: Result;
  };

  /**
   * Custom hook for executing an RxQuery and managing its state.
   *
   * @param query The RxQuery instance to execute.
   * @returns result - The query result, or undefined if the query is still fetching.
   */
  function useRxQuery<DocType, Result, Options extends QueryOptions<Result>>(
    query: RxQuery<DocType, Result, {}, any> | undefined,
    options?: Options,
  ) {
    type Returning = Options extends { initialResult: Result }
      ? Result
      : Result | undefined;

    const [state, setState] = useState<{
      result: Returning;
      isFetching: boolean;
    }>({
      result: options?.initialResult as Returning,
      isFetching: true,
    });

    useEffect(() => {
      if (!query) {
        return;
      }
      if (options?.hold) {
        return;
      }
      const subscription = query.$.subscribe((result) => {
        setState({ result: result as unknown as Returning, isFetching: false });
      });
      return () => {
        subscription.unsubscribe();
        setState((s) => ({ ...s, isFetching: true }));
      };
    }, [options?.hold, query]);

    return state;
  }

  /**
   * Custom fully typed hook for subscribing to a query in RxCollection.
   *
   * @param collectionKey The name of the collection to query.
   * @param query The query function that takes the collection and returns an RxQuery.
   * @returns undefined or initialResult while fetching, result of the query when fetched.
   */
  function useRxData<
    CollectionKey extends CollectionKeys,
    Result,
    Options extends QueryOptions<Result>,
  >(
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
    options?: Options,
  ) {
    const collection = useRxCollection(collectionKey);

    const _query = useMemo(
      () => (collection ? queryConstructor(collection) : undefined),
      [collection, queryConstructor],
    );

    return { collection, ...useRxQuery(_query, options) };
  }

  return {
    Context,
    DbProvider,
    useRxDB,
    useRxCollection,
    useRxQuery,
    useRxData,
    destroyDb,
  };
}
