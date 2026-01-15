import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'mosqee.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('Connected to database:', DB_PATH);
});

// List all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
        console.error('Error fetching tables:', err);
    } else {
        console.log('\n=== Tables in database ===');
        tables.forEach(t => console.log(' -', t.name));
    }

    // Check if athkar_logs exists
    const athkarExists = tables.some(t => t.name === 'athkar_logs');
    console.log('\nathkar_logs table exists:', athkarExists);

    if (athkarExists) {
        // Show table schema
        db.all("PRAGMA table_info(athkar_logs)", [], (err, cols) => {
            if (err) {
                console.error('Error getting table info:', err);
            } else {
                console.log('\n=== athkar_logs schema ===');
                cols.forEach(c => console.log(' -', c.name, '(' + c.type + ')'));
            }

            // Try to insert a test record
            const testData = {
                userId: 'test_' + Date.now(),
                category: 'morning',
                progress: JSON.stringify({ "0": 1, "1": 2 }),
                date: '2026-01-13'
            };

            db.run(
                "INSERT INTO athkar_logs (user_id, category, progress, date) VALUES (?, ?, ?, ?)",
                [testData.userId, testData.category, testData.progress, testData.date],
                function (err) {
                    if (err) {
                        console.error('\n❌ Test insert failed:', err.message);
                    } else {
                        console.log('\n✅ Test insert succeeded! Row ID:', this.lastID);

                        // Clean up test record
                        db.run("DELETE FROM athkar_logs WHERE user_id = ?", [testData.userId], (delErr) => {
                            if (delErr) console.error('Cleanup error:', delErr);
                            else console.log('Test record cleaned up');
                            db.close();
                        });
                    }
                }
            );
        });
    } else {
        console.log('\n⚠️ athkar_logs table does not exist! Creating it...');

        const createSQL = `CREATE TABLE IF NOT EXISTS athkar_logs (
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            progress TEXT DEFAULT '{}',
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, category, date)
        )`;

        db.run(createSQL, (err) => {
            if (err) {
                console.error('Failed to create table:', err);
            } else {
                console.log('✅ athkar_logs table created successfully!');
            }
            db.close();
        });
    }
});
