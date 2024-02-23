import { createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

// Create your database
const myDatabase = await createRxDatabase({
  name: "humans",
  storage: getRxStorageDexie(), // Uses IndexedDB
});

// Add schemas

const myCollections = myDatabase.addCollections({
  contacts: {
    schema: {
      title: "Contact schema",
      version: 0,
      primaryKey: "id",
      type: "object",
      properties: {
        id: {
          type: "string",
        },
        name: {
          type: "string",
        },
        email: {
          type: "string",
        },
        phone: {
          type: "string",
        },
        address: {
          type: "string",
        },
      },
      required: [""],
    },
  },
});
