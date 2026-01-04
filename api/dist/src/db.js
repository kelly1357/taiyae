"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const sql = require("mssql");
const connectionString = process.env.SqlConnectionString;
if (!connectionString) {
    throw new Error("SqlConnectionString is missing");
}
function parseConnectionString(connStr) {
    const config = {
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
        if (port)
            config.port = parseInt(port);
    }
    for (const part of parts) {
        const splitIndex = part.indexOf('=');
        if (splitIndex === -1)
            continue;
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
function getPool() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield sql.connect(config);
        }
        catch (err) {
            console.error('Database connection failed: ', err);
            throw err;
        }
    });
}
exports.getPool = getPool;
//# sourceMappingURL=db.js.map