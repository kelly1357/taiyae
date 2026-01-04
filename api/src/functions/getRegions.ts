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
                s.id             AS subId,
                s.name           AS subName
            FROM Region r
            LEFT JOIN Subareas s ON CAST(r.RegionID AS NVARCHAR(50)) = s.regionId
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
