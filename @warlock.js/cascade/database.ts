import { AsyncLocalStorage } from "async_hooks";
import type {
  ClientSession,
  ClientSessionOptions,
  Collection,
  Db,
  Document,
} from "mongodb";
import type { Connection } from "./connection";

export type DatabaseSessionTransaction = {
  session: ClientSession;
  database: Database;
};

const ROLLBACK_SYMBOL = Symbol("rollback");
const COMMIT_SYMBOL = Symbol("commit");

export type DatabaseTransactionCallbackOptions = {
  rollback: symbol;
  commit: symbol;
  session: ClientSession;
};

export type DatabaseTransactionCallback = (
  options: DatabaseTransactionCallbackOptions,
) => Promise<symbol | void>;

export class Database {
  /**
   * MongoDB Internal Database instance
   */
  public database!: Db;

  /**
   * Current Connection
   */
  public connection!: Connection;

  public sessionsContainer =
    new AsyncLocalStorage<DatabaseSessionTransaction>();

  /**
   * Perform a database transaction
   *
   * @todo There is an issue when executing models with writing ops that have events on abort, it will not rollback the transaction
   */
  public async transaction(
    callback: DatabaseTransactionCallback,
    sessionOptions: ClientSessionOptions = {
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    },
  ) {
    return new Promise((resolve, reject) => {
      const session = this.connection.client.startSession(sessionOptions);
      this.sessionsContainer.run(
        {
          session,
          database: this,
        },
        async () => {
          try {
            // Begin transaction using withTransaction
            await session.withTransaction(async () => {
              // Execute the callback and let it control rollback/commit
              const output = await callback({
                session,
                commit: COMMIT_SYMBOL,
                rollback: ROLLBACK_SYMBOL,
              });

              if (output === ROLLBACK_SYMBOL) {
                // If the callback explicitly returns rollback, rollback
                await session.abortTransaction();
                await session.endSession(); // Always end the session
                resolve(false);
              } else {
                // If the callback explicitly returns commit, commit
                await session.commitTransaction();
                await session.endSession(); // Always end the session
                resolve(true); // Resolve promise successfully
              }
            });
          } catch (error) {
            console.log("Transaction failed, rolling back...", error);
            await session.abortTransaction(); // Rollback on any error
            await session.endSession(); // Always end the session
            reject(error); // Reject promise with error
          }
        },
      );
    });
  }

  /**
   * Create a new transaction session and wrap it with a context
   */
  public async startSession(
    callback: (transaction: DatabaseSessionTransaction) => Promise<any>,
    sessionOptions: ClientSessionOptions = {
      defaultTransactionOptions: {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
    },
  ) {
    const session = this.connection.client.startSession(sessionOptions);

    return new Promise((resolve, reject) => {
      this.sessionsContainer.run(
        {
          session,
          database: this,
        },
        async () => {
          try {
            await session.withTransaction(async () => {
              const result = await callback({
                session,
                database: this,
              });

              resolve(result);

              session.commitTransaction();
            });
          } catch (error) {
            reject(error);
          } finally {
            session.endSession();
          }
        },
      );
    });
  }

  /**
   * Get active session
   */
  public getActiveSession() {
    return this.sessionsContainer.getStore();
  }
  /**
   * Set connection instance
   */
  public setConnection(connection: Connection) {
    this.connection = connection;

    return this;
  }

  /**
   * Set database instance
   */
  public setDatabase(database: Db) {
    this.database = database;

    return this;
  }

  /**
   * Get database collection instance
   */
  public collection<TSchema extends Document = Document>(
    collection: string,
  ): Collection<TSchema> {
    return this.database.collection<TSchema>(collection);
  }

  /**
   * List collection names
   */
  public async listCollectionNames() {
    return (await this.database.listCollections().toArray()).map(
      collection => collection.name,
    );
  }

  /**
   * Drop database
   */
  public async drop() {
    return await this.database.dropDatabase();
  }
}

export const database = new Database();
