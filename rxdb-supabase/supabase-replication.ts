import {
  PostgrestError,
  RealtimeChannel,
  SupabaseClient,
} from "@supabase/supabase-js";
import {
  ReplicationOptions,
  ReplicationPullHandlerResult,
  ReplicationPullOptions,
  ReplicationPushHandler,
  ReplicationPushOptions,
  RxReplicationPullStreamItem,
  RxReplicationWriteToMasterRow,
  WithDeleted,
} from "rxdb";
import { RxReplicationState } from "rxdb/plugins/replication";
import { Subject } from "rxjs";

const DEFAULT_LAST_MODIFIED_FIELD = "_modified";
const DEFAULT_DELETED_FIELD = "_deleted";
const POSTGRES_DUPLICATE_KEY_ERROR_CODE = "23505";

export type SupabaseReplicationOptions<RxDocType> = Omit<
  // We don't support waitForLeadership. You should just run in a SharedWorker anyways, no?
  ReplicationOptions<RxDocType, any>,
  "pull" | "push" | "waitForLeadership"
> & {
  /**
   * The SupabaseClient to replicate with.
   */
  supabaseClient: SupabaseClient;

  /**
   * The table to replicate to, if different from the name of the collection.
   * @default the name of the RxDB collection.
   */
  table?: string;

  /**
   * The primary key of the supabase table, if different from the primary key of the RxDB.
   * @default the primary key of the RxDB collection
   */
  // TODO: Support composite primary keys.
  primaryKey?: string;

  /**
   * When supabase update fails, the message includes the name of the constraint that failed.
   * By providing a map between the constraints and string to display,
   */
  constraintMap?: Record<string, string>;

  onError?: (error: Error) => void;

  /**
   * Options for pulling data from supabase. Set to {} to pull with the default
   * options, as no data will be pulled if the field is absent.
   */
  pull?: Omit<
    ReplicationPullOptions<RxDocType, SupabaseReplicationCheckpoint>,
    "handler" | "stream$"
  > & {
    /**
     * Whether to subscribe to realtime Postgres changes for the table. If set to false,
     * only an initial pull will be performed. Only has an effect if the live option is set
     * to true.
     * @default true
     */
    realtimePostgresChanges?: boolean;

    /**
     * The name of the supabase field that is automatically updated to the last
     * modified timestamp by postgres. This field is required for the pull sync
     * to work and can easily be implemented with moddatetime in supabase.
     * @default '_modified'
     */
    lastModifiedField?: string;
  };

  /**
   * Options for pushing data to supabase. Set to {} to push with the default
   * options, as no data will be pushed if the field is absent.
   */
  // TODO: enable custom batch size (currently always one row at a time)
  push?: Omit<ReplicationPushOptions<RxDocType>, "handler"> & {
    /**
     * Handler for pushing row updates to supabase. Must return true iff the UPDATE was
     * applied to the supabase table. Returning false signalises a write conflict, in
     * which case the current state of the row will be fetched from supabase and passed to
     * the RxDB collection's conflict handler.
     * @default the default handler will update the row only iff all fields match the
     * local state (before the update was applied), otherwise the conflict handler is
     * invoked. The default handler does not support JSON fields at the moment.
     */
    // TODO: Support JSON fields
    updateHandler?: (
      row: RxReplicationWriteToMasterRow<RxDocType>,
    ) => Promise<boolean>;
  };
};

/**
 * The checkpoint stores until which point the client and supabse have been synced.
 * For this to work, we require each row to have a datetime field that contains the
 * last modified time. In case two rows have the same timestamp, we use the primary
 * key to define a strict order.
 */
export interface SupabaseReplicationCheckpoint {
  modified: string;
  primaryKeyValue: string | number;
}

type HandlerRespnse<RxDocType> = {
  masterState: WithDeleted<RxDocType>;
  error: Error | PostgrestError;
}[];

/**
 * Replicates the local RxDB database with the given Supabase client.
 *
 * See SupabaseReplicationOptions for the various configuration options. For a general introduction
 * to RxDB's replication protocol, see https://rxdb.info/replication.html
 */
export class SupabaseReplication<RxDocType> extends RxReplicationState<
  RxDocType,
  SupabaseReplicationCheckpoint
