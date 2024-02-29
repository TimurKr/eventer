import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "contacts",
  "description": "Missing description",
  "properties": {
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "name": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "email": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: ''"
    },
    "phone": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: ''"
    },
    "address": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: ''"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: auth.uid()"
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

export const contactsSchema = toTypedRxJsonSchema(schemaLiteral);

export type ContactsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof contactsSchema>;
export type ContactsDocument = RxDocument<ContactsDocumentType>;
export type ContactsCollection = RxCollection<ContactsDocumentType>;

