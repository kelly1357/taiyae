const sql = require('mssql');
const config = {
    server: 'taiaye.database.windows.net',
    port: 1433,
    database: 'taiyae',
    user: 'wolfadmin',
    password: 'puhTog-pychys-7kumru',
    options: { encrypt: true, trustServerCertificate: false }
};

async function run() {
  const pool = await sql.connect(config);
  
  await pool.request()
    .input('desc', sql.NVarChar, "Post here if you're going to be away (and not posting!) for a week or more. (read about <a href='/wiki/absences-and-scarcity'><b>Activity and Absences</b></a>)")
    .query('UPDATE OOCForum SET Description = @desc WHERE ID = 5');
  
  console.log('Updated forum ID 5');
  console.log('Done!');
  await pool.close();
}

run().catch(e => { console.error(e); process.exit(1); });
