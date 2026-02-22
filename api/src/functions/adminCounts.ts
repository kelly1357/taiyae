import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import { verifyStaffAuth } from "../auth";

// GET /api/admin/counts
// Returns all admin notification badge counts in a single request
export async function getAdminCounts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const pool = await getPool();

        // Run all count queries in a single batch
        const result = await pool.request().query(`
            -- Skill Points
            SELECT COUNT(*) AS skillPoints
            FROM CharacterSkillPointsAssignment
            WHERE IsModeratorApproved IS NULL;

            -- Plot News (grouped)
            SELECT COUNT(*) AS plotNews FROM (
                SELECT 1
                FROM PlotNews
                WHERE IsApproved = 0
                GROUP BY NewsText, ISNULL(ThreadURL, ''), SubmittedByUserID
            ) grouped;

            -- Achievements
            SELECT COUNT(*) AS achievements
            FROM AchievementRequest
            WHERE Status = 'pending';

            -- Inactive Characters
            SELECT COUNT(*) AS inactiveCharacters
            FROM Character c
            WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
              AND DATEDIFF(day,
                    COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created),
                    GETDATE()
                  ) >= 30;

            -- Staff Pings
            SELECT COUNT(*) AS staffPings
            FROM StaffPing
            WHERE IsResolved = 0;

            -- User Approvals
            SELECT COUNT(*) AS userApprovals
            FROM [User]
            WHERE UserStatusID = 1;
        `);

        return {
            status: 200,
            jsonBody: {
                skillPoints: result.recordsets[0][0].skillPoints,
                plotNews: result.recordsets[1][0].plotNews,
                achievements: result.recordsets[2][0].achievements,
                inactiveCharacters: result.recordsets[3][0].inactiveCharacters,
                staffPings: result.recordsets[4][0].staffPings,
                userApprovals: result.recordsets[5][0].userApprovals,
            }
        };
    } catch (error) {
        context.error('Error fetching admin counts:', error);
        return { status: 500, jsonBody: { error: 'Failed to fetch admin counts' } };
    }
}

app.http('getAdminCounts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'admin/counts',
    handler: getAdminCounts
});