> {
  private readonly table: string;
  private readonly primaryKey: string;
  private readonly lastModifiedFieldName: string;
  readonly constraintMap?: Record<string, string>;

  private readonly realtimeChanges: Subject<
    RxReplicationPullStreamItem<RxDocType, SupabaseReplicationCheckpoint>
  >;
  private realtimeChannel?: RealtimeChannel;

  constructor(private options: SupabaseReplicationOptions<RxDocType>) {
    const realtimeChanges = new Subject<
      RxReplicationPullStreamItem<RxDocType, SupabaseReplicationCheckpoint>
    >();
    super(
      options.replicationIdentifier,
      options.collection,
      options.deletedField || DEFAULT_DELETED_FIELD,
      options.pull && {
        ...options.pull,
        stream$: realtimeChanges,
        handler: (lastCheckpoint, batchSize) =>
          this.pullHandler(lastCheckpoint, batchSize),
      },
      options.push && {
        ...options.push,
        handler: (rows) => this.pushHandler(rows),
      },
      typeof options.live === "undefined" ? true : options.live,
      typeof options.retryTime === "undefined" ? 5000 : options.retryTime,
      typeof options.autoStart === "undefined" ? true : options.autoStart,
    );
    this.realtimeChanges = realtimeChanges;
    this.table = options.table || options.collection.name;
    this.primaryKey =
      options.primaryKey || options.collection.schema.primaryPath;
    this.lastModifiedFieldName =
      options.pull?.lastModifiedField || DEFAULT_LAST_MODIFIED_FIELD;
    this.constraintMap = options.constraintMap;

    if (this.autoStart) {
      this.start();
    }
  }

  public override async start(): Promise<void> {
    if (
      this.live &&
      this.options.pull &&
      (this.options.pull.realtimePostgresChanges ||
        typeof this.options.pull.realtimePostgresChanges === "undefined")
    ) {
      this.watchPostgresChanges();
    }
    return super.start();
  }

  public override async cancel(): Promise<any> {
    if (this.realtimeChannel) {
      return Promise.all([super.cancel(), this.realtimeChannel.unsubscribe()]);
    }
    return super.cancel();
  }

  /**
   * Pulls all changes since the last checkpoint from supabase.
   */
  private async pullHandler(
    lastCheckpoint: SupabaseReplicationCheckpoint | undefined,
    batchSize: number,
  ): Promise<
    ReplicationPullHandlerResult<RxDocType, SupabaseReplicationCheckpoint>
  > {
    let query = this.options.supabaseClient.from(this.table).select();
    if (lastCheckpoint && lastCheckpoint.modified) {
      // Construct the PostgREST query for the following condition:
      // WHERE _modified > lastModified OR (_modified = lastModified AND primaryKey > lastPrimaryKey)
      const lastModified = JSON.stringify(lastCheckpoint.modified);
      const lastPrimaryKey = JSON.stringify(lastCheckpoint.primaryKeyValue); // TODO: Add test for a integer primary key
      const isNewer = `${this.lastModifiedFieldName}.gt.${lastModified}`;
      const isSameAge = `${this.lastModifiedFieldName}.eq.${lastModified}`;
      query = query.or(
        `${isNewer},and(${isSameAge},${this.primaryKey}.gt.${lastPrimaryKey})`,
      );
    }
    query = query
      .order(this.lastModifiedFieldName)
      .order(this.primaryKey)
      .limit(batchSize);
    //console.debug("Pulling changes since", lastCheckpoint?.modified, "with query", (query as any)['url'].toString())

    const { data, error } = await query;
    if (error) throw error;
    if (data.length == 0) {
      return {
        checkpoint: lastCheckpoint || null,
        documents: [],
      };
    } else {
      return {
        checkpoint: this.rowToCheckpoint(data[data.length - 1]),
        documents: data.map(this.rowToRxDoc.bind(this)),
      };
    }
  }

  /**
   * Pushes local changes to supabase.
   */
  private pushHandler: ReplicationPushHandler<RxDocType> = async (rows) => {
    const updateRows = rows.filter((row) => !!row.assumedMasterState);
    const insertRows = rows.filter((row) => !row.assumedMasterState);

    const bulkInsertPromise = this.bulkInsertHandler(insertRows);
    const bulkUpdatePromise = this.bulkUpdateHandler(updateRows);

    const errors = (
      await Promise.all([bulkInsertPromise, bulkUpdatePromise])
    ).flat();

    if (errors.length === 0) {
      return []; // Success :)
    }

    // Emit errors so the client can display them to user
    errors.forEach((error) =>
      this.options.onError?.(
        error.error instanceof Error
          ? error.error
          : new Error(error.error.message),
      ),
    );

    return errors.map((error) => error.masterState);
  };

  /**
   * Inserts new row into supabase.
   *
   * @returns void if no error, on error an object The error should be later
   * safelly emitted to the client and local state should be resolved based
   * on the current master state.
   */
  private async insertHandler(
    row: RxReplicationWriteToMasterRow<RxDocType>,
  ): Promise<HandlerRespnse<RxDocType>> {
    const { error } = await this.options.supabaseClient
      .from(this.table)
      .insert(row.newDocumentState);

    if (!error) {
      return []; // Success :)
    }
    // Fetch the actual master
    const masterState = await this.fetchByPrimaryKey(row.newDocumentState);
    const errorMessage = this.mapError(error);

    return [{ masterState: masterState, error: errorMessage }];
  }

  /**
   * Bulk inserts new rows into supabase.
   * @returns The current master state of all conflicting writes, so that they can be resolved on the client.
   */
  private async bulkInsertHandler(
    rows: RxReplicationWriteToMasterRow<RxDocType>[],
  ): Promise<HandlerRespnse<RxDocType>> {
    if (rows.length === 0) return [];

    if (rows.length === 1) {
      return await this.insertHandler(rows[0]);
    }

    const { error } = await this.options.supabaseClient
      .from(this.table)
      .insert(rows.map((r) => r.newDocumentState));

    if (!error) {
      return []; // Success :)
    }

    const masterStates = await this.fetchByPrimaryKeys(
      rows.map((r) => r.newDocumentState),
    );
    const errorMessage = this.mapError(error);
    return masterStates.map((masterState) => ({
      masterState,
      error: errorMessage,
    }));
  }

  /**
   * Updates a row in supabase if all fields match the local state. Otherwise, the current
   * state is fetched and passed to the conflict handler.
   */
  private async updateHandler(
    row: RxReplicationWriteToMasterRow<RxDocType>,
  ): Promise<HandlerRespnse<RxDocType>> {
    const updateHandler =
      this.options.push?.updateHandler || this.defaultUpdateHandler.bind(this);
    let success = false;
    try {
      success = await updateHandler(row);
    } catch (err: any) {
      const masterState = await this.fetchByPrimaryKey(row.newDocumentState);
      const error = this.mapError(err);
      return [{ masterState, error }];
    }
    if (success) return []; // Success :)
    // Fetch current state and let conflict handler resolve it.
    const masterState = await this.fetchByPrimaryKey(row.newDocumentState);

    return [{ masterState, error: new Error("There") }];
  }

  /**
   * Updates all rows in parrallel and returns the errors and master states of conficts
   */
  private async bulkUpdateHandler(
    rows: RxReplicationWriteToMasterRow<RxDocType>[],
  ): Promise<HandlerRespnse<RxDocType>> {
    const updatePromises = rows.map((row) => this.updateHandler(row));
    return (await Promise.all(updatePromises)).flat();
  }

  /**
   * Updates the row only if all database fields match the expected state.
   * Throws error on any error
   * @returns bool if update updated exactly one row
   */
  private async defaultUpdateHandler(
    row: RxReplicationWriteToMasterRow<RxDocType>,
  ): Promise<boolean> {
    let query = this.options.supabaseClient
      .from(this.table)
      .update(row.newDocumentState, { count: "exact" });
    Object.entries(row.assumedMasterState!).forEach(([field, value]) => {
      const type = typeof value;
      if (type === "boolean" || value === null) {
        query = query.is(field, value);
      } else if (type === "string" || type === "number") {
        query = query.eq(field, value);
      } else {
        throw new Error(`replicateSupabase: Unsupported field of type ${type}`);
      }
    });
    const { error, count } = await query;
    if (error) throw error;
    return count == 1;
  }

  private watchPostgresChanges() {
    this.realtimeChannel = this.options.supabaseClient
      .channel(`rxdb-supabase-${this.replicationIdentifier}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: this.table },
        (payload) => {
          if (payload.eventType === "DELETE" || !payload.new) return; // Should have set _deleted field already
          //console.debug('Realtime event received:', payload)
          this.realtimeChanges.next({
            checkpoint: this.rowToCheckpoint(payload.new),
            documents: [this.rowToRxDoc(payload.new)],
          });
        },
      )
      .subscribe();
  }

  /**
   * Maps a PostgrestError to an Error or PostgrestError based on the provided constraint map.
   * If the error message contains a constraint from the map, it returns a new Error with the corresponding constraint message.
   * If the error code is a duplicate key error, it returns a new Error with the message "Duplicate key".
   * Otherwise, it returns the original PostgrestError.
   *
   * @param error - The PostgrestError to be mapped.
   * @returns The mapped Error or PostgrestError.
   */
  private mapError(error: PostgrestError): Error | PostgrestError {
    if (this.constraintMap) {
      for (const constraint in this.constraintMap) {
        if (error.message.toLowerCase().includes(constraint.toLowerCase()))
          return new Error(this.constraintMap[constraint]);
      }
    }
    return error;
  }

  private async fetchByPrimaryKey(
    row: RxDocType,
  ): Promise<WithDeleted<RxDocType>> {
    const { data, error } = await this.options.supabaseClient
      .from(this.table)
      .select()
      .eq(this.primaryKey, (row as any)[this.primaryKey]);
    if (error) throw error;
    if (data.length === 0) throw new Error("No row with given primary key"); //TODO maybe insert it with _deleted?
    return this.rowToRxDoc(data[0]);
  }

  private async fetchByPrimaryKeys(
    rows: RxDocType[],
  ): Promise<WithDeleted<RxDocType>[]> {
    const { data, error } = await this.options.supabaseClient
      .from(this.table)
      .select()
      .in(
        this.primaryKey,
        rows.map((r) => (r as any)[this.primaryKey]),
      );
    if (error) throw error;
    if (data.length === 0) throw new Error("No row with given primary key"); //TODO maybe insert it with _deleted?
    return data.map((row) => this.rowToRxDoc(row));
  }

  private rowToRxDoc(row: any): WithDeleted<RxDocType> {
    // TODO: Don't delete the field if it is actually part of the collection
    delete row[this.lastModifiedFieldName];
    return row as WithDeleted<RxDocType>;
  }

  private rowToCheckpoint(row: any): SupabaseReplicationCheckpoint {
    return {
      modified: row[this.lastModifiedFieldName],
      primaryKeyValue: row[this.primaryKey],
    };
  }
}
