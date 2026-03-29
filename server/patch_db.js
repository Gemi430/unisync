const db = require('./config/db');

async function patch() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Add rich_content to courses if missing
    await db.query(`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS rich_content TEXT;
    `);
    console.log('✅ Courses table updated (rich_content).');

    // Ensure resources file_url is long enough
    await db.query(`
      ALTER TABLE resources ALTER COLUMN file_url TYPE TEXT;
    `);
    console.log('✅ Resources table updated (file_url to TEXT).');

    console.log('🚀 Database patch applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Patch failed:', err.message);
    process.exit(1);
  }
}

patch();
