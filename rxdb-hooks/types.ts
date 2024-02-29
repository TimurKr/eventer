import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxCollectionCreator,
} from "rxdb";

export type CollectionsDefinition = Record<string, RxCollectionCreator>;

export type CollectionsBuilder<Collections extends CollectionsDefinition> = {
  [Key in keyof Collections]: RxCollection<
    ExtractDocumentTypeFromTypedRxJsonSchema<Collections[Key]["schema"]>
  >;
};

// export type RxDatabaseWithHooks<Collections extends CollectionsDefinition> =
//   RxDatabase<Collections> & {
//     newCollections$?: Subject<CollectionsDefinition>;
//   };
