const db = require('./config/db');

/**
 * Safe database migrations that run on server startup.
 * These will NOT delete your data, only add missing pieces.
 */
const runMigrations = async () => {
    try {
        console.log('🏗️  Running safe database migrations...');
        
        // 1. Add rich_content to courses if missing
        console.log('📝 Checking for "rich_content" column in "courses" table...');
        await db.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS rich_content TEXT;
        `);
        
        console.log('✅ Migration Check: "rich_content" is ready.');
        
        // 2. Add avatar_url and bio to users if missing
        console.log('👤 Checking for profile columns in "users" table...');
        await db.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bio TEXT,
            ADD COLUMN IF NOT EXISTS stream VARCHAR(50);
        `);
        console.log('✅ Migration Check: Profile columns (including stream) are ready.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err; // Re-throw to prevent server startup on failure
    }
};

module.exports = runMigrations;
