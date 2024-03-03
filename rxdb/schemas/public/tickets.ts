import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "tickets",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "id": {
      "maxLength": 64,
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: gen_random_uuid()",
      "type": "string",
      "format": "uuid"
    },
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "price": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: real. Default value: null",
      "type": "number"
    },
    "payment_status": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: 'reserved'",
      "type": "string",
      "default": "'reserved'"
    },
    "note": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "arrived": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: boolean. Default value: false",
      "type": "boolean",
      "default": "false"
    },
    "guest_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "billing_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "coupon_created_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "coupon_redeemed_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "type_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "event_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "price",
    "guest_id",
    "billing_id",
    "type_id",
    "event_id",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const ticketsSchema = toTypedRxJsonSchema(schemaLiteral);

export type TicketsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof ticketsSchema>;
export type TicketsDocument = RxDocument<TicketsDocumentType>;
export type TicketsCollection = RxCollection<TicketsDocumentType>;

