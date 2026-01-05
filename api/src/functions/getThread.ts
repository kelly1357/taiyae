import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const threadId = request.params.threadId;
    
    if (!threadId) {
        return {
            status: 400,
            body: "Please provide a threadId"
        };
    }

    try {
        const pool = await getPool();
        
        // Get all posts for the thread
        const result = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query(`
                SELECT 
                    p.PostID, p.Subject, p.Body, p.Created, p.Modified,
                    c.CharacterID as authorId, c.CharacterName as authorName, c.AvatarImage as authorImage,
                    pk.PackName as packName, pk.Colors,
                    c.Sex as sex, c.MonthsAge as age, hs.StatusValue as healthStatus,
                    (c.Experience + c.Physical + c.Knowledge) as skillPoints,
                    mc.CharacterName as modifiedByName,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline
                FROM Post p
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN Pack pk ON c.PackID = pk.PackID
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                LEFT JOIN Character mc ON p.ModifiedByCharacterId = mc.CharacterID
                WHERE p.ThreadID = @threadId
                ORDER BY p.Created ASC
            `);

        const posts = result.recordset;
        if (posts.length === 0) {
            return { status: 404, body: "Thread not found" };
        }

        const op = posts[0];
        const replies = posts.slice(1).map(p => ({
            id: p.PostID,
            content: p.Body,
            authorId: p.authorId,
            authorName: p.authorName,
            authorImage: p.authorImage,
            packName: p.packName,
            primaryColor: p.Colors ? p.Colors.split(',')[0] : null,
            secondaryColor: p.Colors ? p.Colors.split(',')[1] : null,
            sex: p.sex,
            age: p.age,
            healthStatus: p.healthStatus,
            skillPoints: p.skillPoints,
            isOnline: p.isOnline === 1,
            createdAt: p.Created,
            modifiedAt: p.Modified,
            modifiedByName: p.modifiedByName
        }));

        const thread = {
            id: threadId,
            postId: op.PostID,
            title: op.Subject,
            content: op.Body,
            authorId: op.authorId,
            authorName: op.authorName,
            authorImage: op.authorImage,
            packName: op.packName,
            primaryColor: op.Colors ? op.Colors.split(',')[0] : null,
            secondaryColor: op.Colors ? op.Colors.split(',')[1] : null,
            sex: op.sex,
            age: op.age,
            healthStatus: op.healthStatus,
            skillPoints: op.skillPoints,
            isOnline: op.isOnline === 1,
            createdAt: op.Created,
            modifiedAt: op.Modified,
            modifiedByName: op.modifiedByName,
            replies: replies
        };

        return {
            jsonBody: thread
        };
    } catch (error) {
        context.error(error);
        return {
            status: 500,
            body: "Internal Server Error"
        };
    }
}

app.http('getThread', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getThread,
    route: 'threads/{threadId}'
});
