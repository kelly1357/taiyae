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
exports.getThread = void 0;
const functions_1 = require("@azure/functions");
const db_1 = require("../db");
const sql = require("mssql");
function getThread(request, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = request.params.threadId;
        if (!threadId) {
            return {
                status: 400,
                body: "Please provide a threadId"
            };
        }
        try {
            const pool = yield (0, db_1.getPool)();
            // Get all posts for the thread
            const result = yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query(`
                SELECT 
                    p.PostID, p.Subject, p.Body, p.Created,
                    c.CharacterID as authorId, c.CharacterName as authorName, c.AvatarImage as authorImage,
                    pk.PackName as packName, pk.Colors,
                    c.Sex as sex, c.MonthsAge as age, hs.StatusValue as healthStatus
                FROM Post p
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN Pack pk ON c.PackID = pk.PackID
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
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
                createdAt: p.Created
            }));
            const thread = {
                id: threadId,
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
                createdAt: op.Created,
                replies: replies
            };
            return {
                jsonBody: thread
            };
        }
        catch (error) {
            context.error(error);
            return {
                status: 500,
                body: "Internal Server Error"
            };
        }
    });
}
exports.getThread = getThread;
functions_1.app.http('getThread', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getThread,
    route: 'threads/{threadId}'
});
//# sourceMappingURL=getThread.js.map