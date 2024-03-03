import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "coupons",
  "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time)",
  "version": 0,
  "properties": {
    "created_at": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: timestamp with time zone. Default value: now()",
      "type": "string",
      "format": "date-time"
    },
    "amount": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: real. Default value: null",
      "type": "number"
    },
    "code": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "valid_until": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: date. Default value: null",
      "type": "string",
      "format": "date"
    },
    "original_amount": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: real. Default value: null",
      "type": "number"
    },
    "note": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: text. Default value: null",
      "type": "string"
    },
    "business_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: auth.uid()",
      "type": "string",
      "format": "uuid"
    },
    "contact_id": {
      "description": "Generated at Sun Mar 03 2024 15:33:36 GMT+0100 (Central European Standard Time). Database type: uuid. Default value: null",
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
    "amount",
    "code",
    "original_amount",
    "id"
  ],
  "type": "object",
  "primaryKey": "id"
} as const;

export const couponsSchema = toTypedRxJsonSchema(schemaLiteral);

export type CouponsDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof couponsSchema>;
export type CouponsDocument = RxDocument<CouponsDocumentType>;
export type CouponsCollection = RxCollection<CouponsDocumentType>;

