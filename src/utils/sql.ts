import { type Database } from "sql.js";

export function executeQuery<T>(db: Database, query: string, params?: Record<string, string>): T {
  const stmt = db.prepare(query);
  stmt.step();
  const result = stmt.getAsObject(params) as T;
  stmt.free();
  return result;
}

export function executeQueryAll<T>(db: Database, query: string, params?: Record<string, string>): T[] {
  const stmt = db.prepare(query);
  const result: T[] = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject(params) as T);
  }
  stmt.free();
  return result;
}
