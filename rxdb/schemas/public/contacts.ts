import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "contacts",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "name": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "email": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "phone": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "address": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "business_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: auth.uid()",
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
    "name",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const contactsSchema = toTypedRxJsonSchema(schemaLiteral);

export type ContactsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof contactsSchema>;
export type ContactsDocument = RxDocument<ContactsDocumentType>;
export type ContactsCollection = RxCollection<ContactsDocumentType>;

