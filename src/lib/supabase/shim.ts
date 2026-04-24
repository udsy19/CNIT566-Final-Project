// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

// Supabase-compatible shim backed by local Drizzle + SQLite.
//
// Covers the subset of the Supabase v2 client API the codebase actually uses:
// `.from(table).select().eq/.neq/.gt[e]/.lt[e]/.is/.not/.or/.ilike/.in(...)`
// `.order().limit().single/.maybeSingle()`, `.insert`, `.update`, `.upsert`,
// `.delete`, plus `client.auth.getUser()` / `getSession()` / `signOut()`.
//
// Returns data in the exact `{ data, error }` shape Supabase does. Because
// the Drizzle schema uses snake_case property names that match SQL columns,
// no per-row reshaping is needed.

import { and, or, eq, ne, gt, gte, lt, lte, inArray, isNull, isNotNull, asc, desc, sql, getTableColumns, type SQL, type AnyColumn } from 'drizzle-orm';
import type { AnySQLiteTable } from 'drizzle-orm/sqlite-core';
import { db, ensureReady } from '@/lib/db/client';
import {
  users,
  courses,
  assignments,
  content_modules,
  content_topics,
  announcements,
  briefings,
  chat_messages,
} from '@/lib/db/schema';
import { getSessionUser, invalidateSession, readSessionIdFromCookie } from '@/lib/auth/session';
import type { User } from '@/lib/db/schema-types';

const TABLES: Record<string, AnySQLiteTable> = {
  users,
  courses,
  assignments,
  content_modules,
  content_topics,
  announcements,
  briefings,
  chat_messages,
};

function resolveTable(name: string): AnySQLiteTable {
  const t = TABLES[name];
  if (!t) throw new Error(`[shim] unknown table: ${name}`);
  return t;
}

function resolveColumn(table: AnySQLiteTable, colName: string): AnyColumn {
  const cols = getTableColumns(table);
  const col = (cols as Record<string, AnyColumn>)[colName];
  if (!col) throw new Error(`[shim] unknown column "${colName}" on ${(table as unknown as { _: { name: string } })._.name}`);
  return col;
}

type Filter = SQL;

type Ordering = { col: AnyColumn; ascending: boolean };

type PgResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

function ok<T>(data: T): PgResult<T> {
  return { data, error: null };
}
function err(message: string): PgResult<never> {
  return { data: null, error: { message } };
}

