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

async function testConnection() {
    try {
        console.log("Attempting to connect with config object...");
        const pool = await sql.connect(config);
        console.log("Connection successful!");
        
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log("Database version:", result.recordset[0].version);
        
        await pool.close();
    } catch (err) {
        console.error("Connection failed:", err);
    }
}

testConnection();
