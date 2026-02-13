const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:theSaint4real@localhost:3454/postgres'
});

const services = [
    { user: 'workbridge_auth', db: 'workbridge_auth_db' },
    { user: 'workbridge_profile', db: 'workbridge_profile_db' },
    { user: 'workbridge_jobs', db: 'workbridge_jobs_db' },
    { user: 'workbridge_notif', db: 'workbridge_notif_db' },
    { user: 'workbridge_admin', db: 'workbridge_admin_db' }
];

async function setup() {
    try {
        await client.connect();
        console.log('Connected to postgres as superuser.');

        for (const service of services) {
            // Create User
            try {
                await client.query(`CREATE USER ${service.user} WITH PASSWORD 'theSaint4real';`);
                console.log(`User created: ${service.user}`);
            } catch (e) {
                if (e.code === '42710') { // duplicate_object
                    console.log(`User already exists: ${service.user} (Skipping)`);
                } else {
                    console.error(`Error creating user ${service.user}:`, e.message);
                }
            }

            // Create Database
            try {
                // Check if DB exists
                const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${service.db}'`);
                if (res.rowCount === 0) {
                    await client.query(`CREATE DATABASE ${service.db} OWNER ${service.user};`);
                    console.log(`Database created: ${service.db}`);
                } else {
                    console.log(`Database already exists: ${service.db} (Skipping)`);
                }
            } catch (e) {
                console.error(`Error creating database ${service.db}:`, e.message);
            }

            // Grant privileges (just in case)
            try {
                await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${service.db} TO ${service.user};`);
            } catch (e) {
                console.error(`Error granting privileges for ${service.db}:`, e.message);
            }
        }

        console.log('Setup complete.');
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

setup();
