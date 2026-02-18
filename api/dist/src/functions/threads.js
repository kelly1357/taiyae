"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllThreads = exports.updateThreadDetails = exports.toggleThreadPin = exports.unarchiveThread = exports.deleteThread = exports.archiveThread = exports.getLatestPosts = exports.deletePost = exports.updatePost = exports.createReply = exports.createThread = exports.getThreads = void 0;
const functions_1 = require("@azure/functions");
const db_1 = require("../db");
const sql = require("mssql");
const auth_1 = require("../auth");
function getThreads(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const regionId = request.query.get('regionId');
        const oocForumId = request.query.get('oocForumId');
        const subareaId = request.query.get('subareaId');
        if (!regionId && !oocForumId && !subareaId) {
            return { status: 400, body: "regionId, oocForumId, or subareaId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            const requestBuilder = pool.request();
            let whereClause;
            let orderByClause;
            if (subareaId) {
                whereClause = 't.SubareaID = @filterId';
                orderByClause = 'ORDER BY lastPost.Created DESC';
                requestBuilder.input('filterId', sql.NVarChar, subareaId);
            }
            else if (regionId) {
                whereClause = 't.RegionId = @filterId';
                orderByClause = 'ORDER BY lastPost.Created DESC';
                requestBuilder.input('filterId', sql.Int, parseInt(regionId));
            }
            else {
                whereClause = 't.OOCForumID = @filterId';
                orderByClause = 'ORDER BY t.IsPinned DESC, lastPost.Created DESC';
                requestBuilder.input('filterId', sql.Int, parseInt(oocForumId));
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
            const result = yield requestBuilder.query(query);
            return {
                jsonBody: result.recordset,
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.getThreads = getThreads;
function createThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = yield request.json();
            const { regionId, oocForumId, subareaId, title, content, authorId, subheader } = body;
            if ((!regionId && !oocForumId && !subareaId) || !title || !content || !authorId) {
                return { status: 400, body: "Missing required fields" };
            }
            // For region/subarea threads, verify user owns the character (authorId is characterId)
            // For OOC threads, verify user is authenticated and authorId matches their userId
            if (regionId || subareaId) {
                const auth = yield (0, auth_1.verifyCharacterOwnershipOrStaff)(request, parseInt(authorId));
                if (!auth.authorized) {
                    return auth.error;
                }
            }
            else {
                const auth = yield (0, auth_1.verifyAuth)(request);
                if (!auth.authorized) {
                    return auth.error;
                }
                // For OOC, authorId is userId - verify it matches logged in user (or staff)
                if (!auth.isAdmin && !auth.isModerator && auth.userId !== parseInt(authorId)) {
                    return { status: 403, jsonBody: { error: 'You can only post as yourself' } };
                }
            }
            const pool = yield (0, db_1.getPool)();
            const transaction = new sql.Transaction(pool);
            yield transaction.begin();
            try {
                // Insert Thread and get generated ID
                let insertThreadSQL = "INSERT INTO Thread (Created, Modified, Subheader";
                let valuesSQL = "VALUES (GETDATE(), GETDATE(), @subheader";
                const req = transaction.request();
                req.input('subheader', sql.NVarChar, subheader || null);
                if (subareaId) {
                    // Subarea threads also need to reference the parent region for proper categorization
                    insertThreadSQL += ", SubareaID, RegionId)";
                    valuesSQL += ", @subareaId, @regionId)";
                    req.input('subareaId', sql.NVarChar, subareaId);
                    // Need to look up the region ID from the subarea
                    const subareaLookup = yield pool.request()
                        .input('subareaId', sql.NVarChar, subareaId)
                        .query(`SELECT regionId FROM Subareas WHERE id = @subareaId`);
                    if (subareaLookup.recordset.length > 0) {
                        // Convert slug-based regionId to numeric
                        const regionSlug = subareaLookup.recordset[0].regionId;
                        const regionLookup = yield pool.request()
                            .input('regionSlug', sql.NVarChar, regionSlug)
                            .query(`SELECT RegionID FROM Region WHERE LOWER(REPLACE(RegionName, ' ', '-')) = @regionSlug`);
                        if (regionLookup.recordset.length > 0) {
                            req.input('regionId', sql.Int, regionLookup.recordset[0].RegionID);
                        }
                        else {
                            req.input('regionId', sql.Int, null);
                        }
                    }
                    else {
                        req.input('regionId', sql.Int, null);
                    }
                }
                else if (regionId) {
                    insertThreadSQL += ", RegionId)";
                    valuesSQL += ", @regionId)";
                    req.input('regionId', sql.Int, parseInt(regionId));
                }
                else {
                    insertThreadSQL += ", OOCForumID)";
                    valuesSQL += ", @oocForumId)";
                    req.input('oocForumId', sql.Int, parseInt(oocForumId));
                }
                const threadQuery = `${insertThreadSQL} OUTPUT INSERTED.ThreadID ${valuesSQL}`;
                const threadResult = yield req.query(threadQuery);
                const newThreadId = threadResult.recordset[0].ThreadID;
                const postReq = transaction.request()
                    .input('threadId', sql.Int, newThreadId)
                    .input('authorId', sql.Int, parseInt(authorId))
                    .input('subject', sql.NVarChar, title)
                    .input('body', sql.NVarChar, content);
                let insertPostSQL = "INSERT INTO Post (ThreadID, Subject, Body, Created, Modified";
                let postValuesSQL = "VALUES (@threadId, @subject, @body, GETDATE(), GETDATE()";
                if (regionId || subareaId) {
                    insertPostSQL += ", RegionID, CharacterID)";
                    postValuesSQL += ", @postRegionId, @authorId)";
                    // For subareas, we need to get the numeric region ID
                    if (subareaId) {
                        const subareaLookup = yield pool.request()
                            .input('subareaId', sql.NVarChar, subareaId)
                            .query(`SELECT regionId FROM Subareas WHERE id = @subareaId`);
                        if (subareaLookup.recordset.length > 0) {
                            const regionSlug = subareaLookup.recordset[0].regionId;
                            const regionLookup = yield pool.request()
                                .input('regionSlug', sql.NVarChar, regionSlug)
                                .query(`SELECT RegionID FROM Region WHERE LOWER(REPLACE(RegionName, ' ', '-')) = @regionSlug`);
                            if (regionLookup.recordset.length > 0) {
                                postReq.input('postRegionId', sql.Int, regionLookup.recordset[0].RegionID);
                            }
                            else {
                                postReq.input('postRegionId', sql.Int, null);
                            }
                        }
                        else {
                            postReq.input('postRegionId', sql.Int, null);
                        }
                    }
                    else {
                        postReq.input('postRegionId', sql.Int, parseInt(regionId));
                    }
                }
                else {
                    insertPostSQL += ", UserID)";
                    postValuesSQL += ", @authorId)";
                }
                yield postReq.query(insertPostSQL + postValuesSQL);
                yield transaction.commit();
                return {
                    status: 201,
                    jsonBody: { id: newThreadId, message: "Thread created" }
                };
            }
            catch (err) {
                yield transaction.rollback();
                throw err;
            }
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.createThread = createThread;
functions_1.app.http('getThreadsList', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getThreads,
    route: 'threads'
});
functions_1.app.http('createNewThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createThread,
    route: 'threads' // Same route, different method
});
function createReply(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "threadId is required" };
        }
        try {
            const body = yield request.json();
            const { content, authorId } = body;
            if (!content) {
                return { status: 400, body: "Content is required" };
            }
            const pool = yield (0, db_1.getPool)();
            const threadResult = yield pool.request()
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
            // Verify auth based on thread type
            if (thread.RegionId) {
                // For region threads, verify user owns the character
                const auth = yield (0, auth_1.verifyCharacterOwnershipOrStaff)(request, parseInt(authorId || 1));
                if (!auth.authorized) {
                    return auth.error;
                }
            }
            else {
                // For OOC threads, verify user is authenticated and authorId matches
                const auth = yield (0, auth_1.verifyAuth)(request);
                if (!auth.authorized) {
                    return auth.error;
                }
                if (!auth.isAdmin && !auth.isModerator && auth.userId !== parseInt(authorId || 1)) {
                    return { status: 403, jsonBody: { error: 'You can only post as yourself' } };
                }
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
            }
            else {
                // OOC
                insertSQL += ", UserID)";
                valuesSQL += ", @authorId)";
            }
            yield req.query(insertSQL + valuesSQL);
            // Auto-reactivate character if they were inactive (only for roleplay region posts)
            if (thread.RegionId && authorId) {
                yield pool.request()
                    .input('characterId', sql.Int, parseInt(authorId))
                    .query(`
                    UPDATE Character 
                    SET Status = 'Active', Is_Active = 1 
                    WHERE CharacterID = @characterId AND Status = 'Inactive'
                `);
            }
            // Update Thread Modified date
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query("UPDATE Thread SET Modified = GETDATE() WHERE ThreadID = @threadId");
            return {
                status: 201,
                jsonBody: { message: "Reply posted" }
            };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.createReply = createReply;
functions_1.app.http('createReply', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createReply,
    route: 'threads/{threadId}/replies'
});
function updatePost(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify authentication
        const auth = yield (0, auth_1.verifyAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const postId = request.params.postId;
        if (!postId) {
            return { status: 400, body: "postId is required" };
        }
        try {
            const body = yield request.json();
            const { content, modifiedByCharacterId, modifiedByUserId } = body;
            if (!content || (!modifiedByCharacterId && !modifiedByUserId)) {
                return { status: 400, body: "Content and either modifiedByCharacterId or modifiedByUserId are required" };
            }
            const pool = yield (0, db_1.getPool)();
            // Verify user owns this post (or is staff)
            if (!auth.isAdmin && !auth.isModerator) {
                const postResult = yield pool.request()
                    .input('postId', sql.Int, parseInt(postId))
                    .query(`
                    SELECT p.CharacterID, p.UserID, c.UserID as characterOwnerUserId
                    FROM Post p
                    LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                    WHERE p.PostID = @postId
                `);
                if (postResult.recordset.length === 0) {
                    return { status: 404, body: "Post not found" };
                }
                const post = postResult.recordset[0];
                const isOwner = (post.UserID === auth.userId) || (post.characterOwnerUserId === auth.userId);
                if (!isOwner) {
                    return { status: 403, jsonBody: { error: 'You can only edit your own posts' } };
                }
            }
            // Use different update based on whether it's a character or user edit
            if (modifiedByCharacterId) {
                yield pool.request()
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
            }
            else {
                yield pool.request()
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.updatePost = updatePost;
functions_1.app.http('updatePost', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: updatePost,
    route: 'posts/{postId}'
});
function deletePost(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify authentication via JWT
        const auth = yield (0, auth_1.verifyAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const postId = request.params.postId;
        if (!postId) {
            return { status: 400, body: "postId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Get the post to verify ownership
            const postResult = yield pool.request()
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
            // Verify the user owns this post OR is staff
            const isOwner = (post.UserID === auth.userId) || (post.characterOwnerUserId === auth.userId);
            if (!isOwner && !auth.isAdmin && !auth.isModerator) {
                return { status: 403, body: "You can only delete your own posts" };
            }
            // Don't allow deleting the first post (thread starter) - use archive or delete thread instead
            if (post.PostID === post.firstPostId) {
                return { status: 400, body: "Cannot delete the first post. Use archive thread or delete thread instead." };
            }
            // Delete the post
            yield pool.request()
                .input('postId', sql.Int, parseInt(postId))
                .query('DELETE FROM Post WHERE PostID = @postId');
            // Update the thread's modified date
            yield pool.request()
                .input('threadId', sql.Int, post.ThreadID)
                .query('UPDATE Thread SET Modified = GETDATE() WHERE ThreadID = @threadId');
            return {
                status: 200,
                jsonBody: { message: "Post deleted successfully" }
            };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.deletePost = deletePost;
functions_1.app.http('deletePost', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deletePost,
    route: 'posts/{postId}'
});
function getLatestPosts(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield (0, db_1.getPool)();
            const result = yield pool.request()
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
                    pk.name as packName,
                    pk.slug as packSlug,
                    pk.color1 as packColor1,
                    pk.color2 as packColor2,
                    pr.name as packRankName,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline,
                    firstPost.Subject as threadTitle
                FROM Post p
                JOIN Thread t ON p.ThreadID = t.ThreadID
                JOIN Region r ON t.RegionID = r.RegionID
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN Packs pk ON c.PackID = pk.id
                LEFT JOIN PackRanks pr ON c.packRankId = pr.id
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.getLatestPosts = getLatestPosts;
functions_1.app.http('getLatestPosts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getLatestPosts,
    route: 'latest-posts'
});
function archiveThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify authentication via JWT
        const auth = yield (0, auth_1.verifyAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "threadId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Get the thread and verify the user is the creator
            const threadResult = yield pool.request()
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
            // Check if user is the creator OR is staff
            if (thread.creatorUserId !== auth.userId && !auth.isAdmin && !auth.isModerator) {
                return { status: 403, body: "You can only archive your own threads" };
            }
            // Check if already archived
            if (thread.IsArchived) {
                return { status: 400, body: "Thread is already archived" };
            }
            // Archive the thread: store original location, move to OOC Forum 7, set IsArchived
            yield pool.request()
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.archiveThread = archiveThread;
functions_1.app.http('archiveThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: archiveThread,
    route: 'threads/{threadId}/archive'
});
// DELETE /api/threads/:threadId - Delete an entire thread (moderator only)
function deleteThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify staff authorization via JWT
        const auth = yield (0, auth_1.verifyStaffAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "threadId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Verify the thread exists
            const threadCheck = yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query('SELECT ThreadID FROM Thread WHERE ThreadID = @threadId');
            if (threadCheck.recordset.length === 0) {
                return { status: 404, body: "Thread not found" };
            }
            // Delete all skill point assignments for this thread
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query('DELETE FROM CharacterSkillPointsAssignment WHERE ThreadID = @threadId');
            // Delete all posts in the thread
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query('DELETE FROM Post WHERE ThreadID = @threadId');
            // Delete the thread
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query('DELETE FROM Thread WHERE ThreadID = @threadId');
            return {
                status: 200,
                jsonBody: { message: "Thread deleted successfully" }
            };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.deleteThread = deleteThread;
functions_1.app.http('deleteThread', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deleteThread,
    route: 'threads/{threadId}'
});
// POST /api/threads/:threadId/unarchive - Unarchive a thread (moderator only)
// Reverses skill points and deletes all claims, then restores thread to original location
function unarchiveThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify staff authorization via JWT
        const auth = yield (0, auth_1.verifyStaffAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "threadId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Get the thread and verify it's archived
            const threadResult = yield pool.request()
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
            yield pool.request()
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
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query('DELETE FROM CharacterSkillPointsAssignment WHERE ThreadID = @threadId');
            // Step 3: Restore thread to original location
            yield pool.request()
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.unarchiveThread = unarchiveThread;
functions_1.app.http('unarchiveThread', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: unarchiveThread,
    route: 'threads/{threadId}/unarchive'
});
// Toggle pin status for OOC forum threads (moderator/admin only)
function toggleThreadPin(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify staff authorization via JWT
        const auth = yield (0, auth_1.verifyStaffAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "Thread ID is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Check if thread exists and is in an OOC forum
            const threadCheck = yield pool.request()
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
            yield pool.request()
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.toggleThreadPin = toggleThreadPin;
functions_1.app.http('toggleThreadPin', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: toggleThreadPin,
    route: 'threads/{threadId}/pin'
});
// Update thread title and subheader
function updateThreadDetails(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify authentication via JWT
        const auth = yield (0, auth_1.verifyAuth)(request);
        if (!auth.authorized) {
            return auth.error;
        }
        const threadId = request.params.threadId;
        if (!threadId) {
            return { status: 400, body: "Thread ID is required" };
        }
        try {
            const body = yield request.json();
            const { title, subheader } = body;
            if (!title || !title.trim()) {
                return { status: 400, body: "Title is required" };
            }
            const pool = yield (0, db_1.getPool)();
            // Verify user owns this thread (or is staff)
            if (!auth.isAdmin && !auth.isModerator) {
                const threadResult = yield pool.request()
                    .input('threadId', sql.Int, parseInt(threadId))
                    .query(`
                    SELECT COALESCE(c.UserID, p.UserID) as creatorUserId
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
                if (threadResult.recordset[0].creatorUserId !== auth.userId) {
                    return { status: 403, jsonBody: { error: 'You can only edit your own threads' } };
                }
            }
            // Update the thread's subheader
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .input('subheader', sql.NVarChar, (subheader === null || subheader === void 0 ? void 0 : subheader.trim()) || null)
                .query('UPDATE Thread SET Subheader = @subheader, Modified = GETDATE() WHERE ThreadID = @threadId');
            // Update the first post's subject (title)
            yield pool.request()
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
                    subheader: (subheader === null || subheader === void 0 ? void 0 : subheader.trim()) || null
                }
            };
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.updateThreadDetails = updateThreadDetails;
functions_1.app.http('updateThreadDetails', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: updateThreadDetails,
    route: 'threads/{threadId}/details'
});
// Optimized endpoint to get all threads across all regions in a single query
function getAllThreads(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield (0, db_1.getPool)();
            // Use CROSS APPLY pattern - simpler and reliable
            const result = yield pool.request()
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
                        ELSE 0
                    END as isOnline,
                    (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                    COALESCE(lastPostAuthor.CharacterName, lastPostUser.Username) as lastReplyAuthorName,
                    lastPostAuthor.CharacterID as lastReplyAuthorId,
                    lastPostAuthor.Slug as lastReplyAuthorSlug,
                    lastPost.Created as lastPostDate,
                    CASE
                        WHEN lastPostAuthor.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1
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
        }
        catch (error) {
            context.error(error);
            return { status: 500, body: "Internal Server Error" };
        }
    });
}
exports.getAllThreads = getAllThreads;
functions_1.app.http('getAllThreads', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getAllThreads,
    route: 'all-threads'
});
//# sourceMappingURL=threads.js.map