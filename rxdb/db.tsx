"use client";

import { createBrowserSupabase } from "@/utils/supabase/browser";
import { RxCollectionCreator, createRxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { CollectionsBuilder } from "@/rxdb-hooks/types";
import { SupabaseReplication } from "@/rxdb/supabase-replication";
import { addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxHookBuilder } from "../rxdb-hooks/hooks";
import { eventsSchema } from "./schemas/public/events";
import { servicesSchema } from "./schemas/public/services";
import { ticketTypesSchema } from "./schemas/public/ticket_types";
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);

const collections = {
  services: {
    schema: servicesSchema,
  },
  events: {
    schema: eventsSchema,
  },
  ticket_types: {
    schema: ticketTypesSchema,
  },
} satisfies Record<string, RxCollectionCreator>;

type Collections = CollectionsBuilder<typeof collections>;

export async function initialize() {
  const storage = getRxStorageDexie();

  // Remove database if there is one already, TODO: Only in development
  await removeRxDatabase("mydatabase", storage);

  console.log("Creating database...");
  // Create your database
  const db = await createRxDatabase<Collections>({
    name: "mydatabase",
    storage: storage, // Uses IndexedDB
  });
  console.log("Database created");

  console.log("Adding collections...");
  const myCollections = await db.addCollections(collections);
  console.log("Collections added");

  console.log("Creating Supabase client...");
  const supabaseClient = createBrowserSupabase();
  console.log("Supabase client created");

  console.log("Creating replications...");
  console.log("services...");
  const servicesReplication = new SupabaseReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.services,
    replicationIdentifier:
      "services" +
        process.env["NEXT_PUBLIC_SUPABASE_URL"]! +
        (await supabaseClient.auth.getUser()).data?.user?.id?.replace(
          "-",
          "",
        ) || "anonymous",
    pull: {
      batchSize: 2,
    },
    push: {},
  });

  console.log("events...");
  const eventsReplication = new SupabaseReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.events,
    replicationIdentifier:
      "events" +
        process.env["NEXT_PUBLIC_SUPABASE_URL"]! +
        (await supabaseClient.auth.getUser()).data?.user?.id?.replace(
          "-",
          "",
        ) || "anonymous",
    pull: {},
    push: {},
  });

  console.log("ticket types...");
  const ticketTypesReplication = new SupabaseReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.ticket_types,
    replicationIdentifier:
      "ticket_types" +
        process.env["NEXT_PUBLIC_SUPABASE_URL"]! +
        (await supabaseClient.auth.getUser()).data?.user?.id?.replace(
          "-",
          "",
        ) || "anonymous",
    pull: {},
    push: {},
  });
  console.log("Replications created");

  console.log("Returning database and replications");
  return {
    db,
    replications: {
      services: servicesReplication,
      events: eventsReplication,
      ticket_types: ticketTypesReplication,
    },
  };
}

const { Context, DbProvider, useRxDB, useRxCollection, useRxQuery } =
  RxHookBuilder(initialize);

export { Context, DbProvider, useRxCollection, useRxDB, useRxQuery };
