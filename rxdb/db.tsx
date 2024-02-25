"use client";

import { createBrowserSupabase } from "@/utils/supabase/browser";
import { useEffect, useState } from "react";
import { RxDatabase, createRxDatabase, removeRxDatabase } from "rxdb";
import { Provider } from "rxdb-hooks";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { SupabaseReplication } from "@/rxdb/supabase-replication";
import { addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { EventsCollection, eventsSchema } from "./schemas/public/events";
import { ServicesCollection, servicesSchema } from "./schemas/public/services";
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);

type Collections = {
  services: ServicesCollection;
  events: EventsCollection;
};

async function initialize() {
  const storage = getRxStorageDexie();

  // Remove database if there is one already, TODO: Only in development
  await removeRxDatabase("mydatabase", storage);

  // Create your database
  const db = await createRxDatabase<Collections>({
    name: "mydatabase",
    storage: storage, // Uses IndexedDB
  });

  const myCollections = await db.addCollections({
    services: {
      schema: servicesSchema,
    },
    events: {
      schema: eventsSchema,
    },
  });

  const supabaseClient = createBrowserSupabase();

  const servicesReplication = new SupabaseReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.services,
    replicationIdentifier:
      "services" +
        process.env.NEXT_PUBLIC_SUPABASE_URL! +
        (await supabaseClient.auth.getUser()).data?.user.id.replace("-", "") ||
      "anonymous",
    pull: {},
    push: {},
  });

  const eventsReplication = new SupabaseReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.events,
    replicationIdentifier:
      "events" +
        process.env.NEXT_PUBLIC_SUPABASE_URL! +
        (await supabaseClient.auth.getUser()).data?.user.id.replace("-", "") ||
      "anonymous",
    pull: {},
    push: {},
  });

  return {
    db,
    replications: {
      services: servicesReplication,
      events: eventsReplication,
    },
  };
}

let dbPromise: ReturnType<typeof initialize> | undefined;

export default function LocalDbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [db, setDb] = useState<RxDatabase<Collections> | undefined>();

  useEffect(() => {
    // RxDB instantiation can be asynchronous
    if (!dbPromise) dbPromise = initialize();
    dbPromise.then((r) => setDb(r.db));
    // return () => {
    //   dbPromise.then((r) => {
    //     for (const replication of Object.values(r.replications)) {
    //       replication.cancel();
    //     }
    //   });
    // };
  }, []);

  // Until db becomes available, consumer hooks that
  // depend on it will still work, absorbing the delay
  // by setting their state to isFetching:true
  return <Provider db={db}>{children}</Provider>;
}
