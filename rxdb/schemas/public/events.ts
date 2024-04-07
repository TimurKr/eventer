import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "events",
  description: "",
  version: 0,
  properties: {
    created_at: {
      description:
        "Database type: timestamp with time zone. Default value: now()",
      type: "string",
      format: "date-time",
    },
    datetime: {
      description:
        "Database type: timestamp with time zone. Default value: null",
      type: "string",
      format: "date-time",
    },
    is_public: {
      description: "Database type: boolean. Default value: false",
      type: "boolean",
      default: false,
    },
    service_id: {
      description: "Database type: uuid. Default value: null",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "services",
    },
    id: {
      description: "Database type: uuid. Default value: gen_random_uuid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
    },
    note: {
      description: "Database type: text. Default value: ''",
      type: "string",
      default: "",
    },
  },
  required: ["datetime", "service_id", "id"],
  type: "object",
  primaryKey: "id",
} as const;

export const eventsSchema = toTypedRxJsonSchema(schemaLiteral);

export type EventsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof eventsSchema
>;
export type EventsDocument = RxDocument<EventsDocumentType>;
export type EventsCollection = RxCollection<EventsDocumentType>;

export type EventsConstraints = "events_pkey" | "public_events_service_id_fkey";

export class EventsReplication extends SupabaseReplication<
  EventsDocumentType,
  EventsConstraints
> {}
