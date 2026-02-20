import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyCharacterOwnershipOrStaff, verifyStaffAuth } from "../auth";

// POST /api/skill-points-claim
// Submit skill point claims for a character on a thread
export async function submitSkillPointsClaim(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { characterId, threadId, skillPointIds, skillPointDetails } = body;

        // Support new format with details (notes/quantity) or legacy format with just IDs
        if (!characterId || !threadId) {
            return { status: 400, body: "characterId and threadId are required" };
        }

        // skillPointDetails is the new format: [{ skillPointId, note?, quantity? }, ...]
        // skillPointIds is the legacy format: [1, 2, 3, ...]
        const hasDetails = Array.isArray(skillPointDetails) && skillPointDetails.length > 0;
        const hasIds = Array.isArray(skillPointIds) && skillPointIds.length > 0;

        if (!hasDetails && !hasIds) {
            return { status: 400, body: "skillPointDetails or skillPointIds array is required" };
        }

        // Verify user owns this character
        const auth = await verifyCharacterOwnershipOrStaff(request, parseInt(characterId));
        if (!auth.authorized) {
            return auth.error!;
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
        // IsModeratorApproved: NULL = pending, 1 = approved, 0 = rejected
        const insertedIds: number[] = [];

        if (hasDetails) {
            // New format: each entry can have a note and quantity
            // For AllowMultiple actions, quantity > 1 creates multiple rows (one per instance, each with its own note)
            for (const detail of skillPointDetails) {
                const { skillPointId, notes, quantity } = detail;
                const qty = quantity || 1;
                // notes is an array of strings, one per instance
                const notesList: string[] = Array.isArray(notes) ? notes : (detail.note ? [detail.note] : []);

                for (let i = 0; i < qty; i++) {
                    const note = notesList[i] || null;
                    const result = await pool.request()
                        .input('characterId', sql.Int, characterId)
                        .input('skillPointId', sql.Int, skillPointId)
                        .input('threadId', sql.Int, threadId)
                        .input('note', sql.NVarChar(500), note)
                        .query(`
                            INSERT INTO CharacterSkillPointsAssignment (CharacterID, SkillPointID, ThreadID, IsModeratorApproved, Note)
                            OUTPUT INSERTED.AssignmentID
                            VALUES (@characterId, @skillPointId, @threadId, NULL, @note)
                        `);
                    insertedIds.push(result.recordset[0].AssignmentID);
                }
            }
        } else {
            // Legacy format: just skill point IDs, no notes
            for (const skillPointId of skillPointIds) {
                const result = await pool.request()
                    .input('characterId', sql.Int, characterId)
                    .input('skillPointId', sql.Int, skillPointId)
                    .input('threadId', sql.Int, threadId)
                    .query(`
                        INSERT INTO CharacterSkillPointsAssignment (CharacterID, SkillPointID, ThreadID, IsModeratorApproved)
                        OUTPUT INSERTED.AssignmentID
                        VALUES (@characterId, @skillPointId, @threadId, NULL)
                    `);
                insertedIds.push(result.recordset[0].AssignmentID);
            }
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

        // Verify user owns this character or is staff
        const auth = await verifyCharacterOwnershipOrStaff(request, parseInt(characterId));
        if (!auth.authorized) {
            return auth.error!;
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
                    a.Note,
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
                    a.Note,
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
    // Verify staff authorization via JWT
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const assignmentId = request.params.assignmentId;

        if (!assignmentId) {
            return { status: 400, body: "assignmentId is required" };
        }

        const pool = await getPool();

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
