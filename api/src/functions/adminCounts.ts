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

        // Run all count queries individually to avoid recordset indexing issues with multi-statement batches
        const [skillPointsRes, plotNewsRes, achievementsRes, inactiveRes, staffPingsRes, userApprovalsRes] = await Promise.all([
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM CharacterSkillPointsAssignment WHERE IsModeratorApproved IS NULL
            `),
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM (
                    SELECT 1 AS x FROM PlotNews WHERE IsApproved = 0
                    GROUP BY NewsText, ISNULL(ThreadURL, ''), SubmittedByUserID
                ) grouped
            `),
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM AchievementRequest WHERE Status = 'pending'
            `),
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM Character c
                WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
                  AND DATEDIFF(day,
                        COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created),
                        GETDATE()
                      ) >= 30
            `),
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM StaffPing WHERE IsResolved = 0
            `),
            pool.request().query(`
                SELECT COUNT(*) AS cnt FROM [User] WHERE UserStatusID = 1
            `),
        ]);

        return {
            status: 200,
            jsonBody: {
                skillPoints: skillPointsRes.recordset[0].cnt,
                plotNews: plotNewsRes.recordset[0].cnt,
                achievements: achievementsRes.recordset[0].cnt,
                inactiveCharacters: inactiveRes.recordset[0].cnt,
                staffPings: staffPingsRes.recordset[0].cnt,
                userApprovals: userApprovalsRes.recordset[0].cnt,
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
    route: 'staff-counts',
    handler: getAdminCounts
});
