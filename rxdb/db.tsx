"use client";

import { createBrowserSupabase } from "@/utils/supabase/browser";
import { RxCollectionCreator, createRxDatabase, removeRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

import { RxHookBuilder } from "@/rxdb-hooks/hooks";
import { CollectionsBuilder } from "@/rxdb-hooks/types";
import { toast } from "react-toastify";
import { addRxPlugin } from "rxdb";
import { RxDBCleanupPlugin } from "rxdb/plugins/cleanup";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration-schema";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { businessesSchema } from "./schemas/public/businesses";
import { ContactsReplication, contactsSchema } from "./schemas/public/contacts";
import { CouponsReplication, couponsSchema } from "./schemas/public/coupons";
import { EventsReplication, eventsSchema } from "./schemas/public/events";
import { ServicesReplication, servicesSchema } from "./schemas/public/services";
import {
  TicketTypesReplication,
  ticketTypesSchema,
} from "./schemas/public/ticket_types";
import { TicketsReplication, ticketsSchema } from "./schemas/public/tickets";

addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBCleanupPlugin);

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
  tickets: {
    schema: ticketsSchema,
  },
  businesses: {
    schema: businessesSchema,
  },
  contacts: {
    schema: contactsSchema,
  },
  coupons: {
    schema: couponsSchema,
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
  await removeRxDatabase("mydatabase", storage);

  // Create your database
  const db = await createRxDatabase<Collections>({
    name: "mydatabase",
    storage: storage,
    cleanupPolicy: {},
    eventReduce: true,
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

  const ticketsReplication = new TicketsReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.tickets,
    replicationIdentifier:
      "tickets" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
    pull: {},
    push: {},
  });

  const businessesReplication = new TicketsReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.businesses,
    replicationIdentifier:
      "businesses" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
    pull: {},
    push: {},
  });

  const contactsReplication = new ContactsReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.contacts,
    replicationIdentifier:
      "contacts" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
    onError: (error) => toast.error(error.message),
    conflictErrorMessage: `Pozor, konflikt so serverom. Prepisujem lokálne zmeny.`,
    pull: {},
    push: {},
  });

  const couponsReplication = new CouponsReplication({
    supabaseClient: supabaseClient,
    collection: myCollections.coupons,
    replicationIdentifier:
      "coupons" + process.env["NEXT_PUBLIC_SUPABASE_URL"]! + safeUserId,
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
      tickets: ticketsReplication,
      businesses: businessesReplication,
      contacts: contactsReplication,
      coupons: couponsReplication,
    },
  };
});
