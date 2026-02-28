import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

export async function getRegions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            WITH ThreadCounts AS (
                SELECT 
                    RegionID,
                    COUNT(*) AS activeThreadCount
                FROM Thread
                WHERE IsArchived = 0
                GROUP BY RegionID
            ),
            PostCounts AS (
                SELECT 
                    t.RegionID,
                    COUNT(*) AS postCount
                FROM Post p
                JOIN Thread t ON p.ThreadID = t.ThreadID
                GROUP BY t.RegionID
            ),
            LatestThreadInfo AS (
                SELECT 
                    t.RegionID,
                    t.ThreadID,
                    firstPost.Subject AS threadTitle,
                    COALESCE(lastPostChar.CharacterName, lastPostUser.Username) AS lastPostAuthorName,
                    COALESCE(lastPostChar.CharacterID, lastPostUser.UserID) AS lastPostAuthorId,
                    CASE 
                        WHEN lastPostChar.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END AS lastPostIsOnline,
                    lastPost.Created AS lastPostDate,
                    ROW_NUMBER() OVER (PARTITION BY t.RegionID ORDER BY lastPost.Created DESC) AS rn
                FROM Thread t
                CROSS APPLY (
                    SELECT TOP 1 Subject FROM Post WHERE ThreadID = t.ThreadID ORDER BY Created ASC
                ) firstPost
                CROSS APPLY (
                    SELECT TOP 1 CharacterID, UserID, Created FROM Post WHERE ThreadID = t.ThreadID ORDER BY Created DESC
                ) lastPost
                LEFT JOIN Character lastPostChar ON lastPost.CharacterID = lastPostChar.CharacterID
                LEFT JOIN [User] lastPostUser ON lastPost.UserID = lastPostUser.UserID
                WHERE t.IsArchived = 0
            )
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
                ISNULL(tc.activeThreadCount, 0) AS activeThreadCount,
                ISNULL(pc.postCount, 0)         AS postCount,
                lt.ThreadID          AS latestThreadId,
                lt.threadTitle       AS latestThreadTitle,
                lt.lastPostAuthorName,
                lt.lastPostAuthorId,
                lt.lastPostIsOnline,
                lt.lastPostDate
            FROM Region r
            LEFT JOIN Subareas s ON LOWER(REPLACE(r.RegionName, ' ', '-')) = s.regionId
            LEFT JOIN PackSubareas ps ON s.id = ps.subareaId
            LEFT JOIN Packs p ON ps.packId = p.id AND p.isActive = 1
            LEFT JOIN ThreadCounts tc ON r.RegionID = tc.RegionID
            LEFT JOIN PostCounts pc ON r.RegionID = pc.RegionID
            LEFT JOIN LatestThreadInfo lt ON r.RegionID = lt.RegionID AND lt.rn = 1
        `);

        // Transform flat result into nested structure
        const regionsMap = new Map<string, any>();
        
        result.recordset.forEach(row => {
            if (!regionsMap.has(row.id)) {
                const latestThread = row.latestThreadId ? {
                    id: row.latestThreadId,
                    title: row.latestThreadTitle,
                    authorName: row.lastPostAuthorName,
                    authorId: row.lastPostAuthorId,
                    updatedAt: row.lastPostDate,
                    isOnline: row.lastPostIsOnline === 1
                } : undefined;

                regionsMap.set(row.id, {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    imageUrl: row.imageUrl,
                    headerImageUrl: row.headerImageUrl,
                    slug: row.regionSlug,
                    activeThreadCount: row.activeThreadCount || 0,
                    postCount: row.postCount || 0,
                    latestThread,
                    subareas: []
                });
            }
            
            if (row.subId) {
                const region = regionsMap.get(row.id);
                // Avoid duplicate subareas from pack joins
                if (!region.subareas.some((s: any) => s.id === row.subId)) {
                    region.subareas.push({
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

