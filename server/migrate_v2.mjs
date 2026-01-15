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
    console.log('Connected to database for migration');
});

const migrations = [
    // 1. Create follows table
    `CREATE TABLE IF NOT EXISTS follows (
        follower_id TEXT NOT NULL,
        following_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (following_id) REFERENCES users(id)
    )`,

    // 2. Create user_khatmas table (Personal & Private Groups)
    `CREATE TABLE IF NOT EXISTS user_khatmas (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'personal', 'private_group'
        owner_id TEXT NOT NULL,
        name TEXT, -- Optional name for the group
        participants TEXT DEFAULT '[]', -- JSON array of user IDs
        current_juz INTEGER DEFAULT 0, -- For personal tracking
        completed_parts TEXT DEFAULT '[]', -- For group tracking
        start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        end_date DATETIME,
        status TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed'
        FOREIGN KEY (owner_id) REFERENCES users(id)
    )`,

    // 3. Create khatma_history table (Statistics)
    `CREATE TABLE IF NOT EXISTS khatma_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        khatma_id TEXT, -- Reference to the completed khatma
        type TEXT NOT NULL,
        duration_days INTEGER,
        completion_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`,

    // 4. Create tasbih_goals table
    `CREATE TABLE IF NOT EXISTS tasbih_goals (
        user_id TEXT PRIMARY KEY,
        daily_goal INTEGER DEFAULT 100,
        streak_days INTEGER DEFAULT 0,
        last_streak_date TEXT,
        total_lifetime_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`
];

db.serialize(() => {
    console.log('Starting migration...');

    migrations.forEach((sql, index) => {
        db.run(sql, (err) => {
            if (err) {
                console.error(`Error in migration step ${index + 1}:`, err.message);
            } else {
                console.log(`Migration step ${index + 1} completed.`);
            }
        });
    });

    // Add updated_at column to athkar_logs if not exists (fixing previous issue properly)
    // Note: We skip this as we fixed it in code, but good to have schema aligned.
    // db.run("ALTER TABLE athkar_logs ADD COLUMN updated_at DATETIME", (err) => {}); 

    // Close connection
    db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('Migration finished successfully.');
    });
});
