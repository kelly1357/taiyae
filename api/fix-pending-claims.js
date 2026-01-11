// One-time script to fix pending claims that were stored as 0 instead of NULL
// Run with: node --env-file=local.settings.json fix-pending-claims.js

const sql = require('mssql');
const fs = require('fs');

function parseConnectionString(connStr) {
    const config = {
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };
    
    const parts = connStr.split(';');
    
    if (parts.length > 0 && parts[0].startsWith('tcp:')) {
        const serverPart = parts[0].substring(4);
        const [srv, port] = serverPart.split(',');
        config.server = srv;
        if (port) config.port = parseInt(port);
    }

    for (const part of parts) {
        const splitIndex = part.indexOf('=');
        if (splitIndex === -1) continue;
        
        const key = part.substring(0, splitIndex).trim().toLowerCase();
        const value = part.substring(splitIndex + 1).trim();
        
        switch (key) {
            case 'initial catalog':
            case 'database':
                config.database = value;
                break;
            case 'user id':
            case 'uid':
                config.user = value;
                break;
            case 'password':
            case 'pwd':
                config.password = value;
                break;
        }
    }
    
    return config;
}

async function fixPendingClaims() {
    const settings = JSON.parse(fs.readFileSync('./local.settings.json', 'utf8'));
    const connectionString = settings.Values.SqlConnectionString;
    const config = parseConnectionString(connectionString);
    
    try {
        await sql.connect(config);
        console.log('Connected to database');
        
        // Update all records where IsModeratorApproved = 0 to NULL (making them pending)
        const result = await sql.query`
            UPDATE CharacterSkillPointsAssignment 
            SET IsModeratorApproved = NULL 
            WHERE IsModeratorApproved = 0
        `;
        
        console.log('Updated rows:', result.rowsAffected[0]);
        console.log('Done! All claims with IsModeratorApproved=0 are now NULL (pending)');
        
        await sql.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

fixPendingClaims();
