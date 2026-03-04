import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.NEXT_PUBLIC_DRIZZLE_DB_URL;

let dbInstance;

if (!connectionString) {
  // In development without a database URL, export a safe stub.
  console.warn(
    '[db] NEXT_PUBLIC_DRIZZLE_DB_URL is not set. Database calls will fail at runtime.'
  );

  const thrower = () => {
    throw new Error(
      'Database is not configured. Set NEXT_PUBLIC_DRIZZLE_DB_URL to use the real database.'
    );
  };

  dbInstance = new Proxy(
    {},
    {
      get() {
        return thrower;
      },
    }
  );
} else {
  const sql = neon(connectionString);
  dbInstance = drizzle(sql, { schema });
}

export const db = dbInstance;

