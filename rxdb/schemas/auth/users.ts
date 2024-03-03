import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication"

const schemaLiteral = {
  "title": "users",
  "description": "Auth: Stores user login data within a secure schema.",
  "version": 0,
  "properties": {
    "instance_id": {
      "description": ". Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "id": {
      "maxLength": 64,
      "description": ". Database type: uuid. Default value: null",
      "type": "string",
      "format": "uuid"
    },
    "aud": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "role": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "email": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "encrypted_password": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "email_confirmed_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "invited_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "confirmation_token": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "confirmation_sent_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "recovery_token": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "recovery_sent_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "email_change_token_new": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "email_change": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: null",
      "type": "string"
    },
    "email_change_sent_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "last_sign_in_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "raw_app_meta_data": {
      "description": ". Database type: jsonb. Default value: null",
      "type": "object",
      "properties": {}
    },
    "raw_user_meta_data": {
      "description": ". Database type: jsonb. Default value: null",
      "type": "object",
      "properties": {}
    },
    "is_super_admin": {
      "description": ". Database type: boolean. Default value: null",
      "type": "boolean"
    },
    "created_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "phone": {
      "description": ". Database type: text. Default value: NULL::character varying",
      "type": "string",
      "default": "NULL::character varying"
    },
    "phone_confirmed_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "phone_change": {
      "description": ". Database type: text. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "phone_change_token": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "phone_change_sent_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "confirmed_at": {
      "description": ". Database type: timestamp with time zone. Default value: LEAST(email_confirmed_at, phone_confirmed_at)",
      "type": "string",
      "format": "date-time"
    },
    "email_change_token_current": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "email_change_confirm_status": {
      "description": ". Database type: smallint. Default value: 0",
      "type": "integer",
      "default": "0"
    },
    "banned_until": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "reauthentication_token": {
      "maxLength": 255,
      "description": ". Database type: character varying. Default value: ''",
      "type": "string",
      "default": "''"
    },
    "reauthentication_sent_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    },
    "is_sso_user": {
      "description": "Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.. Database type: boolean. Default value: false",
      "type": "boolean",
      "default": "false"
    },
    "deleted_at": {
      "description": ". Database type: timestamp with time zone. Default value: null",
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const usersSchema = toTypedRxJsonSchema(schemaLiteral);

export type UsersDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof usersSchema>;
export type UsersDocument = RxDocument<UsersDocumentType>;
export type UsersCollection = RxCollection<UsersDocumentType>;

export type UsersConstraints =
  | "users_email_change_confirm_status_check"
  | "users_phone_key"
  | "users_pkey";

export class UsersReplication extends SupabaseReplication<
UsersDocumentType,
UsersConstraints
> {}