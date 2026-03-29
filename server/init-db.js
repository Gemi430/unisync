const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'uni_platform',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

const runSchema = async () => {
    try {
        console.log('📖 Reading schema.sql...');
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        let schema = fs.readFileSync(schemaPath, 'utf8');

        // Add drops at the beginning to ensure a clean slate for the first-time setup
        const dropTables = `
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS scores CASCADE;
            DROP TABLE IF EXISTS questions CASCADE;
            DROP TABLE IF EXISTS quizzes CASCADE;
            DROP TABLE IF EXISTS resources CASCADE;
            DROP TABLE IF EXISTS courses CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TYPE IF EXISTS approval_status CASCADE;
            DROP TYPE IF EXISTS stream_type CASCADE;
            DROP TYPE IF EXISTS user_role CASCADE;
        `;

        console.log('🧹 Cleaning old schema (if any)...');
        await pool.query(dropTables);

        console.log('🚀 Executing new schema on database...');
        await pool.query(schema);

        console.log('✅ Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
};

runSchema();
