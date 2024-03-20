import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "businesses",
  description: "",
  version: 0,
  properties: {
    id: {
      description: "Database type: uuid. Default value: null",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "users",
    },
    created_at: {
      description:
        "Database type: timestamp with time zone. Default value: now()",
      type: "string",
      format: "date-time",
    },
    name: {
      description: "Database type: text. Default value: null",
      type: "string",
    },
  },
  required: ["id"],
  type: "object",
  primaryKey: "id",
} as const;

export const businessesSchema = toTypedRxJsonSchema(schemaLiteral);

export type BusinessesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof businessesSchema
>;
export type BusinessesDocument = RxDocument<BusinessesDocumentType>;
export type BusinessesCollection = RxCollection<BusinessesDocumentType>;

export type BusinessesConstraints = "users_id_fkey" | "users_pkey";

export class BusinessesReplication extends SupabaseReplication<
  BusinessesDocumentType,
  BusinessesConstraints
> {}
