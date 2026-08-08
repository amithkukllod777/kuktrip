'use strict';

/**
 * KukTrip SQLite -> shared Kuklabs MySQL budget shadow copier.
 * SAFE DEFAULT: dry-run only. Add --apply to write.
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');

const apply = process.argv.includes('--apply');
const mysqlUrl = process.env.DATABASE_URL;
if (!mysqlUrl) { console.error('[kuktrip:budget-copy] DATABASE_URL is required'); process.exit(1); }
const sqlitePath = process.env.TREK_DB_FILE || path.resolve(__dirname, '../data/travel.db');
if (!fs.existsSync(sqlitePath)) { console.error(`[kuktrip:budget-copy] SQLite source not found: ${sqlitePath}`); process.exit(1); }

function tableExists(db, name) { return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)); }
function rows(db, sql, ...params) { return db.prepare(sql).all(...params); }
function count(db, table) { return tableExists(db, table) ? Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n) : 0; }

async function verifyTarget(conn) {
  const required = ['users','kuktrip_trips','kuktrip_budget_items','kuktrip_budget_item_members','kuktrip_budget_item_payers','kuktrip_budget_settlements','kuktrip_identity_migration_map'];
  const [found] = await conn.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${required.map(()=>'?').join(',')})`, required);
  const names = new Set(found.map(r => r.TABLE_NAME));
  const missing = required.filter(x => !names.has(x));
  if (missing.length) throw new Error(`Target schema missing: ${missing.join(', ')}`);
}

async function loadIdentityMap(conn) {
  const [mapped] = await conn.query('SELECT kim_localUserId AS localId, kim_sharedUserId AS sharedId FROM kuktrip_identity_migration_map');
  return new Map(mapped.map(r => [Number(r.localId), Number(r.sharedId)]));
}

function remap(map, localId, field) {
  if (localId == null) return null;
  const shared = map.get(Number(localId));
  if (shared == null) throw new Error(`Missing authoritative Kuklabs user mapping for ${field} local user ${localId}`);
  return shared;
}

async function main() {
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const conn = await mysql.createConnection(mysqlUrl);
  try {
    sqlite.pragma('query_only = ON');
    const quick = sqlite.pragma('quick_check', { simple: true });
    if (quick !== 'ok') throw new Error(`SQLite quick_check failed: ${quick}`);
    if (!tableExists(sqlite, 'budget_items')) throw new Error('SQLite budget_items table not found');
    await verifyTarget(conn);
    const identity = await loadIdentityMap(conn);

    const source = {
      budgetItems: count(sqlite, 'budget_items'),
      members: count(sqlite, 'budget_item_members'),
      payers: count(sqlite, 'budget_item_payers'),
      settlements: count(sqlite, 'budget_settlements'),
    };
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', sqlitePath, sqliteQuickCheck: quick, source }, null, 2));
    if (!apply) {
      console.log('[kuktrip:budget-copy] DRY RUN ONLY — no MySQL rows written.');
      return;
    }

    await conn.beginTransaction();
    try {
      const items = rows(sqlite, `SELECT id, trip_id, category, name, total_price, currency, exchange_rate, persons, days, note, reservation_id, paid_by_user_id, expense_date, sort_order FROM budget_items ORDER BY id`);
      for (const b of items) {
        await conn.execute(
          `INSERT INTO kuktrip_budget_items
           (kbi_id,kbi_tripId,kbi_category,kbi_name,kbi_totalPrice,kbi_currency,kbi_exchangeRate,kbi_persons,kbi_days,kbi_note,kbi_reservationId,kbi_paidByUserId,kbi_expenseDate,kbi_sortOrder)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE kbi_tripId=VALUES(kbi_tripId),kbi_category=VALUES(kbi_category),kbi_name=VALUES(kbi_name),kbi_totalPrice=VALUES(kbi_totalPrice),kbi_currency=VALUES(kbi_currency),kbi_exchangeRate=VALUES(kbi_exchangeRate),kbi_persons=VALUES(kbi_persons),kbi_days=VALUES(kbi_days),kbi_note=VALUES(kbi_note),kbi_reservationId=VALUES(kbi_reservationId),kbi_paidByUserId=VALUES(kbi_paidByUserId),kbi_expenseDate=VALUES(kbi_expenseDate),kbi_sortOrder=VALUES(kbi_sortOrder)`,
          [b.id,b.trip_id,b.category || 'other',b.name,b.total_price || 0,b.currency || null,b.exchange_rate || 1,b.persons,b.days,b.note,b.reservation_id,remap(identity,b.paid_by_user_id,'budget payer'),b.expense_date,b.sort_order || 0],
        );
      }

      if (tableExists(sqlite, 'budget_item_members')) {
        for (const m of rows(sqlite, 'SELECT budget_item_id, user_id, amount, paid FROM budget_item_members ORDER BY budget_item_id, user_id')) {
          await conn.execute(`INSERT INTO kuktrip_budget_item_members (kbim_budgetItemId,kbim_userId,kbim_amount,kbim_paid) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE kbim_amount=VALUES(kbim_amount),kbim_paid=VALUES(kbim_paid)`, [m.budget_item_id,remap(identity,m.user_id,'budget member'),m.amount,m.paid || 0]);
        }
      }

      if (tableExists(sqlite, 'budget_item_payers')) {
        for (const p of rows(sqlite, 'SELECT budget_item_id, user_id, amount FROM budget_item_payers ORDER BY budget_item_id, user_id')) {
          await conn.execute(`INSERT INTO kuktrip_budget_item_payers (kbip_budgetItemId,kbip_userId,kbip_amount) VALUES (?,?,?) ON DUPLICATE KEY UPDATE kbip_amount=VALUES(kbip_amount)`, [p.budget_item_id,remap(identity,p.user_id,'budget payer'),p.amount]);
        }
      }

      if (tableExists(sqlite, 'budget_settlements')) {
        for (const s of rows(sqlite, 'SELECT id, trip_id, from_user_id, to_user_id, amount, currency, exchange_rate, created_by_user_id FROM budget_settlements ORDER BY id')) {
          await conn.execute(`INSERT INTO kuktrip_budget_settlements (kbs_id,kbs_tripId,kbs_fromUserId,kbs_toUserId,kbs_amount,kbs_currency,kbs_exchangeRate,kbs_createdByUserId) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE kbs_tripId=VALUES(kbs_tripId),kbs_fromUserId=VALUES(kbs_fromUserId),kbs_toUserId=VALUES(kbs_toUserId),kbs_amount=VALUES(kbs_amount),kbs_currency=VALUES(kbs_currency),kbs_exchangeRate=VALUES(kbs_exchangeRate),kbs_createdByUserId=VALUES(kbs_createdByUserId)`, [s.id,s.trip_id,remap(identity,s.from_user_id,'settlement from'),remap(identity,s.to_user_id,'settlement to'),s.amount,s.currency || null,s.exchange_rate || 1,remap(identity,s.created_by_user_id,'settlement creator')]);
        }
      }
      await conn.commit();
    } catch (error) { await conn.rollback(); throw error; }

    const target = {};
    for (const [key,table] of Object.entries({budgetItems:'kuktrip_budget_items',members:'kuktrip_budget_item_members',payers:'kuktrip_budget_item_payers',settlements:'kuktrip_budget_settlements'})) {
      const [r] = await conn.query(`SELECT COUNT(*) AS n FROM ${table}`); target[key] = Number(r[0].n);
    }
    console.log('[kuktrip:budget-copy] apply committed');
    console.log(JSON.stringify({ source, target }, null, 2));
  } finally { try { sqlite.close(); } catch {} await conn.end(); }
}
main().catch(err => { console.error('[kuktrip:budget-copy] failed:', err?.message || err); process.exit(1); });
