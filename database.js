const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 建立資料庫連線
const dbPath = path.join(__dirname, 'jonas_pay.db');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫表格
function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 建立借款記錄表
            db.run(`CREATE TABLE IF NOT EXISTS debts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lender_id TEXT NOT NULL,          -- 出借人(Jonas)的LINE ID
                borrower_id TEXT NOT NULL,        -- 借款人的LINE ID
                borrower_name TEXT NOT NULL,      -- 借款人姓名
                amount INTEGER NOT NULL,          -- 借款金額(以分為單位避免浮點數問題)
                description TEXT,                 -- 借款說明
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_paid BOOLEAN DEFAULT FALSE,    -- 是否已還款
                paid_at DATETIME NULL            -- 還款時間
            )`);

            // 建立提醒記錄表
            db.run(`CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                debt_id INTEGER NOT NULL,
                sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (debt_id) REFERENCES debts (id)
            )`);

            // 建立使用者設定表
            db.run(`CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT PRIMARY KEY,
                display_name TEXT,
                remind_days INTEGER DEFAULT 3,   -- 幾天後開始提醒
                auto_remind BOOLEAN DEFAULT TRUE
            )`, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
}

// 新增借款記錄
function addDebt(lenderId, borrowerId, borrowerName, amount, description) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO debts (lender_id, borrower_id, borrower_name, amount, description)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run([lenderId, borrowerId, borrowerName, amount, description], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });

        stmt.finalize();
    });
}

// 取得使用者的所有未還款記錄
function getUnpaidDebts(lenderId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT * FROM debts 
            WHERE lender_id = ? AND is_paid = FALSE 
            ORDER BY created_at DESC
        `, [lenderId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 取得特定借款人的未還款記錄
function getBorrowerDebts(lenderId, borrowerId) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT * FROM debts 
            WHERE lender_id = ? AND borrower_id = ? AND is_paid = FALSE 
            ORDER BY created_at DESC
        `, [lenderId, borrowerId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 標記債務為已還款
function markAsPaid(debtId) {
    return new Promise((resolve, reject) => {
        db.run(`
            UPDATE debts 
            SET is_paid = TRUE, paid_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `, [debtId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

// 取得特定債務記錄
function getDebtById(debtId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM debts WHERE id = ?`, [debtId], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// 記錄提醒
function addReminder(debtId) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO reminders (debt_id) VALUES (?)`, [debtId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

// 格式化金額顯示(從分轉換為元)
function formatAmount(amountInCents) {
    return `$${(amountInCents / 100).toFixed(0)}`;
}

// 解析金額輸入(轉換為分)
function parseAmount(amountString) {
    const amount = parseFloat(amountString.replace(/[,$]/g, ''));
    return Math.round(amount * 100); // 轉換為分
}

module.exports = {
    initDatabase,
    addDebt,
    getUnpaidDebts,
    getBorrowerDebts,
    markAsPaid,
    getDebtById,
    addReminder,
    formatAmount,
    parseAmount,
    db
};