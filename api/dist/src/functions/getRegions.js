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
exports.getRegions = void 0;
const functions_1 = require("@azure/functions");
const db_1 = require("../db");
function getRegions(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield (0, db_1.getPool)();
            const result = yield pool.request().query(`
            SELECT 
                r.RegionID       AS id,
                r.RegionName     AS name,
                r.Description    AS description,
                CAST(NULL AS NVARCHAR(MAX)) AS imageUrl, -- Region table has no image column
                s.id             AS subId,
                s.name           AS subName
            FROM Region r
            LEFT JOIN Subareas s ON CAST(r.RegionID AS NVARCHAR(50)) = s.regionId
        `);
            // Transform flat result into nested structure
            const regionsMap = new Map();
            result.recordset.forEach(row => {
                if (!regionsMap.has(row.id)) {
                    regionsMap.set(row.id, {
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        imageUrl: row.imageUrl,
                        subareas: []
                    });
                }
                if (row.subId) {
                    regionsMap.get(row.id).subareas.push({
                        id: row.subId,
                        name: row.subName
                    });
                }
            });
            return { jsonBody: Array.from(regionsMap.values()) };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.getRegions = getRegions;
functions_1.app.http('getRegions', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRegions,
    route: 'region'
});
//# sourceMappingURL=getRegions.js.map