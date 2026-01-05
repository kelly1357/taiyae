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
exports.updatePost = exports.createReply = exports.createThread = exports.getThreads = void 0;
const functions_1 = require("@azure/functions");
const db_1 = require("../db");
const sql = require("mssql");
function getThreads(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const regionId = request.query.get('regionId');
        if (!regionId) {
            return { status: 400, body: "regionId is required" };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            const result = yield pool.request()
                .input('regionId', sql.Int, parseInt(regionId))
                .query(`
                SELECT 
                    t.ThreadID as id,
                    t.RegionId as regionId,
                    t.Created as createdAt,
                    t.Modified as updatedAt,
                    p.Subject as title,
                    p.Body as content,
                    c.CharacterName as authorName,
                    c.CharacterID as authorId,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline,
                    (SELECT COUNT(*) - 1 FROM Post WHERE ThreadID = t.ThreadID) as replyCount,
                    0 as views -- Placeholder
                FROM Thread t
                CROSS APPLY (
                    SELECT TOP 1 * 
                    FROM Post 
                    WHERE ThreadID = t.ThreadID 
                    ORDER BY Created ASC
                ) p
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                WHERE t.RegionId = @regionId
                ORDER BY t.Modified DESC
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
exports.getThreads = getThreads;
function createThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const body = yield request.json();
            const { regionId, title, content, authorId } = body;
            if (!regionId || !title || !content || !authorId) {
                return { status: 400, body: "Missing required fields" };
            }
            const pool = yield (0, db_1.getPool)();
            const transaction = new sql.Transaction(pool);
            yield transaction.begin();
            try {
                // Get max ThreadID
                const maxThreadResult = yield transaction.request().query("SELECT ISNULL(MAX(ThreadID), 0) + 1 as nextId FROM Thread");
                const nextThreadId = maxThreadResult.recordset[0].nextId;
                yield transaction.request()
                    .input('id', sql.Int, nextThreadId)
                    .input('regionId', sql.Int, parseInt(regionId))
                    .query(`
                    INSERT INTO Thread (ThreadID, RegionId, Created, Modified)
                    VALUES (@id, @regionId, GETDATE(), GETDATE())
                `);
                // Get max PostID
                const maxPostResult = yield transaction.request().query("SELECT ISNULL(MAX(PostID), 0) + 1 as nextId FROM Post");
                const nextPostId = maxPostResult.recordset[0].nextId;
                yield transaction.request()
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
                yield transaction.commit();
                return {
                    status: 201,
                    jsonBody: { id: nextThreadId, message: "Thread created" }
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
    var _a;
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
            // We need regionId for the Post table. We can get it from the Thread table.
            const threadResult = yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query("SELECT RegionId FROM Thread WHERE ThreadID = @threadId");
            const regionId = (_a = threadResult.recordset[0]) === null || _a === void 0 ? void 0 : _a.RegionId;
            if (!regionId) {
                return { status: 404, body: "Thread not found" };
            }
            yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .input('authorId', sql.Int, parseInt(authorId || 1)) // Default to 1 if not provided
                .input('regionId', sql.Int, regionId)
                .input('body', sql.NVarChar, content)
                .query(`
                INSERT INTO Post (ThreadID, CharacterID, RegionID, Subject, Body, Created, Modified)
                VALUES (@threadId, @authorId, @regionId, 'Reply', @body, GETDATE(), GETDATE())
            `);
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
        const postId = request.params.postId;
        if (!postId) {
            return { status: 400, body: "postId is required" };
        }
        try {
            const body = yield request.json();
            const { content, modifiedByCharacterId } = body;
            if (!content || !modifiedByCharacterId) {
                return { status: 400, body: "Content and modifiedByCharacterId are required" };
            }
            const pool = yield (0, db_1.getPool)();
            yield pool.request()
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
//# sourceMappingURL=threads.js.map