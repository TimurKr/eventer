import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://fexmeqvoxejxnzexljdi.supabase.co/graphql/v1",
  generates: {
    "./utils/supabase/test": {
      preset: "client",
      plugins: ["typescript", "typescript-operations"],
    },
  },
};

export default config;
