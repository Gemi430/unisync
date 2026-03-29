const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'uni_platform',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

const migrate = async () => {
    try {
        console.log('🚀 Running migration: Add avatar_url and bio to users...');
        
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bio TEXT;
        `);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
