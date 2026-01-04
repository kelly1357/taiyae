const sql = require('mssql');

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

async function updateSchema() {
    try {
        console.log("Connecting to database...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        console.log("Checking if ImageURL column exists in Region table...");
        const checkColumn = await pool.request().query(`
            SELECT * 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Region' AND COLUMN_NAME = 'ImageURL'
        `);

        if (checkColumn.recordset.length === 0) {
            console.log("Adding ImageURL column to Region table...");
            await pool.request().query(`
                ALTER TABLE Region
                ADD ImageURL NVARCHAR(MAX) NULL
            `);
            console.log("Column added successfully.");
        } else {
            console.log("Column already exists.");
        }

        await pool.close();
        console.log("Done.");

    } catch (err) {
        console.error("Update failed:", err);
    }
}

updateSchema();
