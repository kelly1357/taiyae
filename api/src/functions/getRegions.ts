import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

export async function getRegions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
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
                (SELECT COUNT(*) FROM Thread t WHERE t.RegionID = r.RegionID AND t.IsArchived = 0) AS activeThreadCount,
                (SELECT COUNT(*) FROM Post p JOIN Thread t ON p.ThreadID = t.ThreadID WHERE t.RegionID = r.RegionID) AS postCount
            FROM Region r
            LEFT JOIN Subareas s ON LOWER(REPLACE(r.RegionName, ' ', '-')) = s.regionId
        `);

        // Transform flat result into nested structure
        const regionsMap = new Map<string, any>();
        
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
                    imageUrl: row.subImageUrl
                });
            }
        });

        return { 
            jsonBody: Array.from(regionsMap.values()),
            headers: { 'Cache-Control': 'public, max-age=300' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getRegions', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRegions,
    route: 'region'
});
