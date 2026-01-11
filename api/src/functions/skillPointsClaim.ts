import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// POST /api/skill-points-claim
// Submit skill point claims for a character on a thread
export async function submitSkillPointsClaim(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { characterId, threadId, skillPointIds } = body;

        if (!characterId || !threadId || !skillPointIds || !Array.isArray(skillPointIds) || skillPointIds.length === 0) {
            return { status: 400, body: "characterId, threadId, and skillPointIds array are required" };
        }

        const pool = await getPool();

        // Verify the character exists
        const charCheck = await pool.request()
            .input('characterId', sql.Int, characterId)
            .query('SELECT CharacterID FROM Character WHERE CharacterID = @characterId');
        
        if (charCheck.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }

        // Verify the thread exists and is archived
        const threadCheck = await pool.request()
            .input('threadId', sql.Int, threadId)
            .query('SELECT ThreadID, IsArchived FROM Thread WHERE ThreadID = @threadId');
        
        if (threadCheck.recordset.length === 0) {
            return { status: 404, body: "Thread not found" };
        }

        if (!threadCheck.recordset[0].IsArchived) {
            return { status: 400, body: "Thread must be archived before claiming skill points" };
        }

        // Verify the character has posted in this thread
        const postCheck = await pool.request()
            .input('characterId', sql.Int, characterId)
            .input('threadId', sql.Int, threadId)
            .query('SELECT COUNT(*) as postCount FROM Post WHERE CharacterID = @characterId AND ThreadID = @threadId');
        
        if (postCheck.recordset[0].postCount === 0) {
            return { status: 400, body: "Character has not posted in this thread" };
        }

        // Insert each skill point claim
        const insertedIds: number[] = [];
        for (const skillPointId of skillPointIds) {
            const result = await pool.request()
                .input('characterId', sql.Int, characterId)
                .input('skillPointId', sql.Int, skillPointId)
                .input('threadId', sql.Int, threadId)
                .query(`
                    INSERT INTO CharacterSkillPointsAssignment (CharacterID, SkillPointID, ThreadID, IsModeratorApproved)
                    OUTPUT INSERTED.AssignmentID
                    VALUES (@characterId, @skillPointId, @threadId, 0)
                `);
            insertedIds.push(result.recordset[0].AssignmentID);
        }

        return {
            status: 201,
            jsonBody: { 
                success: true, 
                message: `${insertedIds.length} skill point claim(s) submitted for moderator review`,
                assignmentIds: insertedIds
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

// GET /api/skill-points-claim?characterId=X&threadId=Y
// Get existing skill point claims for a character on a thread
export async function getSkillPointsClaims(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const characterId = request.query.get('characterId');
        const threadId = request.query.get('threadId');

        if (!characterId || !threadId) {
            return { status: 400, body: "characterId and threadId are required" };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('threadId', sql.Int, parseInt(threadId))
            .query(`
                SELECT 
                    a.AssignmentID,
                    a.SkillPointID,
                    a.IsModeratorApproved,
                    sp.Category,
                    sp.[Action],
                    sp.E,
                    sp.P,
                    sp.K,
                    sp.TOTAL
                FROM CharacterSkillPointsAssignment a
                JOIN SkillPoints sp ON a.SkillPointID = sp.SkillID
                WHERE a.CharacterID = @characterId AND a.ThreadID = @threadId
            `);

        return {
            jsonBody: result.recordset
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('submitSkillPointsClaim', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'skill-points-claim',
    handler: submitSkillPointsClaim
});

app.http('getSkillPointsClaims', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'skill-points-claim',
    handler: getSkillPointsClaims
});

// GET /api/character-skill-points/:characterId
// Get all approved skill point claims for a character, grouped by thread
export async function getCharacterSkillPoints(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const characterId = request.params.characterId;

        if (!characterId) {
            return { status: 400, body: "characterId is required" };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                SELECT 
                    a.AssignmentID,
                    a.ThreadID,
                    a.CharacterID,
                    sp.[Action],
                    sp.E,
                    sp.P,
                    sp.K,
                    sp.TOTAL
                FROM CharacterSkillPointsAssignment a
                JOIN SkillPoints sp ON a.SkillPointID = sp.SkillID
                WHERE a.CharacterID = @characterId 
                  AND a.IsModeratorApproved = 1
                ORDER BY a.ThreadID
            `);

        return {
            jsonBody: result.recordset
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getCharacterSkillPoints', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'character-skill-points/{characterId}',
    handler: getCharacterSkillPoints
});

// POST /api/skill-points-undo/:assignmentId
// Undo an approved skill point claim - reverses points and sets back to pending (moderator only)
export async function undoSkillPointApproval(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const assignmentId = request.params.assignmentId;
        const body = await request.json() as any;
        const { userId } = body;

        if (!assignmentId) {
            return { status: 400, body: "assignmentId is required" };
        }

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
            return { status: 403, body: "Only moderators can undo skill point approvals" };
        }

        // Get the assignment details
        const assignmentResult = await pool.request()
            .input('assignmentId', sql.Int, parseInt(assignmentId))
            .query(`
                SELECT a.AssignmentID, a.CharacterID, a.IsModeratorApproved,
                       sp.E, sp.P, sp.K
                FROM CharacterSkillPointsAssignment a
                JOIN SkillPoints sp ON a.SkillPointID = sp.SkillID
                WHERE a.AssignmentID = @assignmentId
            `);

        if (assignmentResult.recordset.length === 0) {
            return { status: 404, body: "Assignment not found" };
        }

        const assignment = assignmentResult.recordset[0];

        if (assignment.IsModeratorApproved !== true && assignment.IsModeratorApproved !== 1) {
            return { status: 400, body: "This claim is not currently approved" };
        }

        // Reverse the skill points from the character
        await pool.request()
            .input('characterId', sql.Int, assignment.CharacterID)
            .input('e', sql.Int, assignment.E || 0)
            .input('p', sql.Int, assignment.P || 0)
            .input('k', sql.Int, assignment.K || 0)
            .query(`
                UPDATE Character 
                SET Experience = Experience - @e,
                    Physical = Physical - @p,
                    Knowledge = Knowledge - @k
                WHERE CharacterID = @characterId
            `);

        // Set back to pending (NULL)
        await pool.request()
            .input('assignmentId', sql.Int, parseInt(assignmentId))
            .query(`
                UPDATE CharacterSkillPointsAssignment 
                SET IsModeratorApproved = NULL 
                WHERE AssignmentID = @assignmentId
            `);

        return {
            status: 200,
            jsonBody: { message: "Skill point approval undone. Claim is now pending review." }
        };

    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('undoSkillPointApproval', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'skill-points-undo/{assignmentId}',
    handler: undoSkillPointApproval
});
