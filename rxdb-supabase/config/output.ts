/**
 * The configuration for how the JSON schemas are to be written
 *
 * @export
 * @interface IOutputConfiguration
 */
export interface IOutputConfiguration {
  /**
   * The output folder to write all the schema files to.
   * If omitted all the schemas will be output to STDOUT.
   * When converting a single schema to STDOUT you will likely want to set the
   * unwrap option
   *
   * @type {string}
   */
  outDir?: string;

  /**
   * If a single schema is converted and output to STDOUT you can enable this flag
   * to unwrap the schema from the normally output array
   *
   */
  unwrap?: boolean;

  /**
   * Set the version of your schema
   *
   */
  schemaVersion: string;

  /**
   * The default description to set for structure items that lack one.
   * Defaults to the current date and time of the import
   *
   * @type {string}
   */
  defaultDescription: string;
}
