import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

// GET /api/activity-tracker - Get characters that need activity (haven't posted recently)
export async function getActivityTracker(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        // Cutoff date: December 31, 2025
        const cutoffDate = new Date('2025-12-31T23:59:59.999Z');
        
        // Get all active characters who haven't posted since the cutoff date or never posted
        const result = await pool.request()
            .input('cutoffDate', cutoffDate)
            .query(`
                SELECT 
                    c.CharacterID,
                    c.CharacterName as Name,
                    u.Username,
                    c.Created as JoinedAt,
                    (
                        SELECT MAX(p.Created)
                        FROM Post p
                        JOIN Thread t ON p.ThreadID = t.ThreadID
                        WHERE p.CharacterID = c.CharacterID
                        AND t.RegionID IS NOT NULL
                    ) as LastICPostAt
                FROM Character c
                JOIN [User] u ON c.UserID = u.UserID
                WHERE c.Is_Active = 1
                AND (
                    NOT EXISTS (
                        SELECT 1 FROM Post p
                        JOIN Thread t ON p.ThreadID = t.ThreadID
                        WHERE p.CharacterID = c.CharacterID
                        AND t.RegionID IS NOT NULL
                        AND p.Created > @cutoffDate
                    )
                )
                ORDER BY c.CharacterName ASC
            `);
        
        return { 
            status: 200, 
            jsonBody: {
                characters: result.recordset,
                cutoffDate: cutoffDate.toISOString()
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

app.http('getActivityTracker', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'activity-tracker',
    handler: getActivityTracker
});
