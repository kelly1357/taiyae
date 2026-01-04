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

async function debugThreadsList(regionId) {
    try {
        await sql.connect(config);
        console.log(`Fetching threads for RegionID: ${regionId}`);
        
        const result = await sql.query(`
            SELECT 
                t.ThreadID as id,
                t.RegionId as regionId,
                t.Created as createdAt,
                t.Modified as updatedAt,
                p.Subject as title,
                p.Body as content,
                c.CharacterName as authorName,
                c.CharacterID as authorId,
                (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                0 as views -- Placeholder
            FROM Thread t
            CROSS APPLY (
                SELECT TOP 1 * 
                FROM Post 
                WHERE ThreadID = t.ThreadID 
                ORDER BY Created ASC
            ) p
            LEFT JOIN Character c ON p.CharacterID = c.CharacterID
            WHERE t.RegionId = ${regionId}
            ORDER BY t.Modified DESC
        `);

        console.table(result.recordset);
        await sql.close();
    } catch (err) {
        console.error("Error:", err);
    }
}

debugThreadsList(1);
debugThreadsList(2);