// ─── Query builder for SELECT / UPDATE / DELETE / INSERT / UPSERT ───
// Result types are `any` on purpose. The Supabase v2 client returns loosely
// typed `{ data, error }` shapes too, so strict typing here would force a
// rewrite of every API route — which Phase 2c does once the cutover is stable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class QueryBuilder implements PromiseLike<PgResult<any>> {
  private table: AnySQLiteTable;
  private filters: Filter[] = [];
  private orderings: Ordering[] = [];
  private limitVal: number | null = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  private mode: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private insertRows: Record<string, unknown>[] = [];
  private updateValues: Record<string, unknown> | null = null;
  private upsertConflict: string[] | null = null;
  private returnAfterWrite = false;

  constructor(tableName: string) {
    this.table = resolveTable(tableName);
  }

  // ─── select ───
  // The cols arg from Supabase is ignored — we always select *. Column lists
  // in Supabase are strings like 'id, name, courses(*)' which would require
  // a SQL parser to honor precisely; selecting * and letting the caller pick
  // fields is simpler and closer to how Drizzle is designed.
  select(_cols?: string, _opts?: { count?: string; head?: boolean }): this {
    this.mode = 'select';
    return this;
  }

  // ─── filters ───
  eq(col: string, val: unknown): this {
    this.filters.push(eq(resolveColumn(this.table, col), val as never));
    return this;
  }
  neq(col: string, val: unknown): this {
    this.filters.push(ne(resolveColumn(this.table, col), val as never));
    return this;
  }
  gt(col: string, val: unknown): this {
    this.filters.push(gt(resolveColumn(this.table, col), val as never));
    return this;
  }
  gte(col: string, val: unknown): this {
    this.filters.push(gte(resolveColumn(this.table, col), val as never));
    return this;
  }
  lt(col: string, val: unknown): this {
    this.filters.push(lt(resolveColumn(this.table, col), val as never));
    return this;
  }
  lte(col: string, val: unknown): this {
    this.filters.push(lte(resolveColumn(this.table, col), val as never));
    return this;
  }
  is(col: string, val: unknown): this {
    if (val === null) {
      this.filters.push(isNull(resolveColumn(this.table, col)));
    } else {
      this.filters.push(eq(resolveColumn(this.table, col), val as never));
    }
    return this;
  }
  not(col: string, op: string, val: unknown): this {
    if (op === 'is' && val === null) {
      this.filters.push(isNotNull(resolveColumn(this.table, col)));
    } else if (op === 'eq') {
      this.filters.push(ne(resolveColumn(this.table, col), val as never));
    } else {
      throw new Error(`[shim] .not('${op}', …) not implemented`);
    }
    return this;
  }
  in(col: string, values: unknown[]): this {
    this.filters.push(inArray(resolveColumn(this.table, col), values as never[]));
    return this;
  }
  ilike(col: string, pattern: string): this {
    // SQLite LIKE is already case-insensitive for ASCII by default. For robustness
    // we lowercase both sides.
    this.filters.push(
      sql`lower(${resolveColumn(this.table, col)}) LIKE ${pattern.toLowerCase()}`,
    );
    return this;
  }
  // Supabase .or('a.eq.x,b.eq.y')
  or(conditions: string): this {
    const parts = conditions.split(',').map((p) => p.trim()).filter(Boolean);
    const exprs: SQL[] = parts.map((p) => {
      const m = p.match(/^([^.]+)\.([^.]+)\.(.+)$/);
      if (!m) throw new Error(`[shim] bad .or() part: ${p}`);
      const [, col, op, rawVal] = m;
      const column = resolveColumn(this.table, col);
      // Strip surrounding quotes if present.
      const val = rawVal.replace(/^['"]|['"]$/g, '');
      if (op === 'eq') return eq(column, val as never);
      if (op === 'neq') return ne(column, val as never);
      if (op === 'is' && val === 'null') return isNull(column);
      if (op === 'ilike') return sql`lower(${column}) LIKE ${val.toLowerCase()}`;
      throw new Error(`[shim] .or() op not implemented: ${op}`);
    });
    if (exprs.length) this.filters.push(or(...exprs)!);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderings.push({
      col: resolveColumn(this.table, col),
      ascending: opts?.ascending !== false,
    });
    return this;
  }
  limit(n: number): this {
    this.limitVal = n;
    return this;
  }
  range(from: number, to: number): this {
    // Not used heavily. Approximate with limit + offset on selects.
    this.limitVal = to - from + 1;
    (this as unknown as { offsetVal: number }).offsetVal = from;
    return this;
  }
  single(): this {
    this.singleMode = 'single';
    return this;
  }
  maybeSingle(): this {
    this.singleMode = 'maybeSingle';
    return this;
  }

  // ─── writes ───
  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.mode = 'insert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  update(values: Record<string, unknown>): this {
    this.mode = 'update';
    this.updateValues = { ...values, updated_at: new Date() };
    return this;
  }
  upsert(
    rows: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string },
  ): this {
    this.mode = 'upsert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    this.upsertConflict = opts?.onConflict
      ? opts.onConflict.split(',').map((c) => c.trim())
      : null;
    return this;
  }
  delete(): this {
    this.mode = 'delete';
    return this;
  }

  // ─── execution ───
  private whereClause(): SQL | undefined {
    if (this.filters.length === 0) return undefined;
    if (this.filters.length === 1) return this.filters[0];
    return and(...this.filters);
  }

  private applyOrder<Q extends { orderBy: (...args: SQL[]) => Q }>(q: Q): Q {
    for (const o of this.orderings) {
      q = q.orderBy(o.ascending ? asc(o.col) : desc(o.col));
    }
    return q;
  }

  private async run(): Promise<PgResult<unknown>> {
    try {
      ensureReady();
      if (this.mode === 'select') {
        let q = db.select().from(this.table) as unknown as {
          where: (w?: SQL) => typeof q;
          orderBy: (...args: SQL[]) => typeof q;
          limit: (n: number) => typeof q;
          offset: (n: number) => typeof q;
          all: () => unknown[];
          get: () => unknown | undefined;
        };
        const where = this.whereClause();
        if (where) q = q.where(where);
        for (const o of this.orderings) {
          q = q.orderBy(o.ascending ? asc(o.col) : desc(o.col));
        }
        if (this.limitVal != null) q = q.limit(this.limitVal);
        const offsetVal = (this as unknown as { offsetVal?: number }).offsetVal;
        if (offsetVal != null) q = q.offset(offsetVal);

        if (this.singleMode) {
          const row = q.get();
          if (!row && this.singleMode === 'single') {
            return err('No rows found');
          }
          return ok(row ?? null);
        }
        return ok(q.all());
      }

      if (this.mode === 'insert') {
        const inserted = (db.insert(this.table).values(this.insertRows as never).returning().all() as unknown) as unknown[];
        if (this.singleMode) return ok(inserted[0] ?? null);
        return ok(inserted);
      }

      if (this.mode === 'upsert') {
        // Best-effort upsert. If onConflict is specified, use that; otherwise
        // try the first unique constraint the caller intends (fallback: primary key).
        const target = this.upsertConflict?.map((c) => resolveColumn(this.table, c)) ?? [];
        const setClause: Record<string, unknown> = {};
        for (const row of this.insertRows) {
          for (const [k, v] of Object.entries(row)) {
            // Don't overwrite the conflict target columns or the primary key.
            if (target.some((t) => (t as unknown as { name: string }).name === k)) continue;
            if (k === 'id' || k === 'created_at') continue;
            setClause[k] = v;
          }
        }
        setClause.updated_at = new Date();

        let q = db.insert(this.table).values(this.insertRows as never);
        if (target.length > 0) {
          q = (q as unknown as {
            onConflictDoUpdate: (opts: { target: AnyColumn[]; set: Record<string, unknown> }) => typeof q;
          }).onConflictDoUpdate({ target, set: setClause }) as typeof q;
        }
        const inserted = ((q.returning().all() as unknown) as unknown[]);
        if (this.singleMode) return ok(inserted[0] ?? null);
        return ok(inserted);
      }

      if (this.mode === 'update') {
        let q = db.update(this.table).set(this.updateValues!) as unknown as {
          where: (w: SQL) => typeof q;
          returning: () => { all: () => unknown[] };
          run: () => void;
        };
        const where = this.whereClause();
        if (where) q = q.where(where);
        if (this.returnAfterWrite || this.singleMode) {
          const rows = q.returning().all();
          if (this.singleMode) return ok(rows[0] ?? null);
          return ok(rows);
        }
        q.run();
        return ok(null);
      }

      if (this.mode === 'delete') {
        let q = db.delete(this.table) as unknown as {
          where: (w: SQL) => typeof q;
          run: () => void;
        };
        const where = this.whereClause();
        if (where) q = q.where(where);
        q.run();
        return ok(null);
      }

      return err(`[shim] unknown mode: ${this.mode}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return err(msg);
    }
  }

  // Make the builder thenable — supports `await builder` and `.then()`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then<TResult1 = PgResult<any>, TResult2 = never>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onfulfilled?: ((value: PgResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

// ─── Client factory ───
function shimAuth() {
  return {
    async getUser(_token?: string) {
      const user = await getSessionUser();
      if (!user) return { data: { user: null }, error: null };
      // Shape the response like Supabase's: { data: { user: {id, email, ...} } }
      return {
        data: { user: userAsSupabaseUser(user) },
        error: null,
      };
    },
    async getSession() {
      const user = await getSessionUser();
      if (!user) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            user: userAsSupabaseUser(user),
            // There is no bearer token in this local app; give clients a
            // placeholder so code that spreads `session.access_token` into
            // an Authorization header doesn't crash. Routes are cookie-gated.
            access_token: 'local-session',
            token_type: 'bearer',
          },
        },
        error: null,
      };
    },
    async signOut() {
      const id = await readSessionIdFromCookie();
      if (id) await invalidateSession(id);
      return { error: null };
    },
  };
}

function userAsSupabaseUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    created_at: u.created_at.toISOString(),
    updated_at: u.updated_at.toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
  };
}

/** Returns a Supabase-compatible client backed by the local SQLite database. */
export function createShimClient() {
  return {
    from(tableName: string) {
      return new QueryBuilder(tableName);
    },
    auth: shimAuth(),
  };
}

export type ShimClient = ReturnType<typeof createShimClient>;
