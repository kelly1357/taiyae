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
                    a.Created,
                    sp.Category,
                    sp.Action,
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
