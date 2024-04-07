import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  toTypedRxJsonSchema,
} from "rxdb";

const schemaLiteral = {
  title: "coupons",
  description: "",
  version: 0,
  properties: {
    created_at: {
      description:
        "Database type: timestamp with time zone. Default value: now()",
      type: "string",
      format: "date-time",
    },
    amount: {
      description: "Database type: real. Default value: null",
      type: "number",
    },
    code: {
      description: "Database type: text. Default value: null",
      type: "string",
    },
    valid_until: {
      description: "Database type: date. Default value: null",
      type: "string",
      format: "date",
    },
    original_amount: {
      description: "Database type: real. Default value: null",
      type: "number",
    },
    note: {
      description: "Database type: text. Default value: null",
      type: "string",
    },
    business_id: {
      description: "Database type: uuid. Default value: auth.uid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "businesses",
    },
    contact_id: {
      description: "Database type: uuid. Default value: null",
      type: "string",
      format: "uuid",
      maxLength: 64,
      ref: "contacts",
    },
    id: {
      description: "Database type: uuid. Default value: gen_random_uuid()",
      type: "string",
      format: "uuid",
      maxLength: 64,
    },
  },
  required: ["amount", "code", "original_amount", "id"],
  type: "object",
  primaryKey: "id",
} as const;

export const couponsSchema = toTypedRxJsonSchema(schemaLiteral);

export type CouponsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof couponsSchema
>;
export type CouponsDocument = RxDocument<CouponsDocumentType>;
export type CouponsCollection = RxCollection<CouponsDocumentType>;

export type CouponsConstraints =
  | "coupons_pkey"
  | "coupons_user_id_fkey"
  | "public_coupons_contact_id_fkey";

export class CouponsReplication extends SupabaseReplication<
  CouponsDocumentType,
  CouponsConstraints
> {}
