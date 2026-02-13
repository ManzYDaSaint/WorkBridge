const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://workbridge_auth:theSaint4real@localhost:3454/workbridge_auth_db'
});

async function check() {
    try {
        await client.connect();
        console.log('Connected to DB');
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables:', res.rows.map(r => r.table_name));
        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
