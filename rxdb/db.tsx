"use client";

import { createBrowserSupabase } from "@/utils/supabase/browser";
import { RxCollectionCreator, createRxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { RxHookBuilder } from "@/rxdb-hooks/hooks";
import { CollectionsBuilder } from "@/rxdb-hooks/types";
import { toast } from "react-toastify";
import { addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { EventsReplication, eventsSchema } from "./schemas/public/events";
import { ServicesReplication, servicesSchema } from "./schemas/public/services";
import {
  TicketTypesReplication,
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
  // Remove database if there is one already, TODO: Not working, hot reloads still creates a new one
  await removeRxDatabase("mydatabase", storage);

  // Create your database
  const db = await createRxDatabase<Collections>({
    name: "mydatabase",
    storage: storage,
  });

  const myCollections = await db.addCollections(collections);

  // Create Replications with supabase
  const supabaseClient = createBrowserSupabase();
  const safeUserId =
    (await supabaseClient.auth.getUser()).data?.user?.id.replace("-", "") ||
    "anonymous";

  const servicesReplication = new ServicesReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.services,
    constraintMap: {
      services_unique_name_constraint: "Už máte predstavenie s týmto názvom",
    },
    replicationIdentifier:
      "services" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
    pull: {},
    push: {},
  });

  const eventsReplication = new EventsReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.events,
    replicationIdentifier:
      "events" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
    pull: {},
    push: {},
  });

  const ticketTypesReplication = new TicketTypesReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.ticket_types,
    replicationIdentifier:
      "ticket_types" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
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
