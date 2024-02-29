import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "services",
  "description": "Services that businesses offer and then create events from",
  "properties": {
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: auth.uid()"
    },
    "name": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      "maxLength": 64
    }
  },
  "required": [
    "name"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

export const servicesSchema = toTypedRxJsonSchema(schemaLiteral);

export type ServicesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof servicesSchema>;
export type ServicesDocument = RxDocument<ServicesDocumentType>;
export type ServicesCollection = RxCollection<ServicesDocumentType>;

