import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// SignalR output binding for broadcasting admin count updates
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'messaging',
});

// Helper to get current pending count
async function getCurrentPendingCount(): Promise<number> {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT COUNT(*) as count FROM AchievementRequest WHERE Status = 'pending'
    `);
    return result.recordset[0].count;
}

// GET /api/achievements - Get all achievements
export async function getAchievements(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id, name, description, imageUrl, isAutomated, automationKey
            FROM Achievement
            ORDER BY id
        `);
        return { status: 200, jsonBody: result.recordset };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// GET /api/achievements/user/:userId - Get achievements for a user
export async function getUserAchievements(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.params.userId;
    if (!userId) return { status: 400, body: "Missing user ID" };

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                SELECT 
                    a.id, a.name, a.description, a.imageUrl, a.isAutomated,
                    ua.AwardedAt, ua.AwardedByUserID
                FROM UserAchievement ua
                JOIN Achievement a ON ua.AchievementID = a.id
                WHERE ua.UserID = @userId
                ORDER BY ua.AwardedAt DESC
            `);
        return { status: 200, jsonBody: result.recordset };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/achievements/check - Check and award automated achievements for a user
export async function checkAutomatedAchievements(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId } = body;

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        const pool = await getPool();
        const awarded: any[] = [];

        // Get user info
        const userResult = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT UserID, Created FROM [User] WHERE UserID = @userId');
        
        if (userResult.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }

        const user = userResult.recordset[0];
        const userCreated = new Date(user.Created);
        const now = new Date();
        const monthsSinceCreation = (now.getFullYear() - userCreated.getFullYear()) * 12 + (now.getMonth() - userCreated.getMonth());

        // Get all automated achievements the user doesn't have yet
        const unearned = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                SELECT a.id, a.automationKey
                FROM Achievement a
                WHERE a.isAutomated = 1
                AND a.id NOT IN (SELECT AchievementID FROM UserAchievement WHERE UserID = @userId)
            `);

        for (const achievement of unearned.recordset) {
            let shouldAward = false;

            switch (achievement.automationKey) {
                case 'IC_POSTS_100':
                case 'IC_POSTS_250':
                case 'IC_POSTS_500':
                case 'IC_POSTS_1000': {
                    const threshold = parseInt(achievement.automationKey.split('_')[2]);
                    const icPostCount = await pool.request()
                        .input('userId', sql.Int, parseInt(userId))
                        .query(`
                            SELECT COUNT(*) as cnt
                            FROM Post p
                            JOIN Character c ON p.CharacterID = c.CharacterID
                            JOIN Thread t ON p.ThreadID = t.ThreadID
                            WHERE c.UserID = @userId
                            AND (t.OOCForumID IS NULL OR t.OriginalRegionId IS NOT NULL)
                        `);
                    if (icPostCount.recordset[0].cnt >= threshold) {
                        shouldAward = true;
                    }
                    break;
                }

                case 'OOC_POSTS_100':
                case 'OOC_POSTS_500': {
                    const threshold = parseInt(achievement.automationKey.split('_')[2]);
                    const oocPostCount = await pool.request()
                        .input('userId', sql.Int, parseInt(userId))
                        .query(`
                            SELECT COUNT(*) as cnt
                            FROM Post p
                            JOIN Thread t ON p.ThreadID = t.ThreadID
                            WHERE p.UserID = @userId
                            AND t.OOCForumID IS NOT NULL
                            AND t.OriginalRegionId IS NULL
                        `);
                    if (oocPostCount.recordset[0].cnt >= threshold) {
                        shouldAward = true;
                    }
                    break;
                }

                case 'ACCOUNT_2_MONTHS':
                    if (monthsSinceCreation >= 2) shouldAward = true;
                    break;

                case 'ACCOUNT_6_MONTHS':
                    if (monthsSinceCreation >= 6) shouldAward = true;
                    break;

                case 'ACCOUNT_1_YEAR':
                    if (monthsSinceCreation >= 12) shouldAward = true;
                    break;

                case 'PLOT_REPORTER_10': {
                    const plotNewsCount = await pool.request()
                        .input('userId', sql.Int, parseInt(userId))
                        .query(`
                            SELECT COUNT(*) as cnt
                            FROM PlotNews
                            WHERE SubmittedByUserID = @userId
                            AND IsApproved = 1
                        `);
                    if (plotNewsCount.recordset[0].cnt >= 10) {
                        shouldAward = true;
                    }
                    break;
                }

                case 'FULL_PROFILE': {
                    // Check if user has at least one character with all required fields filled
                    // Requires: name, sex, age, general info, avatar, at least one profile image,
                    // height, build, birthplace, father, mother, siblings, pups, spirit symbol
                    // Surname is optional
                    const fullProfileCheck = await pool.request()
                        .input('userId', sql.Int, parseInt(userId))
                        .query(`
                            SELECT COUNT(*) as cnt
                            FROM Character
                            WHERE UserID = @userId
                            AND CharacterName IS NOT NULL AND CharacterName != ''
                            AND Sex IS NOT NULL AND Sex != ''
                            AND MonthsAge IS NOT NULL
                            AND CI_General_HTML IS NOT NULL AND CI_General_HTML != ''
                            AND AvatarImage IS NOT NULL AND AvatarImage != ''
                            AND HeightID IS NOT NULL
                            AND BuildID IS NOT NULL
                            AND Birthplace IS NOT NULL AND Birthplace != ''
                            AND Father IS NOT NULL AND Father != ''
                            AND Mother IS NOT NULL AND Mother != ''
                            AND Siblings IS NOT NULL AND Siblings != ''
                            AND Pups IS NOT NULL AND Pups != ''
                            AND SpiritSymbol IS NOT NULL AND SpiritSymbol != ''
                            AND (
                                (ProfileImage1 IS NOT NULL AND ProfileImage1 != '')
                                OR (ProfileImage2 IS NOT NULL AND ProfileImage2 != '')
                                OR (ProfileImage3 IS NOT NULL AND ProfileImage3 != '')
                                OR (ProfileImage4 IS NOT NULL AND ProfileImage4 != '')
                            )
                        `);
                    if (fullProfileCheck.recordset[0].cnt > 0) {
                        shouldAward = true;
                    }
                    break;
                }
            }

            if (shouldAward) {
                await pool.request()
                    .input('userId', sql.Int, parseInt(userId))
                    .input('achievementId', sql.Int, achievement.id)
                    .query(`
                        INSERT INTO UserAchievement (UserID, AchievementID, AwardedAt, AwardedByUserID)
                        VALUES (@userId, @achievementId, GETDATE(), NULL)
                    `);
                awarded.push(achievement.id);
            }
        }

        return { status: 200, jsonBody: { awarded } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/achievements/request - Submit achievement request
export async function submitAchievementRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId, achievementId, note } = body;

        if (!userId || !achievementId) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();

        // Check if user already has this achievement
        const existing = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('achievementId', sql.Int, parseInt(achievementId))
            .query(`
                SELECT 1 FROM UserAchievement 
                WHERE UserID = @userId AND AchievementID = @achievementId
            `);

        if (existing.recordset.length > 0) {
            return { status: 400, body: "You already have this achievement" };
        }

        // Check if there's a pending request
        const pendingCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('achievementId', sql.Int, parseInt(achievementId))
            .query(`
                SELECT 1 FROM AchievementRequest 
                WHERE UserID = @userId AND AchievementID = @achievementId AND Status = 'pending'
            `);

        if (pendingCheck.recordset.length > 0) {
            return { status: 400, body: "You already have a pending request for this achievement" };
        }

        await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('achievementId', sql.Int, parseInt(achievementId))
            .input('note', sql.NVarChar, note || null)
            .query(`
                INSERT INTO AchievementRequest (UserID, AchievementID, RequestNote)
                VALUES (@userId, @achievementId, @note)
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'achievements', count: newCount }]
        }]);

        return { status: 200, body: "Request submitted successfully" };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// GET /api/achievements/requests/pending - Get pending achievement requests (admin)
export async function getPendingAchievementRequests(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                ar.RequestID,
                ar.UserID,
                u.Username,
                ar.AchievementID,
                a.name as AchievementName,
                a.imageUrl as AchievementImage,
                ar.RequestNote,
                ar.RequestedAt
            FROM AchievementRequest ar
            JOIN [User] u ON ar.UserID = u.UserID
            JOIN Achievement a ON ar.AchievementID = a.id
            WHERE ar.Status = 'pending'
            ORDER BY ar.RequestedAt ASC
        `);
        return { status: 200, jsonBody: result.recordset };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// GET /api/achievements/requests/pending/count - Get count of pending requests
export async function getPendingAchievementRequestsCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT COUNT(*) as count FROM AchievementRequest WHERE Status = 'pending'
        `);
        return { status: 200, jsonBody: { count: result.recordset[0].count } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/achievements/requests/:id/approve - Approve achievement request
export async function approveAchievementRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const requestId = request.params.id;
    if (!requestId) return { status: 400, body: "Missing request ID" };

    try {
        const body = await request.json() as any;
        const { moderatorUserId } = body;

        if (!moderatorUserId) {
            return { status: 400, body: "Missing moderator user ID" };
        }

        const pool = await getPool();

        // Verify moderator
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(moderatorUserId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0 || (!modCheck.recordset[0].Is_Moderator && !modCheck.recordset[0].Is_Admin)) {
            return { status: 403, body: "Only moderators can approve requests" };
        }

        // Get request details
        const requestResult = await pool.request()
            .input('requestId', sql.Int, parseInt(requestId))
            .query(`
                SELECT UserID, AchievementID FROM AchievementRequest 
                WHERE RequestID = @requestId AND Status = 'pending'
            `);

        if (requestResult.recordset.length === 0) {
            return { status: 404, body: "Request not found or already processed" };
        }

        const req = requestResult.recordset[0];

        // Award the achievement
        await pool.request()
            .input('userId', sql.Int, req.UserID)
            .input('achievementId', sql.Int, req.AchievementID)
            .input('moderatorUserId', sql.Int, parseInt(moderatorUserId))
            .query(`
                INSERT INTO UserAchievement (UserID, AchievementID, AwardedAt, AwardedByUserID)
                VALUES (@userId, @achievementId, GETDATE(), @moderatorUserId)
            `);

        // Update request status
        await pool.request()
            .input('requestId', sql.Int, parseInt(requestId))
            .input('moderatorUserId', sql.Int, parseInt(moderatorUserId))
            .query(`
                UPDATE AchievementRequest
                SET Status = 'approved', ReviewedByUserID = @moderatorUserId, ReviewedAt = GETDATE()
                WHERE RequestID = @requestId
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'achievements', count: newCount }]
        }]);

        return { status: 200, body: "Request approved" };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/achievements/requests/:id/reject - Reject achievement request
