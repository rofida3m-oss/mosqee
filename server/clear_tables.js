
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'mosqee.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run("DELETE FROM lesson_questions", (err) => {
        if (err) console.error("Error clearing questions:", err);
        else console.log("Questions cleared");
    });
    db.run("DELETE FROM educational_lessons", (err) => {
        if (err) console.error("Error clearing lessons:", err);
        else console.log("Lessons cleared");
    });
});
db.close();
