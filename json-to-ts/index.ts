import { Command } from "commander";
import * as fs from "fs";
import jsonfile from "jsonfile";
import * as path from "path";

const program = new Command();

program
  .version("0.0.0")
  .description("Your command description here")
  .option("-d, --directory <directory>", "Specify a directory")
  .option("-v, --schemaVersion <schemaVersion>", "Specify a version")
  .action(async (options) => {
    const directoryPath = options.directory;
    if (!fs.existsSync(directoryPath)) {
      console.error("Directory does not exist:", directoryPath);
      process.exit(1);
    }

    const processDirectory = async (dirPath: string) => {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          await processDirectory(filePath);
        } else if (path.extname(file) === ".json") {
          const schema = await jsonfile.readFile(filePath);

          schema.additionalProperties = undefined;
          schema.$schema = undefined;
          schema.$id = undefined;
          let version: number;
          try {
            version = parseInt(options.schemaVersion || "0");
          } catch (e) {
            console.warn("Invalid version:", schema.version, "using 0");
            version = 0;
          }
          schema.version = version;
          schema.primaryKey ??= "id";
          schema.properties[schema.primaryKey].maxLength ??= 64; // TODO: Why isn't this coming from the db???

          schema.properties["_modified"] = undefined;
          schema.properties["_deleted"] = undefined;

          const content = JSON.stringify(schema, undefined, 2);

          const title = schema.title as string;
          const Title = title.charAt(0).toUpperCase() + title.slice(1);

          let tsContent = `import { ExtractDocumentTypeFromTypedRxJsonSchema, RxCollection, RxDocument, RxJsonSchema, toTypedRxJsonSchema } from "rxdb";\n\n`;
          tsContent += `const schemaLiteral = ${content.trim()} as const;`;
          tsContent += "\n\n";
          tsContent += `const schemaTyped = toTypedRxJsonSchema(schemaLiteral);`;
          tsContent += "\n\n";
          tsContent += `export type ${Title}DocumentType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;\n`;
          tsContent += `export type ${Title}Document = RxDocument<${Title}DocumentType>;\n`;
          tsContent += `export type ${Title}Collection = RxCollection<${Title}DocumentType>;\n\n`;
          tsContent += `export const ${title}Schema: RxJsonSchema<${Title}DocumentType> = schemaLiteral;\n`;

          const tsFilePath = path.join(
            dirPath,
            `${path.basename(file, ".json")}.ts`,
          );
          fs.writeFileSync(tsFilePath, tsContent);
        }
      }
    };

    await processDirectory(directoryPath);
  });

program.parse(process.argv);
