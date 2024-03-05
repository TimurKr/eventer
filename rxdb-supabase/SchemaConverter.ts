import { constants, promises, writeFile } from "fs";
import { mkdirp } from "mkdirp";
import { join } from "path";
import pgStructure, { Column, Schema, Table } from "pg-structure";
import { RxJsonSchema } from "rxdb";
import { IConfiguration } from "./config";

export class SchemaConverter {
  /**
   * Creates an instance of SchemaConverter
   *
   * @param {IConfiguration} config The configuration for the database, input and output
   */
  constructor(private config: IConfiguration) {}

  /**
   * This helper method will check if the provided configuration is usable
   *
   * @returns {Promise<undefined>}
   */
  public async checkConfiguration(): Promise<undefined> {
    if (!this.config) {
      throw new Error("No configuration supplied");
    }

    if (
      !this.config.pg?.host ||
      !this.config.pg?.database ||
      !this.config.pg?.user
    ) {
      throw new Error("Missing PGSQL config");
    }

    if (this.config.output?.outDir) {
      // Create the folder and sub-paths if missing
      //
      await mkdirp(this.config.output.outDir);

      // Check the output folder is writeable
      //
      try {
        await promises.access(this.config.output.outDir, constants.W_OK);
      } catch (err) {
        console.error(err);
        throw new Error(`Cannot write to ${this.config.output.outDir}`);
      }
    }

    return;
  }

  /**
   * Perform the actual conversion process and output generated schemas
   * If an `outDir` is configured we will write to file instead.
   * This would be preferred for memory intensive conversion with many or very
   * large schemas
   *
   * @returns {(Promise<RxJsonSchema<any>[]>)}
   */
  public async convert(): Promise<RxJsonSchema<any>[]> {
    // Ensure configuration is sane first
    //
    await this.checkConfiguration();

    // Connect to the database using pgStructure
    // Will throw on error
    //
    console.warn("Connecting to database...");
    const dbSchemas = this.config.input.schemas;
    const db = await pgStructure(
      {
        database: this.config.pg.database,
        host: this.config.pg.host,
        port: this.config.pg.port,
        user: this.config.pg.user,
        password: this.config.pg.password,
      },
      {
        includeSchemas: dbSchemas,
        includeSystemSchemas: true,
      },
    );

    const outputSchemas: RxJsonSchema<any>[] = [];

    // Iterate all the schemas
    //
    for (const dbSchema of dbSchemas) {
      console.warn(`Processing schema ${dbSchema}`);
      const schema = db.get(dbSchema) as Schema;
      const schemaName = schema.name;

      // Process all the tables in the schema
      //
      for (const table of schema.tables) {
        const tableName = table.name;
        // Check if the entity is included and/or excluded
        //
        if (
          this.config.input.exclude.indexOf(tableName) === -1 &&
          (this.config.input.include.length === 0 ||
            this.config.input.include.indexOf(tableName) !== -1)
        ) {
          console.warn(`Processing table ${tableName}`);
          const jsonSchema = await this.exportTable(table);

          outputSchemas.push(jsonSchema);
        } else {
          console.warn(`Skipping excluded table ${tableName}`);
        }
      }

      // // Process all the views in the schema
      // //
      // for (const view of schema.views) {
      //   const viewName = view.name;

      //   // Check if the entity is included and/or excluded
      //   //
      //   if (
      //     this.config.input.exclude.indexOf(viewName) === -1 &&
      //     (this.config.input.include.length === 0 ||
      //       this.config.input.include.indexOf(viewName) !== -1)
      //   ) {
      //     console.warn(`Processing view ${viewName}`);
      //     const jsonSchema = await this.exportEntity({
      //       entity: view,
      //     });

      //     outputSchemas.push(jsonSchema);
      //   }
      // }

      // // Process all the materialized views in the schema
      // //
      // for (const view of schema.materializedViews) {
      //   const viewName = view.name;

      //   // Check if the entity is included and/or excluded
      //   //
      //   if (
      //     this.config.input.exclude.indexOf(viewName) === -1 &&
      //     (this.config.input.include.length === 0 ||
      //       this.config.input.include.indexOf(viewName) !== -1)
      //   ) {
      //     console.warn(`Processing materialized view ${viewName}`);
      //     const jsonSchema = await this.exportEntity({
      //       entity: view,
      //     });

      //     outputSchemas.push(jsonSchema);
      //   }
      // }
    }

    return outputSchemas;
  }

