const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const config = {
    server: 'taiaye.database.windows.net',
    port: 1433,
    database: 'taiyae',
    user: 'wolfadmin',
    password: 'puhTog-pychys-7kumru',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function setupDatabase() {
    try {
        console.log("Connecting to database...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        // Read Schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Read Seed
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');

        console.log("Applying schema...");
        // Split by command if necessary, but let's try running as a batch first.
        // Sometimes creating tables and then referencing them immediately in the same batch works, 
        // but sometimes it's safer to split.
        // The schema has FK constraints that depend on tables created earlier in the file.
        // SQL Server usually handles this fine in a single batch if order is correct.
        
        // However, to be safe and avoid "table already exists" errors if run multiple times,
        // we might want to wrap in checks, but the user asked to "pull schema", implying fresh start or overwrite.
        // The provided schema.sql does NOT have "IF NOT EXISTS".
        // So if tables exist, this will fail.
        
        // Let's try to run schema. If it fails, we'll log it.
        try {
            await pool.request().query(schemaSql);
            console.log("Schema applied successfully.");
        } catch (err) {
            console.error("Error applying schema (tables might already exist):", err.message);
        }

        console.log("Seeding data...");
        try {
            await pool.request().query(seedSql);
            console.log("Seed data applied successfully.");
        } catch (err) {
             console.error("Error seeding data (data might already exist):", err.message);
        }

        await pool.close();
        console.log("Done.");

    } catch (err) {
        console.error("Setup failed:", err);
    }
}

setupDatabase();
