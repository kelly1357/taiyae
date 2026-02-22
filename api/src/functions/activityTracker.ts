import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

// GET /api/activity-tracker - Get characters at risk of inactivation at the next monthly check
export async function getActivityTracker(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        // Next check = last day of the current month
        const now = new Date();
        const nextCheckDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
        
        // Characters are inactivated if they haven't posted within 30 days of the check.
        // So the cutoff is: nextCheckDate - 30 days. Any character whose last IC post
        // is before this date (or who never posted) will be 30+ days inactive by the check.
        const cutoffDate = new Date(nextCheckDate);
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        // Get all active characters whose last IC post is before the cutoff (or never posted)
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
                WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
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
                nextCheckDate: nextCheckDate.toISOString(),
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
