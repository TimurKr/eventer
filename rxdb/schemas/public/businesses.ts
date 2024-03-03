import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "businesses",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "id": {
      "maxLength": 64,
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "name": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    }
  },
  "required": [
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const businessesSchema = toTypedRxJsonSchema(schemaLiteral);

export type BusinessesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof businessesSchema>;
export type BusinessesDocument = RxDocument<BusinessesDocumentType>;
export type BusinessesCollection = RxCollection<BusinessesDocumentType>;

