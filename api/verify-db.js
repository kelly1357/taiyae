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

async function verifyData() {
    try {
        const pool = await sql.connect(config);
        
        const regions = await pool.request().query('SELECT COUNT(*) as count FROM Regions');
        console.log("Regions count:", regions.recordset[0].count);

        const threads = await pool.request().query('SELECT COUNT(*) as count FROM Threads');
        console.log("Threads count:", threads.recordset[0].count);
        
        await pool.close();
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

verifyData();
