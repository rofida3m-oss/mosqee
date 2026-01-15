-- Add parent_id column to post_comments table for reply functionality
ALTER TABLE post_comments ADD COLUMN parent_id TEXT DEFAULT NULL;

-- Add foreign key constraint (SQLite doesn't enforce this at runtime but it's good to document)
-- FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE