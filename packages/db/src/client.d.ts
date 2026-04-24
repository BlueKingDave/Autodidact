import { Pool } from 'pg';
import * as schema from './schema/index.js';
export declare const pool: Pool;
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export type DB = typeof db;
export declare const getDb: () => import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export declare const getPool: () => Pool;
//# sourceMappingURL=client.d.ts.map