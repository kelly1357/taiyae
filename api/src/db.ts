import * as sql from 'mssql';

const connectionString = process.env.SqlConnectionString;

if (!connectionString) {
    throw new Error("SqlConnectionString is missing");
}

function parseConnectionString(connStr: string) {
    const config: any = {
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };
    
    const parts = connStr.split(';');
    
    // Handle the first part which might be the server definition without a key
    if (parts.length > 0 && parts[0].startsWith('tcp:')) {
        const serverPart = parts[0].substring(4); // remove "tcp:"
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
            case 'encrypt':
                config.options.encrypt = value.toLowerCase() === 'true';
                break;
            case 'trust server certificate':
                config.options.trustServerCertificate = value.toLowerCase() === 'true';
                break;
        }
    }
    return config;
}

const config = parseConnectionString(connectionString);

export async function getPool() {
    try {
        return await sql.connect(config);
    } catch (err) {
        console.error('Database connection failed: ', err);
        throw err;
    }
}
