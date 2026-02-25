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
            // Get all posts for the thread with region info
            // For OOC posts, UserID is stored directly in Post table
            // For IC posts, UserID is retrieved via Character table
            const result = yield pool.request()
                .input('threadId', sql.Int, parseInt(threadId))
                .query(`
                SELECT 
                    p.PostID, p.Subject, p.Body, p.Created, p.Modified,
                    c.CharacterID as authorId, c.Slug as authorSlug, c.CharacterName as authorName, c.Surname as authorSurname, c.AvatarImage as authorImage,
                    pk.name as packName, pk.slug as packSlug, pk.color1 as packColor1, pk.color2 as packColor2,
                    pr.name as packRankName,
                    c.Sex as sex, c.MonthsAge as age, hs.StatusValue as healthStatus,
                    c.Status as characterStatus,
                    (c.Experience + c.Physical + c.Knowledge) as skillPoints,
                    COALESCE(mc.CharacterName, mu.Username) as modifiedByName,
                    t.RegionID as regionId,
                    t.OOCForumID as oocForumId,
                    t.Subheader as subheader,
                    t.IsArchived as isArchived,
                    t.IsClosed as isClosed,
                    t.OriginalRegionId as originalRegionId,
                    COALESCE(r.RegionName, origR.RegionName) as regionName,
                    LOWER(REPLACE(COALESCE(r.RegionName, origR.RegionName), ' ', '-')) as regionSlug,
                    COALESCE(r.ImageURL, origR.ImageURL) as regionImage,
                    oocf.Title as oocForumName,
                    COALESCE(u.Username, oocUser.Username) as playerName,
                    COALESCE(u.UserID, oocUser.UserID) as userId,
                    COALESCE(u.Is_Moderator, oocUser.Is_Moderator) as isModerator,
                    COALESCE(u.Is_Admin, oocUser.Is_Admin) as isAdmin,
                    COALESCE(u.Is_Absent, oocUser.Is_Absent) as isAbsent,
                    COALESCE(u.Absence_Note, oocUser.Absence_Note) as absenceNote,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline
                FROM Post p
                LEFT JOIN Thread t ON p.ThreadID = t.ThreadID
                LEFT JOIN Region r ON t.RegionID = r.RegionID
                LEFT JOIN Region origR ON t.OriginalRegionId = origR.RegionID
                LEFT JOIN OOCForum oocf ON t.OOCForumID = oocf.ID
                LEFT JOIN Character c ON p.CharacterID = c.CharacterID
                LEFT JOIN [User] u ON c.UserID = u.UserID
                LEFT JOIN [User] oocUser ON p.UserID = oocUser.UserID
                LEFT JOIN Packs pk ON c.PackID = pk.id
                LEFT JOIN PackRanks pr ON c.packRankId = pr.id
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                LEFT JOIN Character mc ON p.ModifiedByCharacterId = mc.CharacterID
                LEFT JOIN [User] mu ON p.ModifiedByUserId = mu.UserID
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
                authorSlug: p.authorSlug,
                authorName: p.authorName,
                authorSurname: p.authorSurname,
                authorImage: p.authorImage,
                packName: p.packName,
                packSlug: p.packSlug,
                packRankName: p.packRankName,
                primaryColor: p.packColor1 || null,
                secondaryColor: p.packColor2 || null,
                sex: p.sex,
                age: p.age,
                healthStatus: p.healthStatus,
                characterStatus: p.characterStatus,
                skillPoints: p.skillPoints,
                isOnline: p.isOnline === 1,
                playerName: p.playerName,
                userId: p.userId,
                isModerator: p.isModerator === true || p.isModerator === 1,
                isAdmin: p.isAdmin === true || p.isAdmin === 1,
                isAbsent: p.isAbsent === true || p.isAbsent === 1,
                absenceNote: p.absenceNote || null,
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
                authorSlug: op.authorSlug,
                authorName: op.authorName,
                authorSurname: op.authorSurname,
                authorImage: op.authorImage,
                packName: op.packName,
                packSlug: op.packSlug,
                packRankName: op.packRankName,
                primaryColor: op.packColor1 || null,
                secondaryColor: op.packColor2 || null,
                sex: op.sex,
                age: op.age,
                healthStatus: op.healthStatus,
                characterStatus: op.characterStatus,
                skillPoints: op.skillPoints,
                isOnline: op.isOnline === 1,
                playerName: op.playerName,
                userId: op.userId,
                isModerator: op.isModerator === true || op.isModerator === 1,
                isAdmin: op.isAdmin === true || op.isAdmin === 1,
                isAbsent: op.isAbsent === true || op.isAbsent === 1,
                absenceNote: op.absenceNote || null,
                createdAt: op.Created,
                modifiedAt: op.Modified,
                modifiedByName: op.modifiedByName,
                regionId: op.regionId,
                regionSlug: op.regionSlug,
                oocForumId: op.oocForumId,
                oocForumName: op.oocForumName,
                subheader: op.subheader,
                regionName: op.regionName,
                regionImage: op.regionImage,
                isArchived: op.isArchived === true || op.isArchived === 1,
                isClosed: op.isClosed === true || op.isClosed === 1,
                originalRegionId: op.originalRegionId,
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