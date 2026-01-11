import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

// GET: Get all pending skill point assignments (IsModeratorApproved = 0 or NULL)
async function getPendingSkillPointAssignments(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT 
                cspa.AssignmentID,
                cspa.CharacterID,
                cspa.SkillPointID,
                cspa.ThreadID,
                cspa.IsModeratorApproved,
                c.CharacterName AS CharacterName,
                c.Surname AS CharacterSurname,
                c.AvatarImage AS AvatarImage,
                sp.[Action] AS SkillAction,
                sp.E,
                sp.P,
                sp.K,
                (SELECT TOP 1 p.Subject FROM Post p WHERE p.ThreadID = t.ThreadID ORDER BY p.Created ASC) AS ThreadTitle,
                -- Check for duplicates (same CharacterID, SkillPointID, ThreadID appearing more than once)
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM CharacterSkillPointsAssignment cspa2 
                        WHERE cspa2.CharacterID = cspa.CharacterID 
                        AND cspa2.SkillPointID = cspa.SkillPointID 
                        AND cspa2.ThreadID = cspa.ThreadID
                        AND cspa2.AssignmentID != cspa.AssignmentID
                    ) THEN 1
                    ELSE 0
                END AS IsDuplicate
            FROM CharacterSkillPointsAssignment cspa
            INNER JOIN Character c ON cspa.CharacterID = c.CharacterID
            INNER JOIN SkillPoints sp ON cspa.SkillPointID = sp.SkillID
            INNER JOIN Thread t ON cspa.ThreadID = t.ThreadID
            WHERE cspa.IsModeratorApproved = 0 OR cspa.IsModeratorApproved IS NULL
            ORDER BY cspa.AssignmentID DESC
        `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error('Error fetching pending skill point assignments:', error);
        return {
            status: 500,
            body: 'Failed to fetch pending skill point assignments'
        };
    }
}

// GET: Get count of pending skill point assignments (for notification badge)
async function getPendingSkillPointsCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM CharacterSkillPointsAssignment
            WHERE IsModeratorApproved = 0 OR IsModeratorApproved IS NULL
        `);

        return {
            status: 200,
            jsonBody: { count: result.recordset[0].count }
        };
    } catch (error) {
        context.error('Error fetching pending skill points count:', error);
        return {
            status: 500,
            body: 'Failed to fetch count'
        };
    }
}

// POST: Approve a skill point assignment
async function approveSkillPointAssignment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { assignmentId: number };
        const { assignmentId } = body;

        if (!assignmentId) {
            return {
                status: 400,
                body: 'Assignment ID is required'
            };
        }

        const pool = await getPool();
        
        // Update the assignment to approved
        await pool.request()
            .input('assignmentId', assignmentId)
            .query(`
                UPDATE CharacterSkillPointsAssignment
                SET IsModeratorApproved = 1
                WHERE AssignmentID = @assignmentId
            `);

        // Get the skill point values to add to character
        const skillResult = await pool.request()
            .input('assignmentId', assignmentId)
            .query(`
                SELECT cspa.CharacterID, sp.E, sp.P, sp.K
                FROM CharacterSkillPointsAssignment cspa
                INNER JOIN SkillPoints sp ON cspa.SkillPointID = sp.SkillID
                WHERE cspa.AssignmentID = @assignmentId
            `);

        if (skillResult.recordset.length > 0) {
            const { CharacterID, E, P, K } = skillResult.recordset[0];

            // Add skill points to character's respective columns
            await pool.request()
                .input('characterId', CharacterID)
                .input('e', E || 0)
                .input('p', P || 0)
                .input('k', K || 0)
                .query(`
                    UPDATE Character
                    SET Experience = ISNULL(Experience, 0) + @e,
                        Physical = ISNULL(Physical, 0) + @p,
                        Knowledge = ISNULL(Knowledge, 0) + @k
                    WHERE CharacterID = @characterId
                `);
        }

        return {
            status: 200,
            jsonBody: { message: 'Skill point assignment approved successfully' }
        };
    } catch (error) {
        context.error('Error approving skill point assignment:', error);
        return {
            status: 500,
            body: 'Failed to approve skill point assignment'
        };
    }
}

// DELETE: Reject/delete a skill point assignment
async function rejectSkillPointAssignment(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const assignmentId = request.params.assignmentId;

        if (!assignmentId) {
            return {
                status: 400,
                body: 'Assignment ID is required'
            };
        }

        const pool = await getPool();
        
        await pool.request()
            .input('assignmentId', assignmentId)
            .query(`
                DELETE FROM CharacterSkillPointsAssignment
                WHERE AssignmentID = @assignmentId
            `);

        return {
            status: 200,
            jsonBody: { message: 'Skill point assignment rejected' }
        };
    } catch (error) {
        context.error('Error rejecting skill point assignment:', error);
        return {
            status: 500,
            body: 'Failed to reject skill point assignment'
        };
    }
}

app.http('getPendingSkillPointAssignments', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'skill-points-approval',
    handler: getPendingSkillPointAssignments
});

app.http('getPendingSkillPointsCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'skill-points-approval/count',
    handler: getPendingSkillPointsCount
});

app.http('approveSkillPointAssignment', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'skill-points-approval/approve',
    handler: approveSkillPointAssignment
});

app.http('rejectSkillPointAssignment', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'skill-points-approval/{assignmentId}',
    handler: rejectSkillPointAssignment
});
