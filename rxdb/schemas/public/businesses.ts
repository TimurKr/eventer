import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "businesses",
  "description": "Missing description",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null",
      "maxLength": 64
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "name": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    }
  },
  "required": [
    "id"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

export const businessesSchema = toTypedRxJsonSchema(schemaLiteral);

export type BusinessesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof businessesSchema>;
export type BusinessesDocument = RxDocument<BusinessesDocumentType>;
export type BusinessesCollection = RxCollection<BusinessesDocumentType>;

