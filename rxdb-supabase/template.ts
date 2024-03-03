import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  RxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "services",
  description: "Services that businesses offer and then create events from",
  properties: {
    created_at: {
      type: "string",
      format: "date-time",
      description:
        "Missing description. Database type: timestamp with time zone. Default value: now()",
    },
    business_id: {
      type: "string",
      format: "uuid",
      description:
        "Missing description. Database type: uuid. Default value: auth.uid()",
    },
    name: {
      type: "string",
      description:
        "Missing description. Database type: text. Default value: null",
    },
    id: {
      type: "string",
      format: "uuid",
      description:
        "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      maxLength: 64,
    },
  },
  required: ["name"],
  type: "object",
  version: 0,
  primaryKey: "id",
} as const;

const schemaTyped = toTypedRxJsonSchema(schemaLiteral);

/**
 * The document type, containing only the fields that are in the schema fetched from the supabase
 */
export type ServicesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

/**
 * The document type, containing all document fields provided by the RxDB.
 * WARNING: Do not use if you are using ORM Methods, construct your own with `RxDocument<ServicesDocumentType, ...>`.
 */
export type ServicesDocument = RxDocument<ServicesDocumentType>;

/**
 * The collection type, containing all static methods provided by the RxDB. Use this to define the structure of your database.
 * WARNING: Do not use if you are using ORM Methods or Static Methods, construct your own with `RxCollection<ServicesDocumentType, ...>`.
 */
export type ServicesCollection = RxCollection<ServicesDocumentType>;

export const servicesSchema: RxJsonSchema<ServicesDocumentType> = schemaLiteral;
