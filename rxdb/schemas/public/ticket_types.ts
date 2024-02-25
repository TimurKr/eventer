import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";

const schemaLiteral = {
  "title": "ticket_types",
  "description": "Missing description",
  "properties": {
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Missing description. Database type: timestamp with time zone. Default value: now()"
    },
    "label": {
      "type": "string",
      "description": "Missing description. Database type: text. Default value: null"
    },
    "capacity": {
      "type": "integer",
      "description": "Missing description. Database type: smallint. Default value: null"
    },
    "price": {
      "type": "number",
      "description": "Missing description. Database type: real. Default value: null"
    },
    "is_vip": {
      "type": "boolean",
      "description": "Missing description. Database type: boolean. Default value: false"
    },
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: gen_random_uuid()",
      "maxLength": 64
    },
    "service_id": {
      "type": "string",
      "format": "uuid",
      "description": "Missing description. Database type: uuid. Default value: null"
    }
  },
  "required": [
    "label",
    "price",
    "service_id"
  ],
  "type": "object",
  "version": 0,
  "primaryKey": "id"
} as const;

const schemaTyped = toTypedRxJsonSchema(schemaLiteral);

export type Ticket_typesDocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export type Ticket_typesDocument = RxDocument<Ticket_typesDocumentType>;
export type Ticket_typesCollection = RxCollection<Ticket_typesDocumentType>;

export const ticket_typesSchema: RxJsonSchema<Ticket_typesDocumentType> = schemaLiteral;
