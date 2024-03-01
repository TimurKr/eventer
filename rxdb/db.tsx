"use client";

import { createBrowserSupabase } from "@/utils/supabase/browser";
import { RxCollectionCreator, createRxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { RxHookBuilder } from "@/rxdb-hooks/hooks";
import { CollectionsBuilder } from "@/rxdb-hooks/types";
import { SupabaseReplication } from "@/rxdb/supabase-replication";
import { addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { EventsDocument, eventsSchema } from "./schemas/public/events";
import { ServicesDocument, servicesSchema } from "./schemas/public/services";
import {
  TicketTypesDocument,
  ticketTypesSchema,
} from "./schemas/public/ticket_types";

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

export const {
  Context,
  DbProvider,
  useRxDB,
  useRxCollection,
  useRxQuery,
  useRxData,
} = RxHookBuilder(async () => {
  const storage = getRxStorageDexie();

  // Remove database if there is one already, TODO: Only in development
  await removeRxDatabase("mydatabase", storage);

  // Create your database
  const db = await createRxDatabase<Collections>({
    name: "mydatabase",
    storage: storage,
  });

  const myCollections = await db.addCollections(collections);

  const supabaseClient = createBrowserSupabase();

  const servicesReplication = new SupabaseReplication<ServicesDocument>({
    supabaseClient: supabaseClient,
    collection: myCollections.services,
    replicationIdentifier:
      "services" +
        process.env["NEXT_PUBLIC_SUPABASE_URL"]! +
        (await supabaseClient.auth.getUser()).data?.user?.id?.replace(
          "-",
          "",
        ) || "anonymous",
    pull: {},
    push: {},
  });

  const eventsReplication = new SupabaseReplication<EventsDocument>({
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

  const ticketTypesReplication = new SupabaseReplication<TicketTypesDocument>({
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

  return {
    db,
    replications: {
      services: servicesReplication,
      events: eventsReplication,
      ticket_types: ticketTypesReplication,
    },
  };
});
