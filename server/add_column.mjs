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
    console.log('Connected to database');
});

// Add the updated_at column if it doesn't exist
db.run("ALTER TABLE athkar_logs ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
    if (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('✅ updated_at column already exists');
        } else {
            console.error('Error adding column:', err);
        }
    } else {
        console.log('✅ Added updated_at column to athkar_logs');
    }

    // Check the schema now
    db.all("PRAGMA table_info(athkar_logs)", [], (err, cols) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('\n=== New athkar_logs schema ===');
            cols.forEach(c => console.log(' -', c.name, '(' + c.type + ')'));
        }
        db.close();
    });
});
