"use client";

import {
  createBrowserSupabase,
  getBrowserUser,
} from "@/utils/supabase/browser";
import { useEffect, useState } from "react";
import { RxDatabase, createRxDatabase } from "rxdb";
import { Provider } from "rxdb-hooks";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { SupabaseReplication } from "@/rxdb_tem/supabase-replication";
import { Tables } from "@/utils/supabase/database.types";
import { addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);

let dbPromise = null;

const servicesSchema = {
  title: "Service schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 40,
    },
    created_at: {
      type: "string",
    },
    name: {
      type: "string",
    },
    business_id: {
      type: "string",
    },
  },
  required: ["id", "created_at", "business_id", "name"],
};

async function initialize() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isDevelopment = process.env.ENVIRONMENT;
  // Create your database
  const db = await createRxDatabase<{ services: typeof servicesSchema }>({
    name: "mydatabase",
    storage: getRxStorageDexie(), // Uses IndexedDB
    ignoreDuplicate: isDevelopment === "development",
  });

  const myCollections = await db.addCollections({
    services: {
      schema: servicesSchema,
    },
  });
  const replication = new SupabaseReplication<Tables<"services">>({
    supabaseClient: createBrowserSupabase(),
    collection: myCollections.services,
    replicationIdentifier:
      process.env.NEXT_PUBLIC_SUPABASE_URL! +
        (await getBrowserUser())?.id.replace("-", "") || "anonymous",
    pull: {},
    push: {},
  });

  return db;
}

export default function LocalDbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [db, setDb] = useState<RxDatabase | undefined>();

  useEffect(() => {
    // RxDB instantiation can be asynchronous
    if (!dbPromise) dbPromise = initialize();
    dbPromise.then(setDb);
  }, []);

  // Until db becomes available, consumer hooks that
  // depend on it will still work, absorbing the delay
  // by setting their state to isFetching:true
  return <Provider db={db}>{children}</Provider>;
}
