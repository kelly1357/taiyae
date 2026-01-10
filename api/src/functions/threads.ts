import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getThreads(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const regionId = request.query.get('regionId');
    const oocForumId = request.query.get('oocForumId');

    if (!regionId && !oocForumId) {
        return { status: 400, body: "regionId or oocForumId is required" };
    }

    try {
        const pool = await getPool();
        
        let header = `SELECT 
                    t.ThreadID as id,
                    t.RegionId as regionId,
                    t.OOCForumID as oocForumId,
                    t.Created as createdAt,
                    t.Modified as updatedAt,
                    firstPost.Subject as title,
                    firstPost.Body as content,
                    COALESCE(threadAuthor.CharacterName, threadUser.Username) as authorName,
                    COALESCE(threadAuthor.CharacterID, threadUser.UserID) as authorId,
                    CASE 
                        WHEN threadAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        WHEN threadUser.Last_Login_IP IS NOT NULL AND threadUser.Modified > DATEADD(minute, -15, GETDATE()) THEN 1
                        ELSE 0 
                    END as isOnline,
                    (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                    0 as views,
                    COALESCE(lastPostAuthor.CharacterName, lastPostUser.Username) as lastReplyAuthorName,
                    lastPost.Created as lastPostDate,
                    CASE 
                        WHEN lastPostAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        WHEN lastPostUser.Last_Login_IP IS NOT NULL AND lastPostUser.Modified > DATEADD(minute, -15, GETDATE()) THEN 1
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
                LEFT JOIN [User] threadUser ON firstPost.UserID = threadUser.UserID
                CROSS APPLY (
                    SELECT TOP 1 *
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created DESC
                ) lastPost
                LEFT JOIN Character lastPostAuthor ON lastPost.CharacterID = lastPostAuthor.CharacterID
                LEFT JOIN [User] lastPostUser ON lastPost.UserID = lastPostUser.UserID`;

        const requestBuilder = pool.request();
        
        let whereClause = "";
        if (regionId) {
            whereClause = " WHERE t.RegionId = @regionId";
            requestBuilder.input('regionId', sql.Int, parseInt(regionId));
        } else {
            whereClause = " WHERE t.OOCForumID = @oocForumId";
            requestBuilder.input('oocForumId', sql.Int, parseInt(oocForumId));
        }
        
        const query = header + whereClause + " ORDER BY lastPost.Created DESC";

        const result = await requestBuilder.query(query);

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
        const { regionId, oocForumId, title, content, authorId } = body;

        if ((!regionId && !oocForumId) || !title || !content || !authorId) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            // Insert Thread and get generated ID
            let insertThreadSQL = "INSERT INTO Thread (Created, Modified";
            let valuesSQL = "VALUES (GETDATE(), GETDATE()";
            
            const req = transaction.request();
            
            if (regionId) {
                insertThreadSQL += ", RegionId)";
                valuesSQL += ", @regionId)";
                req.input('regionId', sql.Int, parseInt(regionId));
            } else {
                insertThreadSQL += ", OOCForumID)";
                valuesSQL += ", @oocForumId)";
                req.input('oocForumId', sql.Int, parseInt(oocForumId));
            }
            
            const threadQuery = `${insertThreadSQL} OUTPUT INSERTED.ThreadID ${valuesSQL}`;
            const threadResult = await req.query(threadQuery);
            
            const newThreadId = threadResult.recordset[0].ThreadID;

            const postReq = transaction.request()
                .input('threadId', sql.Int, newThreadId)
                .input('authorId', sql.Int, parseInt(authorId))
                .input('subject', sql.NVarChar, title)
                .input('body', sql.NVarChar, content);
                
            let insertPostSQL = "INSERT INTO Post (ThreadID, Subject, Body, Created, Modified";
            let postValuesSQL = "VALUES (@threadId, @subject, @body, GETDATE(), GETDATE()";
            
            if (regionId) {
                insertPostSQL += ", RegionID, CharacterID)";
                postValuesSQL += ", @regionId, @authorId)";
                postReq.input('regionId', sql.Int, parseInt(regionId));
            } else {
                 insertPostSQL += ", UserID)";
                 postValuesSQL += ", @authorId)";
            }

            await postReq.query(insertPostSQL + postValuesSQL);

            await transaction.commit();

            return {
                status: 201,
                jsonBody: { id: newThreadId, message: "Thread created" }
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
        
        const threadResult = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query("SELECT RegionId, OOCForumID, IsArchived FROM Thread WHERE ThreadID = @threadId");
            
        const thread = threadResult.recordset[0];
        if (!thread) {
             return { status: 404, body: "Thread not found" };
        }

        // Check if thread is archived
        if (thread.IsArchived) {
            return { status: 403, body: "This thread has been archived and is closed for new replies" };
        }

        const req = pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('authorId', sql.Int, parseInt(authorId || 1))
            .input('body', sql.NVarChar, content);
            
        let insertSQL = "INSERT INTO Post (ThreadID, Subject, Body, Created, Modified";
        let valuesSQL = "VALUES (@threadId, 'Reply', @body, GETDATE(), GETDATE()";

        if (thread.RegionId) {
             insertSQL += ", CharacterID, RegionID)";
             valuesSQL += ", @authorId, @regionId)";
             req.input('regionId', sql.Int, thread.RegionId);
        } else {
             // OOC
             insertSQL += ", UserID)";
             valuesSQL += ", @authorId)";
        }
        
        await req.query(insertSQL + valuesSQL);
            
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

export async function deletePost(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const postId = request.params.postId;
    
    if (!postId) {
        return { status: 400, body: "postId is required" };
    }

    try {
        const body = await request.json() as any;
        const { characterId, userId } = body;

        if (!characterId && !userId) {
            return { status: 400, body: "characterId or userId is required" };
        }

        const pool = await getPool();
        
        // Get the post to verify ownership
        const postResult = await pool.request()
            .input('postId', sql.Int, parseInt(postId))
            .query(`
                SELECT p.PostID, p.ThreadID, p.CharacterID, p.UserID,
                       c.UserID as characterOwnerUserId,
                       (SELECT COUNT(*) FROM Post WHERE ThreadID = p.ThreadID) as postCount,
                       (SELECT MIN(PostID) FROM Post WHERE ThreadID = p.ThreadID) as firstPostId
                FROM Post p
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                WHERE p.PostID = @postId
            `);

        if (postResult.recordset.length === 0) {
            return { status: 404, body: "Post not found" };
        }

        const post = postResult.recordset[0];

        // Verify the user owns this post
        const isOwner = (characterId && post.CharacterID === parseInt(characterId)) ||
                       (userId && (post.UserID === parseInt(userId) || post.characterOwnerUserId === parseInt(userId)));

        if (!isOwner) {
            return { status: 403, body: "You can only delete your own posts" };
        }

        // Don't allow deleting the first post (thread starter) - use archive instead
        if (post.PostID === post.firstPostId) {
            return { status: 400, body: "Cannot delete the first post. Use archive thread instead." };
        }

        // Delete the post
        await pool.request()
            .input('postId', sql.Int, parseInt(postId))
            .query('DELETE FROM Post WHERE PostID = @postId');

        // Update the thread's modified date
        await pool.request()
            .input('threadId', sql.Int, post.ThreadID)
            .query('UPDATE Thread SET Modified = GETDATE() WHERE ThreadID = @threadId');

        return {
            status: 200,
            jsonBody: { message: "Post deleted successfully" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('deletePost', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deletePost,
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

export async function archiveThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const threadId = request.params.threadId;
    
    if (!threadId) {
        return { status: 400, body: "threadId is required" };
    }

    try {
        const body = await request.json() as any;
        const { userId } = body;

        if (!userId) {
            return { status: 400, body: "userId is required" };
        }

        const pool = await getPool();
        
        // Get the thread and verify the user is the creator
        const threadResult = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query(`
                SELECT t.ThreadID, t.RegionId, t.OOCForumID, t.IsArchived,
                       COALESCE(c.UserID, p.UserID) as creatorUserId
                FROM Thread t
                CROSS APPLY (
                    SELECT TOP 1 CharacterID, UserID
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created ASC
                ) p
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                WHERE t.ThreadID = @threadId
            `);

        if (threadResult.recordset.length === 0) {
            return { status: 404, body: "Thread not found" };
        }

        const thread = threadResult.recordset[0];

        // Check if user is the creator
        if (thread.creatorUserId !== parseInt(userId)) {
            return { status: 403, body: "You can only archive your own threads" };
        }

        // Check if already archived
        if (thread.IsArchived) {
            return { status: 400, body: "Thread is already archived" };
        }

        // Archive the thread: store original location, move to OOC Forum 7, set IsArchived
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('originalRegionId', sql.Int, thread.RegionId)
            .input('originalOOCForumID', sql.Int, thread.OOCForumID)
            .query(`
                UPDATE Thread 
                SET IsArchived = 1,
                    OriginalRegionId = @originalRegionId,
                    OriginalOOCForumID = @originalOOCForumID,
                    RegionId = NULL,
                    OOCForumID = 7,
                    Modified = GETDATE()
                WHERE ThreadID = @threadId
            `);

        return {
            status: 200,
            jsonBody: { message: "Thread archived successfully" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('archiveThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: archiveThread,
    route: 'threads/{threadId}/archive'
});
