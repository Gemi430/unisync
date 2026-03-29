const db = require('./config/db');

/**
 * Safe database migrations that run on server startup.
 * These will NOT delete your data, only add missing pieces.
 */
const runMigrations = async () => {
    try {
        console.log('🏗️  Running safe database migrations...');
        
        // 1. Add rich_content to courses if missing
        await db.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS rich_content TEXT;
        `);
        
        console.log('✅ Migrations complete (Database is up to date).');
    } catch (err) {
        console.error('⚠️ Migration warning:', err.message);
        // We don't exit process here because the server can still run 
        // if this was just a minor issue or the column already existed.
    }
};

module.exports = runMigrations;
