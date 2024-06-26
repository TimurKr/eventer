import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "services",
  description: "Services that businesses offer and then create events from",
  version: 0,
  properties: {
    created_at: {
      description:
        "Database type: timestamp with time zone. Default value: now()",
      type: "string",
      format: "date-time",
    },
    business_id: {
      description: "Database type: uuid. Default value: auth.uid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "businesses",
    },
    name: {
      description: "Database type: text. Default value: null",
      type: "string",
    },
    id: {
      description: "Database type: uuid. Default value: gen_random_uuid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
    },
  },
  required: ["name", "id"],
  type: "object",
  primaryKey: "id",
} as const;

export const servicesSchema = toTypedRxJsonSchema(schemaLiteral);

export type ServicesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof servicesSchema
>;
export type ServicesDocument = RxDocument<ServicesDocumentType>;
export type ServicesCollection = RxCollection<ServicesDocumentType>;

export type ServicesConstraints =
  | "services_pkey"
  | "public_services_business_id_fkey";

export class ServicesReplication extends SupabaseReplication<
  ServicesDocumentType,
  ServicesConstraints
> {}
