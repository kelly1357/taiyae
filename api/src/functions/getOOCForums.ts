import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getOOCForums(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                f.ID as id,
                f.Title as title,
                f.Description as description,
                f.ImageURL as imageUrl,
                (SELECT COUNT(*) FROM Thread WHERE OOCForumID = f.ID) as activeThreads,
                (
                    SELECT COUNT(*) 
                    FROM Post p 
                    JOIN Thread t ON p.ThreadID = t.ThreadID 
                    WHERE t.OOCForumID = f.ID
                ) - (SELECT COUNT(*) FROM Thread WHERE OOCForumID = f.ID) as totalReplies,
                latestThread.ThreadID as latestThreadId,
                latestThread.Subject as latestThreadTitle,
                latestThread.Modified as latestThreadUpdatedAt,
                latestThreadAuthor.Username as latestThreadAuthorName,
                latestThreadAuthor.UserID as latestThreadAuthorId,
                latestThreadAuthor.CharacterID as latestThreadCharacterId
            FROM OOCForum f
            OUTER APPLY (
                SELECT TOP 1 t.ThreadID, firstPost.Subject, t.Modified, t.Created
                FROM Thread t
                CROSS APPLY (
                    SELECT TOP 1 Subject 
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created ASC
                ) firstPost
                WHERE t.OOCForumID = f.ID
                ORDER BY t.Modified DESC
            ) latestThread
            OUTER APPLY (
                SELECT TOP 1 
                    COALESCE(c.CharacterName, u.Username) as Username,
                    COALESCE(cu.UserID, u.UserID) as UserID,
                    c.CharacterID as CharacterID
                FROM Post p
                LEFT JOIN [User] u ON p.UserID = u.UserID
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN [User] cu ON c.UserID = cu.UserID
                WHERE p.ThreadID = latestThread.ThreadID
                ORDER BY p.Created DESC
            ) latestThreadAuthor
        `);

        return {
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getOOCForums', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getOOCForums,
    route: 'ooc-forums'
});
