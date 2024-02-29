import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "users",
  "description": "Auth: Stores user login data within a secure schema.",
  "properties": {
    "instance_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null",
      "maxLength": 64
    },
    "aud": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "role": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "email": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "encrypted_password": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "email_confirmed_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "invited_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "confirmation_token": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "confirmation_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "recovery_token": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "recovery_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "email_change_token_new": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "email_change": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: null"
    },
    "email_change_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "last_sign_in_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "raw_app_meta_data": {
      "type": "object",
      "properties": {},
      "description": "Missing description. Database type: jsonb. Default value: null"
    },
    "raw_user_meta_data": {
      "type": "object",
      "properties": {},
      "description": "Missing description. Database type: jsonb. Default value: null"
    },
    "is_super_admin": {
      "type": "boolean",
      "description": "Missing description. Database type: boolean. Default value: null"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "phone": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: NULL::character varying"
    },
    "phone_confirmed_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "phone_change": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: ''"
    },
    "phone_change_token": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: ''"
    },
    "phone_change_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "confirmed_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: LEAST(email_confirmed_at, phone_confirmed_at)"
    },
    "email_change_token_current": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: ''"
    },
    "email_change_confirm_status": {
      "type": "integer",
      "description": "Missing description. Database type: smallint. Default value: 0"
    },
    "banned_until": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "reauthentication_token": {
      "type": "string",
      "maxLength": 255,
      "description": "Missing description. Database type: character varying. Default value: ''"
    },
    "reauthentication_sent_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    },
    "is_sso_user": {
      "type": "boolean",
      "description": "Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.. Database type: boolean. Default value: false"
    },
    "deleted_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: null"
    }
  },
  "required": [
    "id"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

export const usersSchema = toTypedRxJsonSchema(schemaLiteral);

export type UsersDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof usersSchema>;
export type UsersDocument = RxDocument<UsersDocumentType>;
export type UsersCollection = RxCollection<UsersDocumentType>;

