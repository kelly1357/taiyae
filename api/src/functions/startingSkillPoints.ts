import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyCharacterOwnershipOrStaff } from "../auth";

// GET /api/starting-skill-points/:characterId
// Check if a character has already claimed starting SP and return their info
export async function getStartingSkillPoints(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const characterId = request.params.characterId;
        if (!characterId) {
            return { status: 400, body: "characterId is required" };
        }

        const auth = await verifyCharacterOwnershipOrStaff(request, parseInt(characterId));
        if (!auth.authorized) {
            return auth.error!;
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                SELECT CharacterID, CharacterName, Surname, MonthsAge, 
                       Experience, Physical, Knowledge, HasClaimedStartingSP
                FROM Character 
                WHERE CharacterID = @characterId
            `);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }

        const char = result.recordset[0];
        const totalAllowed = char.MonthsAge < 12 ? 50 : 100;

        return {
            status: 200,
            jsonBody: {
                characterId: char.CharacterID,
                name: char.CharacterName,
                surname: char.Surname,
                monthsAge: char.MonthsAge,
                totalAllowed,
                hasClaimed: char.HasClaimedStartingSP,
                experience: char.Experience || 0,
                physical: char.Physical || 0,
                knowledge: char.Knowledge || 0
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

// POST /api/starting-skill-points
// Submit starting skill points allocation — one-time only, locked in permanently
export async function submitStartingSkillPoints(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { characterId, experience, physical, knowledge } = body;

        if (!characterId || experience === undefined || physical === undefined || knowledge === undefined) {
            return { status: 400, body: "characterId, experience, physical, and knowledge are required" };
        }

        const e = parseInt(experience);
        const p = parseInt(physical);
        const k = parseInt(knowledge);

        if (isNaN(e) || isNaN(p) || isNaN(k) || e < 0 || p < 0 || k < 0) {
            return { status: 400, body: "experience, physical, and knowledge must be non-negative integers" };
        }

        const auth = await verifyCharacterOwnershipOrStaff(request, parseInt(characterId));
        if (!auth.authorized) {
            return auth.error!;
        }

        const pool = await getPool();

        // Get character info to validate
        const charResult = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                SELECT CharacterID, MonthsAge, HasClaimedStartingSP 
                FROM Character 
                WHERE CharacterID = @characterId
            `);

        if (charResult.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }

        const char = charResult.recordset[0];

        if (char.HasClaimedStartingSP) {
            return { status: 400, body: "Starting skill points have already been claimed for this character. This cannot be changed." };
        }

        const totalAllowed = char.MonthsAge < 12 ? 50 : 100;
        const total = e + p + k;

        if (total !== totalAllowed) {
            return { status: 400, body: `Total must equal exactly ${totalAllowed} skill points. You claimed ${total}.` };
        }

        // Apply the starting skill points — add to existing values and lock it in
        await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('e', sql.Int, e)
            .input('p', sql.Int, p)
            .input('k', sql.Int, k)
            .query(`
                UPDATE Character 
                SET Experience = ISNULL(Experience, 0) + @e,
                    Physical = ISNULL(Physical, 0) + @p,
                    Knowledge = ISNULL(Knowledge, 0) + @k,
                    HasClaimedStartingSP = 1
                WHERE CharacterID = @characterId
            `);

        return {
            status: 200,
            jsonBody: { 
                success: true, 
                message: `Starting skill points (${totalAllowed} SP) claimed successfully! Experience: ${e}, Physical: ${p}, Knowledge: ${k}` 
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getStartingSkillPoints', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'starting-skill-points/{characterId}',
    handler: getStartingSkillPoints
});

app.http('submitStartingSkillPoints', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'starting-skill-points',
    handler: submitStartingSkillPoints
});
