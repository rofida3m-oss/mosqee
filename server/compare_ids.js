
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'mosqee.db');
const JSON_PATH = path.join(__dirname, 'data', 'sample_lessons.json');

const lessonsJson = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const jsonIds = lessonsJson.map(l => l.id).sort();

const db = new sqlite3.Database(DB_PATH);

db.all('SELECT id FROM educational_lessons', (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    const dbIds = rows.map(r => r.id).sort();

    console.log('JSON IDs (Total ' + jsonIds.length + '):');
    console.log(jsonIds.join(', '));

    console.log('\nDB IDs (Total ' + dbIds.length + '):');
    console.log(dbIds.join(', '));

    const missingInDb = jsonIds.filter(id => !dbIds.includes(id));
    const extraInDb = dbIds.filter(id => !jsonIds.includes(id));

    console.log('\nMissing in DB:');
    console.log(missingInDb.length > 0 ? missingInDb.join(', ') : 'None');

    console.log('\nExtra in DB:');
    console.log(extraInDb.length > 0 ? extraInDb.join(', ') : 'None');

    db.close();
});
