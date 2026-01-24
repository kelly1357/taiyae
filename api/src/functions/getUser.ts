import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getAllUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT DISTINCT u.UserID, u.Username 
                FROM [User] u
                INNER JOIN Character c ON u.UserID = c.UserID
                WHERE c.Is_Active = 1
                ORDER BY u.Username
            `);
        return { status: 200, jsonBody: result.recordset };
    } catch (error) {
        context.error(error);
        return { status: 500, jsonBody: { body: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) } };
    }
}

export async function getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const id = request.params.id;
        if (!id) {
            return { status: 400, jsonBody: { body: "User ID is required" } };
        }
        const pool = await getPool();
        const userResult = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT UserID, Username, Email, Description, Facebook, Instagram, Discord, ImageURL, Is_Moderator, Is_Admin, UserStatusID FROM [User] WHERE UserID = @UserID');
        const user = userResult.recordset[0];
        if (!user) {
            return { status: 404, jsonBody: { body: "User not found" } };
        }
        // Add isModerator and isAdmin fields based on database columns
        const isModerator = user.Is_Moderator === true || user.Is_Moderator === 1;
        const isAdmin = user.Is_Admin === true || user.Is_Admin === 1;
        return { status: 200, jsonBody: { ...user, isModerator, isAdmin, role: isModerator ? 'moderator' : 'member' } };
    } catch (error) {
        context.error(error);
        return { status: 500, jsonBody: { body: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) } };
    }
}

app.http('getUser', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: getUser
});

app.http('getAllUsers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users',
    handler: getAllUsers
});

// Get all users with their admin/moderator status (admin only)
export async function getAllUsersWithStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return { status: 400, body: "Invalid JSON body" };
        }
        
        const { userId } = body;

        if (!userId) {
            return { status: 400, body: "User ID is required" };
        }

        const pool = await getPool();

        // Verify the requesting user is an admin
        const adminCheck = await pool.request()
            .input('userId', sql.Int, parseInt(String(userId)))
            .query('SELECT Is_Admin FROM [User] WHERE UserID = @userId');

        if (adminCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }

        const isAdmin = adminCheck.recordset[0].Is_Admin === true || adminCheck.recordset[0].Is_Admin === 1;
        if (!isAdmin) {
            return { status: 403, body: "Only administrators can view user permissions" };
        }

        // Get all users with their status
        const result = await pool.request()
            .query(`
                SELECT
                    u.UserID as id,
                    u.Username as username,
                    u.Email as email,
                    u.ImageURL as imageUrl,
                    u.Is_Moderator as isModerator,
                    u.Is_Admin as isAdmin,
                    u.UserStatusID as userStatusId,
                    u.Created as createdAt,
                    (SELECT COUNT(*) FROM Character c WHERE c.UserID = u.UserID) as characterCount,
                    (SELECT COUNT(*) FROM Character c WHERE c.UserID = u.UserID AND COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active') as activeCharacterCount
                FROM [User] u
                ORDER BY u.Username
            `);

        // Convert bit fields to booleans and add isBanned
        const users = result.recordset.map(u => ({
            ...u,
            isModerator: u.isModerator === true || u.isModerator === 1,
            isAdmin: u.isAdmin === true || u.isAdmin === 1,
            isBanned: u.userStatusId === 3
        }));

        return { status: 200, jsonBody: users };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Update user admin/moderator status (admin only)
export async function updateUserPermissions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const targetUserId = request.params.id;
        if (!targetUserId) {
            return { status: 400, body: "Target user ID is required" };
        }

        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return { status: 400, body: "Invalid JSON body" };
        }
        
        const { userId, isModerator, isAdmin } = body;

        if (!userId) {
            return { status: 400, body: "Requesting user ID is required" };
        }

        if (typeof isModerator !== 'boolean' && typeof isAdmin !== 'boolean') {
            return { status: 400, body: "At least one of isModerator or isAdmin must be provided" };
        }

        const pool = await getPool();

        // Verify the requesting user is an admin
        const adminCheck = await pool.request()
            .input('userId', sql.Int, parseInt(String(userId)))
            .query('SELECT Is_Admin FROM [User] WHERE UserID = @userId');

        if (adminCheck.recordset.length === 0) {
            return { status: 404, body: "Requesting user not found" };
        }

        const requestingUserIsAdmin = adminCheck.recordset[0].Is_Admin === true || adminCheck.recordset[0].Is_Admin === 1;
        if (!requestingUserIsAdmin) {
            return { status: 403, body: "Only administrators can modify user permissions" };
        }

        // Prevent admin from removing their own admin status
        if (parseInt(targetUserId) === parseInt(String(userId)) && isAdmin === false) {
            return { status: 400, body: "You cannot remove your own admin status" };
        }

        // Verify target user exists
        const targetCheck = await pool.request()
            .input('targetUserId', sql.Int, parseInt(targetUserId))
            .query('SELECT UserID, Username FROM [User] WHERE UserID = @targetUserId');

        if (targetCheck.recordset.length === 0) {
            return { status: 404, body: "Target user not found" };
        }

        // Build the update query
        const updates: string[] = [];
        const req = pool.request().input('targetUserId', sql.Int, parseInt(targetUserId));

        if (typeof isModerator === 'boolean') {
            updates.push('Is_Moderator = @isModerator');
            req.input('isModerator', sql.Bit, isModerator ? 1 : 0);
        }

        if (typeof isAdmin === 'boolean') {
            updates.push('Is_Admin = @isAdmin');
            req.input('isAdmin', sql.Bit, isAdmin ? 1 : 0);
        }

        await req.query(`
            UPDATE [User]
            SET ${updates.join(', ')}
            WHERE UserID = @targetUserId
        `);

        return { 
            status: 200, 
            jsonBody: { 
                success: true, 
                message: `Permissions updated for ${targetCheck.recordset[0].Username}` 
            } 
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getAllUsersWithStatus', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'moderation/user-permissions',
    handler: getAllUsersWithStatus
});

app.http('updateUserPermissions', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'moderation/user-permissions/{id}',
    handler: updateUserPermissions
});
