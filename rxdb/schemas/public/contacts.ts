import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication"

const schemaLiteral = {
  "title": "contacts",
  "description": "",
  "version": 0,
  "properties": {
    "created_at": {
      "description": ". Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "name": {
      "description": ". Database type: text. Default value: null",
      "type": "string"
    },
    "email": {
      "description": ". Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "phone": {
      "description": ". Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "address": {
      "description": ". Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "business_id": {
      "description": ". Database type: uuid. Default value: auth.uid()",
      "type": "string",
      "format": "uuid"
    },
    "id": {
      "maxLength": 64,
      "description": ". Database type: uuid. Default value: gen_random_uuid()",
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

export type ContactsConstraints =
  | "contacts_pkey"
  | "contacts_unique_constraint"
  | "public_contacts_business_id_fkey";

export class ContactsReplication extends SupabaseReplication<
ContactsDocumentType,
ContactsConstraints
> {}