#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const explicitDb = arg('--db');
const output = arg('--out');
const dbPath = path.resolve(
  explicitDb || process.env.TREK_DB_FILE || path.join(process.cwd(), 'server', 'data', 'travel.db'),
);

if (!fs.existsSync(dbPath)) {
  console.error(`KukTrip SQLite database not found: ${dbPath}`);
  console.error('Pass --db /absolute/path/to/travel.db or set TREK_DB_FILE.');
  process.exit(2);
}

const IDENTITY_TABLES = new Set([
  'users',
  'password_reset_tokens',
  'webauthn_credentials',
  'oauth_clients',
  'oauth_authorization_codes',
  'oauth_access_tokens',
  'oauth_refresh_tokens',
]);

function classify(name) {
  if (IDENTITY_TABLES.has(name)) return 'identity-transitional';
  if (name.startsWith('sqlite_')) return 'sqlite-internal';
  if (name.startsWith('plugin_')) return 'product-plugin';
  return 'kuktrip-product';
}

function quotedIdentifier(name) {
  return `"${String(name).replaceAll('"', '""')}"`;
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
try {
  db.pragma('foreign_keys = ON');
  const quickCheck = db.pragma('quick_check', { simple: true });
  const objects = db.prepare(`
    SELECT type, name, tbl_name, sql
    FROM sqlite_master
    WHERE name NOT LIKE 'sqlite_%'
    ORDER BY type, name
  `).all();

  const tableNames = objects.filter(o => o.type === 'table').map(o => o.name);
  const tables = tableNames.map(name => {
    const columns = db.pragma(`table_info(${quotedIdentifier(name)})`);
    const foreignKeys = db.pragma(`foreign_key_list(${quotedIdentifier(name)})`);
    const indexes = db.pragma(`index_list(${quotedIdentifier(name)})`).map(index => ({
      ...index,
      columns: db.pragma(`index_info(${quotedIdentifier(index.name)})`),
    }));
    const rowCount = db.prepare(`SELECT COUNT(*) AS count FROM ${quotedIdentifier(name)}`).get().count;
    const createSql = objects.find(o => o.type === 'table' && o.name === name)?.sql || null;

    return {
      name,
      classification: classify(name),
      rowCount,
      columns,
      foreignKeys,
      indexes,
      createSql,
      schemaHash: stableHash({ columns, foreignKeys, indexes, createSql }),
    };
  });

  const report = {
    contract: 'kuktrip-sqlite-inventory/1',
    generatedAt: new Date().toISOString(),
    source: {
      engine: 'sqlite',
      path: dbPath,
      bytes: fs.statSync(dbPath).size,
      quickCheck,
      sqliteVersion: db.prepare('select sqlite_version() as version').get().version,
    },
    summary: {
      tables: tables.length,
      rows: tables.reduce((sum, t) => sum + Number(t.rowCount || 0), 0),
      identityTransitionalTables: tables.filter(t => t.classification === 'identity-transitional').map(t => t.name),
      productTables: tables.filter(t => t.classification.startsWith('kuktrip-product') || t.classification === 'product-plugin').map(t => t.name),
      indexes: objects.filter(o => o.type === 'index').length,
      triggers: objects.filter(o => o.type === 'trigger').length,
      views: objects.filter(o => o.type === 'view').length,
    },
    tables,
    triggers: objects.filter(o => o.type === 'trigger'),
    views: objects.filter(o => o.type === 'view'),
    migrationRules: {
      identityTransitional: 'Do not recreate these as KukTrip authoritative identity tables. Map their Kuklabs-linked identities to the central Kuklabs user ID and retain only compatibility data needed during cutover.',
      product: 'Migrate product-owned rows to the shared Kuklabs MySQL infrastructure with explicit KukTrip ownership/namespacing and preserved authorization semantics.',
      destructiveCleanup: 'Forbidden until source/target row counts, FK checks, application tests, backup restore, and rollback rehearsal pass.',
    },
  };

  const serialized = JSON.stringify(report, null, 2) + '\n';
  if (output) {
    const outPath = path.resolve(output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, serialized);
    console.error(`Wrote ${outPath}`);
  } else {
    process.stdout.write(serialized);
  }
} finally {
  db.close();
}
