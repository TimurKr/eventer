import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "ticket_types",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "label": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "capacity": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: smallint. Default value: null",
      "type": "integer"
    },
    "price": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: real. Default value: null",
      "type": "number"
    },
    "is_vip": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: boolean. Default value: false",
      "type": "boolean",
      "default": "false"
    },
    "id": {
      "maxLength": 64,
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: gen_random_uuid()",
      "type": "string",
      "format": "uuid"
    },
    "service_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "label",
    "price",
    "service_id",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const ticketTypesSchema = toTypedRxJsonSchema(schemaLiteral);

export type TicketTypesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof ticketTypesSchema>;
export type TicketTypesDocument = RxDocument<TicketTypesDocumentType>;
export type TicketTypesCollection = RxCollection<TicketTypesDocumentType>;

