import Database from './database.js';

const db = new Database();
await db.init();

// Check if parent_id column exists
db.db.all("PRAGMA table_info(post_comments)", (err, columns) => {
    if (err) {
        console.error('Error checking table:', err);
        process.exit(1);
    }
    
    console.log('post_comments table columns:');
    columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
    });
    
    const hasParentId = columns.some(col => col.name === 'parent_id');
    
    if (hasParentId) {
        console.log('\n✅ parent_id column EXISTS in post_comments table');
    } else {
        console.log('\n❌ parent_id column MISSING from post_comments table');
        console.log('Adding it now...');
        
        db.db.run("ALTER TABLE post_comments ADD COLUMN parent_id TEXT DEFAULT NULL", (alterErr) => {
            if (alterErr) {
                console.error('Failed to add parent_id column:', alterErr);
                process.exit(1);
            } else {
                console.log('✅ Successfully added parent_id column');
                process.exit(0);
            }
        });
    }
    
    if (hasParentId) {
        process.exit(0);
    }
});