#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import jsonfile from "jsonfile";
import { set } from "lodash";
import prompts from "prompts";
import { SchemaConverter } from "./SchemaConverter";
import { IConfiguration } from "./config";

// Global self executing function for async/await
//
(async () => {
  // const pkg = await jsonfile.readFile(resolve(__dirname, "../package.json"));

  // Collect command-line options and arguments
  //
  const program = new Command()
    // .version(pkg.version)
    .usage("[options]")
    .option(
      "-c, --config <value>",
      "Path to configuration file. Additional parameters override config values",
    )
    .option("--pg-host <value>", "The postgresql host to connect to")
    .option(
      "--pg-port <n>",
      "The postgresql host to connect to. Defaults to 5432",
    )
    .option("--pg-database <value>", "The postgresql database to connect to")
    .option("--pg-user <value>", "The postgresql user to login with")
    .option("--pg-password <value>", "The postgresql password to login with")
    .option("--pg-schema <value>", "The postgresql schema to convert")
    .option(
      "-o, --out [folder]",
      "Output folder. Default output is to STDOUT. A sub-folder will be created per schema",
    )
    .option(
      "-v, --schemaVersion <value>",
      "The version property to use in the schemas. Defaults to 0",
    )
    .option(
      "-t, --include-tables <value>",
      "Comma separated list of tables to process. Default is all tables found",
    )
    .option(
      "-e, --exclude-tables <value>",
      "Comma separated list of tables to exclude. Default is to not exclude any",
    )
    .option("-u, --unwrap", "Unwraps the schema if only 1 is returned")
    .option(
      "-d, --desc <value>",
      "Default description when database lacks one. Defaults to current `Generated at <new Date()>`",
    )

    .parse(process.argv);

  const options = program.opts();

  // Build the configuration either from provided file or command line arguments
  //
  let configFile = {} as IConfiguration;
  if (options.config) {
    try {
      configFile = await jsonfile.readFile(options.config);
    } catch (err) {
      console.error(`Failed to read config file ${options.config}`, err);
      program.help();
    }
  }

  const url = process.env.PG_URI ? new URL(process.env.PG_URI) : null;

  let config: IConfiguration = {
    pg: {
      host:
        options.pgHost ||
        configFile.pg?.host ||
        process.env.PG_HOST ||
        url?.hostname ||
        "",
      database:
        options.pgDatabase ||
        configFile.pg?.database ||
        process.env.PG_DATABASE ||
        url?.pathname.substring(1) ||
        "",
      port:
        options.pgPort ||
        configFile.pg?.port ||
        process.env.PG_PORT ||
        url?.port ||
        "5432",
      user:
        options.pgUser ||
        configFile.pg?.user ||
        process.env.PG_USER ||
        url?.username ||
        "",
      password:
        options.pgPassword ||
        configFile.pg?.password ||
        process.env.PG_PASSWORD ||
        url?.password ||
        "",
    },
    input: {
      schemas: options.pgSchema?.split(",") ||
        configFile.input?.schemas || ["public"],
      include:
        options.includeTables?.split(",") || configFile.input?.include || [],
      exclude:
        options.excludeTables?.split(",") || configFile.input?.exclude || [],
    },
    output: {
      outDir: options.out?.toString() || configFile.output?.outDir || "",
      defaultDescription:
        options.desc || configFile.output?.defaultDescription || "",
      schemaVersion:
        options.schemaVersion || configFile.output?.schemaVersion || "0",
      unwrap: options.unwrap || configFile.output?.unwrap || false,
    },
  };

  // If no password was supplied prompt for it
  //
  if (!config.pg?.password) {
    const response = await prompts({
      type: "password",
      name: "password",
      message: "Password?",
    });
    if (response.password) {
      set(config, "pg.password", response.password);
    }
  }

  // If no outdir, return
  //
  if (!config.output?.outDir) {
    program.error("No output directory specified");
  }

  const converter = new SchemaConverter(config);
  try {
    const schemas = await converter.convert();
    const outputFolder = config.output?.outDir;

    if (!outputFolder) {
      if (config.output?.unwrap && schemas.length === 1) {
        console.log(schemas[0]);
      } else if (schemas.length > 0) {
        console.log(JSON.stringify(schemas, undefined, 2));
      }
    }
  } catch (err) {
    program.error(`Error:\n${err}\n\n
    Suggestion: Run with --help for parameters or check supplied configuration file
    `);
  }
})();
