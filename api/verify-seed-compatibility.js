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

async function verifySeedCompatibility() {
    try {
        console.log("Connecting to database...");
        const pool = await sql.connect(config);
        
        console.log("Fetching database schema...");
        const result = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS
        `);
        
        const dbSchema = {};
        result.recordset.forEach(row => {
            if (!dbSchema[row.TABLE_NAME]) {
                dbSchema[row.TABLE_NAME] = {};
            }
            dbSchema[row.TABLE_NAME][row.COLUMN_NAME] = row.DATA_TYPE;
        });

        console.log("Reading seed.sql...");
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        
        console.log("\n--- Verification Results ---\n");

        // Regex to find "INSERT INTO Table (col1, col2) VALUES"
        const insertRegex = /INSERT INTO\s+(\w+)\s*\(([^)]+)\)/g;
        let match;
        let hasErrors = false;
        
        while ((match = insertRegex.exec(seedSql)) !== null) {
            const tableName = match[1];
            const columns = match[2].split(',').map(c => c.trim());
            
            if (!dbSchema[tableName]) {
                console.error(`❌ Table '${tableName}' found in seed.sql does NOT exist in the database.`);
                hasErrors = true;
                
                // Check for potential rename match (e.g. Subareas vs Subarea)
                const similar = Object.keys(dbSchema).find(t => 
                    t.toLowerCase().startsWith(tableName.toLowerCase()) || 
                    tableName.toLowerCase().startsWith(t.toLowerCase())
                );
                if (similar) console.log(`   💡 Did you mean '${similar}'?`);
            } else {
                console.log(`✅ Table '${tableName}' exists.`);
                
                columns.forEach(col => {
                    if (!dbSchema[tableName][col]) {
                        console.error(`   ❌ Column '${col}' does not exist in table '${tableName}'.`);
                        hasErrors = true;
                    }
                });
            }
        }

        if (!hasErrors) {
            console.log("\n✨ Success! seed.sql is compatible with the current database schema.");
        } else {
            console.log("\n⚠️  Issues found. Please fix the errors above.");
        }

        await pool.close();
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

verifySeedCompatibility();