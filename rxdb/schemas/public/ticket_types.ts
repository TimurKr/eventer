import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "ticket_types",
  description: "",
  version: 0,
  properties: {
    created_at: {
      description:
        "Database type: timestamp with time zone. Default value: now()",
      type: "string",
      format: "date-time",
    },
    label: {
      description: "Database type: text. Default value: null",
      type: "string",
    },
    capacity: {
      description: "Database type: smallint. Default value: null",
      type: "integer",
    },
    price: {
      description: "Database type: real. Default value: null",
      type: "number",
    },
    is_vip: {
      description: "Database type: boolean. Default value: false",
      type: "boolean",
      default: false,
    },
    id: {
      description: "Database type: uuid. Default value: gen_random_uuid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
    },
    service_id: {
      description: "Database type: uuid. Default value: null",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "services",
    },
  },
  required: ["label", "price", "id", "service_id"],
  type: "object",
  primaryKey: "id",
} as const;

export const ticketTypesSchema = toTypedRxJsonSchema(schemaLiteral);

export type TicketTypesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof ticketTypesSchema
>;
export type TicketTypesDocument = RxDocument<TicketTypesDocumentType>;
export type TicketTypesCollection = RxCollection<TicketTypesDocumentType>;

export type TicketTypesConstraints =
  | "public_ticket_types_service_id_fkey"
  | "ticket_types_pkey";

export class TicketTypesReplication extends SupabaseReplication<
  TicketTypesDocumentType,
  TicketTypesConstraints
> {}