  /**
   * Converts an entity to a JSON schema and writes it to a file.
   * @param entity - The entity to convert.
   * @returns The JSON schema of the converted entity.
   */
  private async exportTable(table: Table) {
    const baseName = table.name.replace(`${table.schema.name}_`, "");
    const jsonSchema: RxJsonSchema<any> = {
      title: baseName,
      description: table.comment || this.config.output.defaultDescription,
      version: parseInt(this.config.output.schemaVersion),
      properties: {},
      required: [],
      type: "object",
      primaryKey: "",
    };

    for (const column of table.columns) {
      if (column.name === "_modified" || column.name === "_deleted") {
        continue;
      }

      const description =
        column.comment || this.config.output.defaultDescription;

      jsonSchema.properties[column.name] = {
        maxLength: column.name === "id" ? 64 : column.length,
        description:
          (description ? description + " - " : "") +
          `Database type: ${column.type.name}. Default value: ${column.default}`,
        ...(this.convertColumnType({ column }) as Record<string, unknown>),
        default:
          column.default && !column.default.toString().includes("(")
            ? column.default
            : undefined,
      };

      // Check if the column is required
      //
      if (column.notNull && !column.default) {
        (jsonSchema.required as string[]).push(column.name);
      }

      // Check if the column is the primary key
      //
      // We only support one column as primary key, so the one named "id" always takes precedence.
      if (
        column.isPrimaryKey &&
        (!jsonSchema.primaryKey || column.name === "id")
      ) {
        jsonSchema.primaryKey = column.name;
        if (!jsonSchema.required?.includes(column.name)) {
          (jsonSchema.required as string[]).push(column.name);
        }
      }
    }

    // Write to file if requested
    //
    if (this.config.output.outDir) {
      const folderName = join(this.config.output.outDir, table.schema.name);
      await mkdirp(folderName);
      const fileName = join(folderName, `${table.name}.ts`);

      const Title = baseName
        .split("_")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");

      const title = Title[0].toLowerCase() + Title.slice(1);

      let tsContent = `import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";\n`;
      tsContent += `import { SupabaseReplication } from "@/rxdb-supabase/supabase-replication"\n\n`; //TODO: IMPORTANT - replace with correct path
      tsContent += `const schemaLiteral = ${JSON.stringify(jsonSchema, undefined, 2)} as const;`;
      tsContent += "\n\n";
      tsContent += `export const ${title}Schema = toTypedRxJsonSchema(schemaLiteral);`;
      tsContent += "\n\n";
      tsContent += `export type ${Title}DocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof ${title}Schema>;\n`;
      tsContent += `export type ${Title}Document = RxDocument<${Title}DocumentType>;\n`;
      tsContent += `export type ${Title}Collection = RxCollection<${Title}DocumentType>;\n\n`;

      tsContent += `export type ${Title}Constraints =`;
      for (const constraint of table.constraints) {
        tsContent += `\n  | "${constraint.name}"`;
      }
      tsContent += ";\n\n";

      tsContent += `export class ${Title}Replication extends SupabaseReplication<\n${Title}DocumentType,\n${Title}Constraints\n> {}`;

      writeFile(fileName, tsContent, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
    }

    return jsonSchema;
  }

  /**
   * Converts a column type to a JSONSchema definition.
   *
   * @param column - The column object containing the type information.
   * @returns The JSONSchema definition for the column type.
   */
  private convertColumnType({
    column,
  }: {
    column: Column;
  }): Partial<
    Pick<
      RxJsonSchema<any>["properties"][number],
      "type" | "items" | "maxLength" | "format" | "oneOf"
    >
  > {
    const columnType = column.type.name;
    const isArray = column.arrayDimension > 0;

    switch (columnType) {
      case "bit":
      case "bit varying":
      case "varbit":
      case "character":
      case "character varying":
      case "text": {
        const typeDef = {
          type: "string",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "uuid": {
        const typeDef = {
          type: "string",
          format: "uuid",
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "date": {
        const typeDef = {
          type: "string",
          format: "date",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "time with time zone":
      case "time without time zone": {
        const typeDef = {
          type: "string",
          format: "time",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "timestamp with time zone":
      case "timestamp without time zone":
      case "timestamp": {
        const typeDef = {
          type: "string",
          format: "date-time",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "boolean": {
        const typeDef = { type: "boolean" };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "int":
      case "integer":
      case "smallint": {
        const typeDef = {
          type: "integer",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "bigint":
      case "decimal":
      case "double precision":
      case "float8":
      case "numeric":
      case "real": {
        const typeDef = {
          type: "number",
          maxLength: column.length,
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "json":
      case "jsonb": {
        const typeDef = {
          type: "object",
          properties: {},
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      case "interval": {
        const typeDef = {
          oneOf: [
            {
              type: "number",
              description: "Duration in seconds",
            },
            {
              type: "string",
              description: "Descriptive duration i.e. 8 hours",
            },
            {
              type: "object",
              description: "Duration object",
              properties: {
                years: { type: "number" },
                months: { type: "number" },
                days: { type: "number" },
                hours: { type: "number" },
                minutes: { type: "number" },
                seconds: { type: "number" },
                milliseconds: { type: "number" },
              },
            },
          ],
        };
        if (isArray) {
          return { type: "array", items: typeDef };
        }
        return typeDef;
      }

      default: {
        console.warn(
          `Unsupported column type: ${columnType}. Defaulting to null`,
        );
        return { type: "null" };
      }
    }
  }
}
