const db = require('./config/db');

async function init() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Notifications table verified/created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create table:', err.message);
    process.exit(1);
  }
}

init();
