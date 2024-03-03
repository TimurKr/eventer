import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "events",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "datetime": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "is_public": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: boolean. Default value: false",
      "type": "boolean",
      "default": "false"
    },
    "service_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "id": {
      "maxLength": 64,
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: gen_random_uuid()",
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "datetime",
    "service_id",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const eventsSchema = toTypedRxJsonSchema(schemaLiteral);

export type EventsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof eventsSchema>;
export type EventsDocument = RxDocument<EventsDocumentType>;
export type EventsCollection = RxCollection<EventsDocumentType>;

