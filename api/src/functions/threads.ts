import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getThreads(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const regionId = request.query.get('regionId');

    if (!regionId) {
        return { status: 400, body: "regionId is required" };
    }

    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('regionId', sql.Int, parseInt(regionId))
            .query(`
                SELECT 
                    t.ThreadID as id,
                    t.RegionId as regionId,
                    t.Created as createdAt,
                    t.Modified as updatedAt,
                    firstPost.Subject as title,
                    firstPost.Body as content,
                    threadAuthor.CharacterName as authorName,
                    threadAuthor.CharacterID as authorId,
                    CASE 
                        WHEN threadAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline,
                    (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                    0 as views,
                    lastPostAuthor.CharacterName as lastReplyAuthorName,
                    lastPost.Created as lastPostDate,
                    CASE 
                        WHEN lastPostAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as lastReplyIsOnline
                FROM Thread t
                CROSS APPLY (
                    SELECT TOP 1 * 
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created ASC
                ) firstPost
                LEFT JOIN Character threadAuthor ON firstPost.CharacterID = threadAuthor.CharacterID
                CROSS APPLY (
                    SELECT TOP 1 *
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created DESC
                ) lastPost
                LEFT JOIN Character lastPostAuthor ON lastPost.CharacterID = lastPostAuthor.CharacterID
                WHERE t.RegionId = @regionId
                ORDER BY lastPost.Created DESC
            `);

        return {
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function createThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { regionId, title, content, authorId } = body;

        if (!regionId || !title || !content || !authorId) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            // Get max ThreadID
            const maxThreadResult = await transaction.request().query("SELECT ISNULL(MAX(ThreadID), 0) + 1 as nextId FROM Thread");
            const nextThreadId = maxThreadResult.recordset[0].nextId;

            await transaction.request()
                .input('id', sql.Int, nextThreadId)
                .input('regionId', sql.Int, parseInt(regionId))
                .query(`
                    INSERT INTO Thread (ThreadID, RegionId, Created, Modified)
                    VALUES (@id, @regionId, GETDATE(), GETDATE())
                `);

            // Get max PostID
            const maxPostResult = await transaction.request().query("SELECT ISNULL(MAX(PostID), 0) + 1 as nextId FROM Post");
            const nextPostId = maxPostResult.recordset[0].nextId;

            await transaction.request()
                .input('id', sql.Int, nextPostId)
                .input('threadId', sql.Int, nextThreadId)
                .input('authorId', sql.Int, parseInt(authorId))
                .input('regionId', sql.Int, parseInt(regionId))
                .input('subject', sql.NVarChar, title)
                .input('body', sql.NVarChar, content)
                .query(`
                    INSERT INTO Post (PostID, ThreadID, CharacterID, RegionID, Subject, Body, Created, Modified)
                    VALUES (@id, @threadId, @authorId, @regionId, @subject, @body, GETDATE(), GETDATE())
                `);

            await transaction.commit();

            return {
                status: 201,
                jsonBody: { id: nextThreadId, message: "Thread created" }
            };

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getThreadsList', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getThreads,
    route: 'threads'
});

app.http('createNewThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createThread,
    route: 'threads' // Same route, different method
});

export async function createReply(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const threadId = request.params.threadId;
    
    if (!threadId) {
        return { status: 400, body: "threadId is required" };
    }

    try {
        const body = await request.json() as any;
        const { content, authorId } = body; 

        if (!content) {
            return { status: 400, body: "Content is required" };
        }

        const pool = await getPool();
        
        // We need regionId for the Post table. We can get it from the Thread table.
        const threadResult = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query("SELECT RegionId FROM Thread WHERE ThreadID = @threadId");
            
        const regionId = threadResult.recordset[0]?.RegionId;

        if (!regionId) {
             return { status: 404, body: "Thread not found" };
        }

        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('authorId', sql.Int, parseInt(authorId || 1)) // Default to 1 if not provided
            .input('regionId', sql.Int, regionId)
            .input('body', sql.NVarChar, content)
            .query(`
                INSERT INTO Post (ThreadID, CharacterID, RegionID, Subject, Body, Created, Modified)
                VALUES (@threadId, @authorId, @regionId, 'Reply', @body, GETDATE(), GETDATE())
            `);
            
        // Update Thread Modified date
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query("UPDATE Thread SET Modified = GETDATE() WHERE ThreadID = @threadId");

        return {
            status: 201,
            jsonBody: { message: "Reply posted" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('createReply', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createReply,
    route: 'threads/{threadId}/replies'
});

export async function updatePost(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const postId = request.params.postId;
    
    if (!postId) {
        return { status: 400, body: "postId is required" };
    }

    try {
        const body = await request.json() as any;
        const { content, modifiedByCharacterId } = body;

        if (!content || !modifiedByCharacterId) {
            return { status: 400, body: "Content and modifiedByCharacterId are required" };
        }

        const pool = await getPool();
        
        await pool.request()
            .input('postId', sql.Int, parseInt(postId))
            .input('body', sql.NVarChar, content)
            .input('modifiedByCharacterId', sql.Int, parseInt(modifiedByCharacterId))
            .query(`
                UPDATE Post 
                SET Body = @body, 
                    Modified = GETDATE(),
                    ModifiedByCharacterId = @modifiedByCharacterId
                WHERE PostID = @postId
            `);

        return {
            status: 200,
            jsonBody: { message: "Post updated" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('updatePost', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: updatePost,
    route: 'posts/{postId}'
});

export async function getLatestPosts(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .query(`
                SELECT TOP 10
                    p.PostID as id,
                    p.Subject as title,
                    p.Body as content,
                    p.Created as createdAt,
                    t.ThreadID as threadId,
                    r.RegionID as regionId,
                    r.RegionName as regionName,
                    c.CharacterName as authorName,
                    c.CharacterID as authorId,
                    c.AvatarImage as authorImage,
                    pk.PackName as packName,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline,
                    firstPost.Subject as threadTitle
                FROM Post p
                JOIN Thread t ON p.ThreadID = t.ThreadID
                JOIN Region r ON t.RegionID = r.RegionID
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN Pack pk ON c.PackID = pk.PackID
                CROSS APPLY (
                    SELECT TOP 1 Subject 
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created ASC
                ) firstPost
                ORDER BY p.Created DESC
            `);

        return {
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getLatestPosts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getLatestPosts,
    route: 'latest-posts'
});
