import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "services",
  "description": "Services that businesses offer and then create events from",
  "version": 0,
  "properties": {
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "business_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: auth.uid()",
      "type": "string",
      "format": "uuid"
    },
    "name": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "id": {
      "maxLength": 64,
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: gen_random_uuid()",
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "name",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const servicesSchema = toTypedRxJsonSchema(schemaLiteral);

export type ServicesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof servicesSchema>;
export type ServicesDocument = RxDocument<ServicesDocumentType>;
export type ServicesCollection = RxCollection<ServicesDocumentType>;

