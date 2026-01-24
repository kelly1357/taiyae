import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// SignalR output binding for broadcasting admin count updates
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'messaging',
});

// Helper to get current pending count (users with status = Joining)
async function getCurrentPendingCount(): Promise<number> {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT COUNT(*) AS count
        FROM [User]
        WHERE UserStatusID = 1
    `);
    return result.recordset[0].count;
}

// GET: Get all pending user approvals (UserStatusID = 1 = Joining)
async function getPendingUserApprovals(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                u.UserID,
                u.Username,
                u.Email,
                u.Created,
                u.Auth_Provider as AuthProvider,
                u.ImageURL,
                us.StatusName as UserStatus
            FROM [User] u
            INNER JOIN UserStatus us ON u.UserStatusID = us.UserStatusID
            WHERE u.UserStatusID = 1
            ORDER BY u.Created DESC
        `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error('Error fetching pending user approvals:', error);
        return {
            status: 500,
            body: 'Failed to fetch pending user approvals'
        };
    }
}

// GET: Get count of pending user approvals (for notification badge)
async function getPendingUserApprovalsCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const count = await getCurrentPendingCount();

        return {
            status: 200,
            jsonBody: { count }
        };
    } catch (error) {
        context.error('Error fetching pending user approvals count:', error);
        return {
            status: 500,
            body: 'Failed to fetch count'
        };
    }
}

// POST: Approve a user (change status from Joining to Joined)
async function approveUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { userId: number };
        const { userId } = body;

        if (!userId) {
            return {
                status: 400,
                body: 'User ID is required'
            };
        }

        const pool = await getPool();

        // Update the user status to Joined (2)
        await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                UPDATE [User]
                SET UserStatusID = 2
                WHERE UserID = @userId AND UserStatusID = 1
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'userApprovals', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: 'User approved successfully' }
        };
    } catch (error) {
        context.error('Error approving user:', error);
        return {
            status: 500,
            body: 'Failed to approve user'
        };
    }
}

// DELETE: Reject a user (ban them - change status to Banned)
async function rejectUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;

        if (!userId) {
            return {
                status: 400,
                body: 'User ID is required'
            };
        }

        const pool = await getPool();

        // Update the user status to Banned (3)
        await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                UPDATE [User]
                SET UserStatusID = 3
                WHERE UserID = @userId AND UserStatusID = 1
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'userApprovals', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: 'User rejected (banned)' }
        };
    } catch (error) {
        context.error('Error rejecting user:', error);
        return {
            status: 500,
            body: 'Failed to reject user'
        };
    }
}

// POST: Ban a user (change status to Banned for any non-banned user)
async function banUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;

        if (!userId) {
            return {
                status: 400,
                body: 'User ID is required'
            };
        }

        const pool = await getPool();

        // Update the user status to Banned (3) - only if not already banned
        const result = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                UPDATE [User]
                SET UserStatusID = 3
                WHERE UserID = @userId AND UserStatusID != 3
            `);

        if (result.rowsAffected[0] === 0) {
            return {
                status: 400,
                body: 'User not found or already banned'
            };
        }

        return {
            status: 200,
            jsonBody: { message: 'User banned successfully' }
        };
    } catch (error) {
        context.error('Error banning user:', error);
        return {
            status: 500,
            body: 'Failed to ban user'
        };
    }
}

// POST: Unban a user (change status from Banned to Joined)
async function unbanUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const userId = request.params.userId;

        if (!userId) {
            return {
                status: 400,
                body: 'User ID is required'
            };
        }

        const pool = await getPool();

        // Update the user status to Joined (2) - only if currently banned (3)
        const result = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query(`
                UPDATE [User]
                SET UserStatusID = 2
                WHERE UserID = @userId AND UserStatusID = 3
            `);

        if (result.rowsAffected[0] === 0) {
            return {
                status: 400,
                body: 'User not found or not currently banned'
            };
        }

        return {
            status: 200,
            jsonBody: { message: 'User unbanned successfully' }
        };
    } catch (error) {
        context.error('Error unbanning user:', error);
        return {
            status: 500,
            body: 'Failed to unban user'
        };
    }
}

app.http('getPendingUserApprovals', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user-approval',
    handler: getPendingUserApprovals
});

app.http('getPendingUserApprovalsCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'user-approval/count',
    handler: getPendingUserApprovalsCount
});

app.http('approveUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'user-approval/approve',
    extraOutputs: [signalROutput],
    handler: approveUser
});

app.http('rejectUser', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'user-approval/{userId}',
    extraOutputs: [signalROutput],
    handler: rejectUser
});

app.http('banUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'user-approval/ban/{userId}',
    handler: banUser
});

app.http('unbanUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'user-approval/unban/{userId}',
    handler: unbanUser
});
