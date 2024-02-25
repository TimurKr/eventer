import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "coupons",
  "description": "Missing description",
  "properties": {
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "amount": {
      "type": "number",
      "description": "Missing description. Database type: real. Default value: null"
    },
    "code": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "valid_until": {
      "type": "string",
      "format": "date",
      "description": "Missing description. Database type: date. Default value: null"
    },
    "original_amount": {
      "type": "number",
      "description": "Missing description. Database type: real. Default value: null"
    },
    "note": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "business_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: auth.uid()"
    },
    "contact_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      "maxLength": 64
    }
  },
  "required": [
    "amount",
    "code",
    "original_amount"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

const schemaTyped = toTypedRxJsonSchema(schemaLiteral);

export type CouponsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export type CouponsDocument = RxDocument<CouponsDocumentType>;
export type CouponsCollection = RxCollection<CouponsDocumentType>;

export const couponsSchema: RxJsonSchema<CouponsDocumentType> = schemaLiteral;