export async function rejectAchievementRequest(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const requestId = request.params.id;
    if (!requestId) return { status: 400, body: "Missing request ID" };

    try {
        const body = await request.json() as any;
        const { moderatorUserId, reviewNote } = body;

        if (!moderatorUserId) {
            return { status: 400, body: "Missing moderator user ID" };
        }

        const pool = await getPool();

        // Verify moderator
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(moderatorUserId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0 || (!modCheck.recordset[0].Is_Moderator && !modCheck.recordset[0].Is_Admin)) {
            return { status: 403, body: "Only moderators can reject requests" };
        }

        await pool.request()
            .input('requestId', sql.Int, parseInt(requestId))
            .input('moderatorUserId', sql.Int, parseInt(moderatorUserId))
            .input('reviewNote', sql.NVarChar, reviewNote || null)
            .query(`
                UPDATE AchievementRequest
                SET Status = 'rejected', ReviewedByUserID = @moderatorUserId, ReviewedAt = GETDATE(), ReviewNote = @reviewNote
                WHERE RequestID = @requestId AND Status = 'pending'
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'achievements', count: newCount }]
        }]);

        return { status: 200, body: "Request rejected" };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/achievements/award - Manually award an achievement (admin)
export async function awardAchievement(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId, achievementId, moderatorUserId } = body;

        if (!userId || !achievementId || !moderatorUserId) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();

        // Verify moderator
        const modCheck = await pool.request()
            .input('modUserId', sql.Int, parseInt(moderatorUserId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @modUserId');
        
        if (modCheck.recordset.length === 0 || (!modCheck.recordset[0].Is_Moderator && !modCheck.recordset[0].Is_Admin)) {
            return { status: 403, body: "Only moderators can award achievements" };
        }

        // Check if already awarded
        const existing = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('achievementId', sql.Int, parseInt(achievementId))
            .query('SELECT 1 FROM UserAchievement WHERE UserID = @userId AND AchievementID = @achievementId');

        if (existing.recordset.length > 0) {
            return { status: 400, body: "User already has this achievement" };
        }

        await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('achievementId', sql.Int, parseInt(achievementId))
            .input('moderatorUserId', sql.Int, parseInt(moderatorUserId))
            .query(`
                INSERT INTO UserAchievement (UserID, AchievementID, AwardedAt, AwardedByUserID)
                VALUES (@userId, @achievementId, GETDATE(), @moderatorUserId)
            `);

        return { status: 200, body: "Achievement awarded" };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// Register routes
app.http('getAchievements', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'achievements',
    handler: getAchievements
});

app.http('getUserAchievements', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'achievements/user/{userId}',
    handler: getUserAchievements
});

app.http('checkAutomatedAchievements', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'achievements/check',
    handler: checkAutomatedAchievements
});

app.http('submitAchievementRequest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'achievements/request',
    extraOutputs: [signalROutput],
    handler: submitAchievementRequest
});

app.http('getPendingAchievementRequests', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'achievements/requests/pending',
    handler: getPendingAchievementRequests
});

app.http('getPendingAchievementRequestsCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'achievements/requests/pending/count',
    handler: getPendingAchievementRequestsCount
});

app.http('approveAchievementRequest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'achievements/requests/{id}/approve',
    extraOutputs: [signalROutput],
    handler: approveAchievementRequest
});

app.http('rejectAchievementRequest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'achievements/requests/{id}/reject',
    extraOutputs: [signalROutput],
    handler: rejectAchievementRequest
});

app.http('awardAchievement', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'achievements/award',
    handler: awardAchievement
});

// Helper function to check and revoke FULL_PROFILE achievement if criteria no longer met
// Called from characters.ts when a character profile is updated
export async function checkAndRevokeFullProfile(userId: number): Promise<void> {
    const pool = await getPool();
    
    // Check if user still has any character meeting FULL_PROFILE criteria
    const fullProfileCheck = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            SELECT COUNT(*) as cnt
            FROM Character
            WHERE UserID = @userId
            AND CharacterName IS NOT NULL AND CharacterName != ''
            AND Sex IS NOT NULL AND Sex != ''
            AND MonthsAge IS NOT NULL
            AND CI_General_HTML IS NOT NULL AND CI_General_HTML != ''
            AND AvatarImage IS NOT NULL AND AvatarImage != ''
            AND HeightID IS NOT NULL
            AND BuildID IS NOT NULL
            AND Birthplace IS NOT NULL AND Birthplace != ''
            AND Father IS NOT NULL AND Father != ''
            AND Mother IS NOT NULL AND Mother != ''
            AND Siblings IS NOT NULL AND Siblings != ''
            AND Pups IS NOT NULL AND Pups != ''
            AND SpiritSymbol IS NOT NULL AND SpiritSymbol != ''
            AND (
                (ProfileImage1 IS NOT NULL AND ProfileImage1 != '')
                OR (ProfileImage2 IS NOT NULL AND ProfileImage2 != '')
                OR (ProfileImage3 IS NOT NULL AND ProfileImage3 != '')
                OR (ProfileImage4 IS NOT NULL AND ProfileImage4 != '')
            )
        `);
    
    // If no characters meet criteria, revoke the achievement
    if (fullProfileCheck.recordset[0].cnt === 0) {
        await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                DELETE FROM UserAchievement
                WHERE UserID = @userId
                AND AchievementID = (SELECT id FROM Achievement WHERE automationKey = 'FULL_PROFILE')
            `);
    }
}
