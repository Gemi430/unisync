const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'uni_platform',
  password: 'Bentigemechis1+',
  port: 5432,
});

async function fixPaths() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query("SELECT id, file_url FROM resources WHERE file_url LIKE '%/uploads/%' AND NOT file_url LIKE 'uploads/%'");
    for (const row of res.rows) {
      const parts = row.file_url.split(/[/\\]/);
      const filename = parts[parts.length - 1];
      const relativePath = 'uploads/' + filename;
      await client.query("UPDATE resources SET file_url = $1 WHERE id = $2", [relativePath, row.id]);
      console.log(`Updated resource ${row.id}: ${relativePath}`);
    }

    const resUsers = await client.query("SELECT id, payment_receipt_url FROM users WHERE payment_receipt_url LIKE '%/uploads/%' AND NOT payment_receipt_url LIKE 'uploads/%'");
    for (const row of resUsers.rows) {
      const parts = row.payment_receipt_url.split(/[/\\]/);
      const filename = parts[parts.length - 1];
      const relativePath = 'uploads/' + filename;
      await client.query("UPDATE users SET payment_receipt_url = $1 WHERE id = $2", [relativePath, row.id]);
      console.log(`Updated user ${row.id}: ${relativePath}`);
    }

    console.log('Path normalization complete');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixPaths();
