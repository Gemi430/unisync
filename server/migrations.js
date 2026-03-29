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
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        throw err; // Re-throw to prevent server startup on failure
    }
};

module.exports = runMigrations;
