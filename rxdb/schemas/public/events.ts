import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "events",
  "description": "Missing description",
  "properties": {
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "datetime": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "is_public": {
      "type": "boolean",
      "description": "Missing description. Database type: boolean. Default value: false"
    },
    "service_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      "maxLength": 64
    }
  },
  "required": [
    "datetime",
    "service_id"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

export const eventsSchema = toTypedRxJsonSchema(schemaLiteral);

export type EventsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof eventsSchema>;
export type EventsDocument = RxDocument<EventsDocumentType>;
export type EventsCollection = RxCollection<EventsDocumentType>;

