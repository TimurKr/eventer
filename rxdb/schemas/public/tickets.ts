import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "tickets",
  "description": "Missing description",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      "maxLength": 64
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "price": {
      "type": "number",
      "description": "Missing description. Database type: real. Default value: null"
    },
    "payment_status": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: 'reserved'"
    },
    "note": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "arrived": {
      "type": "boolean",
      "description": "Missing description. Database type: boolean. Default value: false"
    },
    "guest_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "billing_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "coupon_created_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "coupon_redeemed_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "type_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    }
  },
  "required": [
    "price",
    "guest_id",
    "billing_id",
    "type_id",
    "event_id"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

export const ticketsSchema = toTypedRxJsonSchema(schemaLiteral);

export type TicketsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof ticketsSchema>;
export type TicketsDocument = RxDocument<TicketsDocumentType>;
export type TicketsCollection = RxCollection<TicketsDocumentType>;

