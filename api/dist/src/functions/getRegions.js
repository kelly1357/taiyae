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
                r.ImageURL       AS imageUrl,
                r.HeaderImageURL AS headerImageUrl,
                LOWER(REPLACE(r.RegionName, ' ', '-')) AS regionSlug,
                s.id             AS subId,
                s.name           AS subName,
                s.description    AS subDescription,
                s.imageUrl       AS subImageUrl,
                p.id             AS packId,
                p.name           AS packName,
                p.slug           AS packSlug,
                p.color1         AS packColor1,
                p.color2         AS packColor2,
                (SELECT COUNT(*) FROM Thread t WHERE t.RegionID = r.RegionID AND t.IsArchived = 0) AS activeThreadCount,
                (SELECT COUNT(*) FROM Post p JOIN Thread t ON p.ThreadID = t.ThreadID WHERE t.RegionID = r.RegionID) AS postCount
            FROM Region r
            LEFT JOIN Subareas s ON LOWER(REPLACE(r.RegionName, ' ', '-')) = s.regionId
            LEFT JOIN PackSubareas ps ON s.id = ps.subareaId
            LEFT JOIN Packs p ON ps.packId = p.id AND p.isActive = 1
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
                        headerImageUrl: row.headerImageUrl,
                        slug: row.regionSlug,
                        activeThreadCount: row.activeThreadCount || 0,
                        postCount: row.postCount || 0,
                        subareas: []
                    });
                }
                if (row.subId) {
                    regionsMap.get(row.id).subareas.push({
                        id: row.subId,
                        name: row.subName,
                        description: row.subDescription,
                        imageUrl: row.subImageUrl,
                        claimedBy: row.packId ? {
                            id: row.packId,
                            name: row.packName,
                            slug: row.packSlug,
                            color1: row.packColor1,
                            color2: row.packColor2
                        } : null
                    });
                }
            });
            return {
                jsonBody: Array.from(regionsMap.values()),
                headers: { 'Cache-Control': 'public, max-age=300' }
            };
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