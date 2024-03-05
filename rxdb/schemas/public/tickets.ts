import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication"

const schemaLiteral = {
  "title": "tickets",
  "description": "",
  "version": 0,
  "properties": {
    "id": {
      "maxLength": 64,
      "description": "Database type: uuid. Default value: gen_random_uuid()",
      "type": "string",
      "format": "uuid"
    },
    "created_at": {
      "description": "Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "price": {
      "description": "Database type: real. Default value: null",
      "type": "number"
    },
    "payment_status": {
      "description": "Database type: text. Default value: 'reserved'",
      "type": "string",
      "default": "'reserved'"
    },
    "note": {
      "description": "Database type: text. Default value: null",
      "type": "string"
    },
    "arrived": {
      "description": "Database type: boolean. Default value: false",
      "type": "boolean",
      "default": "false"
    },
    "guest_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "billing_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "coupon_created_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "coupon_redeemed_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "type_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "event_id": {
      "description": "Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "id",
    "price",
    "guest_id",
    "billing_id",
    "type_id",
    "event_id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const ticketsSchema = toTypedRxJsonSchema(schemaLiteral);

export type TicketsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof ticketsSchema>;
export type TicketsDocument = RxDocument<TicketsDocumentType>;
export type TicketsCollection = RxCollection<TicketsDocumentType>;

export type TicketsConstraints =
  | "public_tickets_billing_id_fkey"
  | "public_tickets_coupon_created_id_fkey"
  | "public_tickets_coupon_redeemed_id_fkey"
  | "public_tickets_event_id_fkey"
  | "public_tickets_guest_id_fkey"
  | "public_tickets_type_id_fkey"
  | "tickets_pkey";

export class TicketsReplication extends SupabaseReplication<
TicketsDocumentType,
TicketsConstraints
> {}