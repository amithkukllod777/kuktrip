'use strict';

/** Additive KukTrip budget/expense schema inside the ONE Kuklabs MySQL DB. */
const mysql = require('mysql2/promise');
const url = process.env.DATABASE_URL;
if (!url) { console.error('[kuktrip:budget:mysql] DATABASE_URL is required'); process.exit(1); }

const ddls = [
  `CREATE TABLE IF NOT EXISTS kuktrip_budget_items (
    kbi_id INT AUTO_INCREMENT PRIMARY KEY,
    kbi_tripId INT NOT NULL,
    kbi_category VARCHAR(64) NOT NULL DEFAULT 'other',
    kbi_name VARCHAR(255) NOT NULL,
    kbi_totalPrice DECIMAL(15,2) NOT NULL DEFAULT 0,
    kbi_currency VARCHAR(3) NULL,
    kbi_exchangeRate DECIMAL(18,8) NOT NULL DEFAULT 1,
    kbi_persons INT NULL,
    kbi_days INT NULL,
    kbi_note TEXT NULL,
    kbi_reservationId INT NULL,
    kbi_paidByUserId INT NULL,
    kbi_expenseDate DATE NULL,
    kbi_sortOrder INT NOT NULL DEFAULT 0,
    kbi_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kbi_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kbi_trip (kbi_tripId),
    KEY idx_kbi_reservation (kbi_reservationId),
    CONSTRAINT fk_kbi_trip FOREIGN KEY (kbi_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE,
    CONSTRAINT fk_kbi_reservation FOREIGN KEY (kbi_reservationId) REFERENCES kuktrip_reservations(kr_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_budget_item_members (
    kbim_id INT AUTO_INCREMENT PRIMARY KEY,
    kbim_budgetItemId INT NOT NULL,
    kbim_userId INT NOT NULL,
    kbim_amount DECIMAL(15,2) NULL,
    kbim_paid TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY uq_kbim_item_user (kbim_budgetItemId, kbim_userId),
    KEY idx_kbim_user (kbim_userId),
    CONSTRAINT fk_kbim_item FOREIGN KEY (kbim_budgetItemId) REFERENCES kuktrip_budget_items(kbi_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_budget_item_payers (
    kbip_id INT AUTO_INCREMENT PRIMARY KEY,
    kbip_budgetItemId INT NOT NULL,
    kbip_userId INT NOT NULL,
    kbip_amount DECIMAL(15,2) NOT NULL,
    UNIQUE KEY uq_kbip_item_user (kbip_budgetItemId, kbip_userId),
    KEY idx_kbip_user (kbip_userId),
    CONSTRAINT fk_kbip_item FOREIGN KEY (kbip_budgetItemId) REFERENCES kuktrip_budget_items(kbi_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_budget_settlements (
    kbs_id INT AUTO_INCREMENT PRIMARY KEY,
    kbs_tripId INT NOT NULL,
    kbs_fromUserId INT NOT NULL,
    kbs_toUserId INT NOT NULL,
    kbs_amount DECIMAL(15,2) NOT NULL,
    kbs_currency VARCHAR(3) NULL,
    kbs_exchangeRate DECIMAL(18,8) NOT NULL DEFAULT 1,
    kbs_createdByUserId INT NULL,
    kbs_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kbs_trip (kbs_tripId),
    KEY idx_kbs_from (kbs_fromUserId),
    KEY idx_kbs_to (kbs_toUserId),
    CONSTRAINT fk_kbs_trip FOREIGN KEY (kbs_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

(async () => {
  const conn = await mysql.createConnection(url);
  try {
    const [users] = await conn.execute(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME IN ('id','openId')`);
    const cols = new Set(users.map(r => r.COLUMN_NAME));
    if (!cols.has('id') || !cols.has('openId')) throw new Error('Canonical Kuklabs users(id, openId) contract missing');
    const [core] = await conn.execute(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('kuktrip_trips','kuktrip_reservations')`);
    if (core.length < 2) throw new Error('Run shared KukTrip core schema first');
    for (const ddl of ddls) await conn.execute(ddl);
    console.log(`[kuktrip:budget:mysql] schema OK (${ddls.length} tables)`);
  } finally { await conn.end(); }
})().catch(err => { console.error('[kuktrip:budget:mysql] failed:', err?.message || err); process.exit(1); });
