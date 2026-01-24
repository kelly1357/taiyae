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
        const requestBuilder = pool.request();
        
        let whereClause: string;
        let orderByClause: string;
        
        if (regionId) {
            whereClause = 't.RegionId = @filterId';
            orderByClause = 'ORDER BY lastPost.Created DESC';
            requestBuilder.input('filterId', sql.Int, parseInt(regionId));
        } else {
            whereClause = 't.OOCForumID = @filterId';
            orderByClause = 'ORDER BY t.IsPinned DESC, lastPost.Created DESC';
            requestBuilder.input('filterId', sql.Int, parseInt(oocForumId!));
        }

        // Use CROSS APPLY which is efficient for this pattern
        const query = `
            SELECT 
                t.ThreadID as id,
                t.RegionId as regionId,
                t.OOCForumID as oocForumId,
                t.IsPinned as isPinned,
                t.Subheader as subheader,
                t.Created as createdAt,
                t.Modified as updatedAt,
                firstPost.Subject as title,
                firstPost.Body as content,
                COALESCE(threadAuthor.CharacterName, threadUser.Username) as authorName,
                COALESCE(threadAuthor.CharacterID, threadUser.UserID) as authorId,
                threadAuthor.Slug as authorSlug,
                CASE 
                    WHEN threadAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                    WHEN threadUser.Last_Login_IP IS NOT NULL AND threadUser.Modified > DATEADD(minute, -15, GETDATE()) THEN 1
                    ELSE 0 
                END as isOnline,
                (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                0 as views,
                COALESCE(lastPostAuthor.CharacterName, lastPostUser.Username) as lastReplyAuthorName,
                lastPostAuthor.CharacterID as lastReplyAuthorId,
                lastPostAuthor.Slug as lastReplyAuthorSlug,
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
            LEFT JOIN [User] lastPostUser ON lastPost.UserID = lastPostUser.UserID
            WHERE ${whereClause}
            ${orderByClause}
        `;

        const result = await requestBuilder.query(query);

        return {
            jsonBody: result.recordset,
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function createThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { regionId, oocForumId, title, content, authorId, subheader } = body;

        if ((!regionId && !oocForumId) || !title || !content || !authorId) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();

        try {
            // Insert Thread and get generated ID
            let insertThreadSQL = "INSERT INTO Thread (Created, Modified, Subheader";
            let valuesSQL = "VALUES (GETDATE(), GETDATE(), @subheader";
            
            const req = transaction.request();
            req.input('subheader', sql.NVarChar, subheader || null);
            
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
        
        // Auto-reactivate character if they were inactive (only for roleplay region posts)
        if (thread.RegionId && authorId) {
            await pool.request()
                .input('characterId', sql.Int, parseInt(authorId))
                .query(`
                    UPDATE Character 
                    SET Status = 'Active', Is_Active = 1 
                    WHERE CharacterID = @characterId AND Status = 'Inactive'
                `);
        }
            
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
        const { content, modifiedByCharacterId, modifiedByUserId } = body;

        if (!content || (!modifiedByCharacterId && !modifiedByUserId)) {
            return { status: 400, body: "Content and either modifiedByCharacterId or modifiedByUserId are required" };
        }

        const pool = await getPool();
        
        // Use different update based on whether it's a character or user edit
        if (modifiedByCharacterId) {
            await pool.request()
                .input('postId', sql.Int, parseInt(postId))
                .input('body', sql.NVarChar, content)
                .input('modifiedByCharacterId', sql.Int, parseInt(modifiedByCharacterId))
                .query(`
                    UPDATE Post 
                    SET Body = @body, 
                        Modified = GETDATE(),
                        ModifiedByCharacterId = @modifiedByCharacterId,
                        ModifiedByUserId = NULL
                    WHERE PostID = @postId
                `);
        } else {
            await pool.request()
                .input('postId', sql.Int, parseInt(postId))
                .input('body', sql.NVarChar, content)
                .input('modifiedByUserId', sql.Int, parseInt(modifiedByUserId))
                .query(`
                    UPDATE Post 
                    SET Body = @body, 
                        Modified = GETDATE(),
                        ModifiedByCharacterId = NULL,
                        ModifiedByUserId = @modifiedByUserId
                    WHERE PostID = @postId
                `);
        }

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
        const { characterId, userId, isModerator } = body;

        if (!characterId && !userId) {
            return { status: 400, body: "characterId or userId is required" };
        }

        const pool = await getPool();
        
        // Verify moderator status if claimed
        let isActuallyModerator = false;
        if (isModerator && userId) {
            const modCheck = await pool.request()
                .input('userId', sql.Int, parseInt(userId))
                .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
            if (modCheck.recordset.length > 0) {
                isActuallyModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
            }
        }
        
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

        // Verify the user owns this post OR is a moderator
        const isOwner = (characterId && post.CharacterID === parseInt(characterId)) ||
                       (userId && (post.UserID === parseInt(userId) || post.characterOwnerUserId === parseInt(userId)));

        if (!isOwner && !isActuallyModerator) {
            return { status: 403, body: "You can only delete your own posts" };
        }

        // Don't allow deleting the first post (thread starter) - use archive or delete thread instead
        if (post.PostID === post.firstPostId) {
            return { status: 400, body: "Cannot delete the first post. Use archive thread or delete thread instead." };
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
        const { userId, isModerator } = body;

        if (!userId) {
            return { status: 400, body: "userId is required" };
        }

        const pool = await getPool();
        
        // Verify moderator status if claimed
        let isActuallyModerator = false;
        if (isModerator) {
            const modCheck = await pool.request()
                .input('userId', sql.Int, parseInt(userId))
                .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
            if (modCheck.recordset.length > 0) {
                isActuallyModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
            }
        }
        
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

        // Check if user is the creator OR is a moderator
        if (thread.creatorUserId !== parseInt(userId) && !isActuallyModerator) {
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

// DELETE /api/threads/:threadId - Delete an entire thread (moderator only)
export async function deleteThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        
        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can delete threads" };
        }
        
        // Verify the thread exists
        const threadCheck = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('SELECT ThreadID FROM Thread WHERE ThreadID = @threadId');
        
        if (threadCheck.recordset.length === 0) {
            return { status: 404, body: "Thread not found" };
        }

        // Delete all skill point assignments for this thread
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('DELETE FROM CharacterSkillPointsAssignment WHERE ThreadID = @threadId');

        // Delete all posts in the thread
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('DELETE FROM Post WHERE ThreadID = @threadId');

        // Delete the thread
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('DELETE FROM Thread WHERE ThreadID = @threadId');

        return {
            status: 200,
            jsonBody: { message: "Thread deleted successfully" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('deleteThread', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deleteThread,
    route: 'threads/{threadId}'
});

// POST /api/threads/:threadId/unarchive - Unarchive a thread (moderator only)
// Reverses skill points and deletes all claims, then restores thread to original location
export async function unarchiveThread(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
        
        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can unarchive threads" };
        }
        
        // Get the thread and verify it's archived
        const threadResult = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query(`
                SELECT ThreadID, IsArchived, OriginalRegionId, OriginalOOCForumID
                FROM Thread 
                WHERE ThreadID = @threadId
            `);
        
        if (threadResult.recordset.length === 0) {
            return { status: 404, body: "Thread not found" };
        }
        
        const thread = threadResult.recordset[0];
        
        if (!thread.IsArchived) {
            return { status: 400, body: "Thread is not archived" };
        }

        // Step 1: Reverse approved skill points for each character
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query(`
                UPDATE c
                SET c.Experience = c.Experience - ISNULL(sp.E, 0),
                    c.Physical = c.Physical - ISNULL(sp.P, 0),
                    c.Knowledge = c.Knowledge - ISNULL(sp.K, 0)
                FROM Character c
                JOIN CharacterSkillPointsAssignment a ON c.CharacterID = a.CharacterID
                JOIN SkillPoints sp ON a.SkillPointID = sp.SkillID
                WHERE a.ThreadID = @threadId AND a.IsModeratorApproved = 1
            `);

        // Step 2: Delete all skill point claims for this thread
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('DELETE FROM CharacterSkillPointsAssignment WHERE ThreadID = @threadId');

        // Step 3: Restore thread to original location
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('originalRegionId', sql.Int, thread.OriginalRegionId)
            .input('originalOOCForumID', sql.Int, thread.OriginalOOCForumID)
            .query(`
                UPDATE Thread 
                SET IsArchived = 0,
                    RegionId = @originalRegionId,
                    OOCForumID = @originalOOCForumID,
                    OriginalRegionId = NULL,
                    OriginalOOCForumID = NULL,
                    Modified = GETDATE()
                WHERE ThreadID = @threadId
            `);

        return {
            status: 200,
            jsonBody: { message: "Thread unarchived successfully. All skill point claims have been reversed and deleted." }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('unarchiveThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: unarchiveThread,
    route: 'threads/{threadId}/unarchive'
});

// Toggle pin status for OOC forum threads (moderator/admin only)
export async function toggleThreadPin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const threadId = request.params.threadId;

    if (!threadId) {
        return { status: 400, body: "Thread ID is required" };
    }

    try {
        const pool = await getPool();

        // Check if thread exists and is in an OOC forum
        const threadCheck = await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .query('SELECT ThreadID, OOCForumID, IsPinned FROM Thread WHERE ThreadID = @threadId');

        if (threadCheck.recordset.length === 0) {
            return { status: 404, body: "Thread not found" };
        }

        const thread = threadCheck.recordset[0];

        if (!thread.OOCForumID) {
            return { status: 400, body: "Only OOC forum threads can be pinned" };
        }

        // Toggle the pin status
        const newPinStatus = !thread.IsPinned;

        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('isPinned', sql.Bit, newPinStatus)
            .query('UPDATE Thread SET IsPinned = @isPinned WHERE ThreadID = @threadId');

        return {
            status: 200,
            jsonBody: { 
                message: newPinStatus ? "Thread pinned successfully" : "Thread unpinned successfully",
                isPinned: newPinStatus
            }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('toggleThreadPin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: toggleThreadPin,
    route: 'threads/{threadId}/pin'
});

// Update thread title and subheader
export async function updateThreadDetails(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const threadId = request.params.threadId;

    if (!threadId) {
        return { status: 400, body: "Thread ID is required" };
    }

    try {
        const body = await request.json() as any;
        const { title, subheader } = body;

        if (!title || !title.trim()) {
            return { status: 400, body: "Title is required" };
        }

        const pool = await getPool();

        // Update the thread's subheader
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('subheader', sql.NVarChar, subheader?.trim() || null)
            .query('UPDATE Thread SET Subheader = @subheader, Modified = GETDATE() WHERE ThreadID = @threadId');

        // Update the first post's subject (title)
        await pool.request()
            .input('threadId', sql.Int, parseInt(threadId))
            .input('title', sql.NVarChar, title.trim())
            .query(`
                UPDATE Post 
                SET Subject = @title, Modified = GETDATE()
                WHERE ThreadID = @threadId 
                AND PostID = (SELECT TOP 1 PostID FROM Post WHERE ThreadID = @threadId ORDER BY Created ASC)
            `);

        return {
            status: 200,
            jsonBody: { 
                message: "Thread updated successfully",
                title: title.trim(),
                subheader: subheader?.trim() || null
            }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('updateThreadDetails', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: updateThreadDetails,
    route: 'threads/{threadId}/details'
});

// Optimized endpoint to get all threads across all regions in a single query
export async function getAllThreads(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        // Use CROSS APPLY pattern - simpler and reliable
        const result = await pool.request()
            .query(`
                SELECT 
                    t.ThreadID as id,
                    t.RegionId as regionId,
                    r.RegionName as regionName,
                    t.IsPinned as isPinned,
                    t.Subheader as subheader,
                    t.Created as createdAt,
                    t.Modified as updatedAt,
                    firstPost.Subject as title,
                    firstPost.Body as content,
                    COALESCE(threadAuthor.CharacterName, threadUser.Username) as authorName,
                    COALESCE(threadAuthor.CharacterID, threadUser.UserID) as authorId,
                    threadAuthor.Slug as authorSlug,
                    CASE 
                        WHEN threadAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        WHEN threadUser.Last_Login_IP IS NOT NULL AND threadUser.Modified > DATEADD(minute, -15, GETDATE()) THEN 1
                        ELSE 0 
                    END as isOnline,
                    (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                    COALESCE(lastPostAuthor.CharacterName, lastPostUser.Username) as lastReplyAuthorName,
                    lastPostAuthor.CharacterID as lastReplyAuthorId,
                    lastPostAuthor.Slug as lastReplyAuthorSlug,
                    lastPost.Created as lastPostDate,
                    CASE 
                        WHEN lastPostAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        WHEN lastPostUser.Last_Login_IP IS NOT NULL AND lastPostUser.Modified > DATEADD(minute, -15, GETDATE()) THEN 1
                        ELSE 0 
                    END as lastReplyIsOnline
                FROM Thread t
                INNER JOIN Region r ON t.RegionId = r.RegionID
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
                LEFT JOIN [User] lastPostUser ON lastPost.UserID = lastPostUser.UserID
                WHERE t.RegionId IS NOT NULL
                  AND (t.IsArchived IS NULL OR t.IsArchived = 0)
                ORDER BY lastPost.Created DESC
            `);

        return {
            jsonBody: result.recordset,
            headers: { 'Cache-Control': 'public, max-age=30' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getAllThreads', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getAllThreads,
    route: 'all-threads'
});
