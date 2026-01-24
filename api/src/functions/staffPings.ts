import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// SignalR output binding for broadcasting admin count updates
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'messaging',
});

// Helper to get current unresolved count
async function getCurrentUnresolvedCount(): Promise<number> {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT COUNT(*) as count FROM StaffPing WHERE IsResolved = 0
    `);
    return result.recordset[0].count;
}

// Create a new staff ping
export async function createStaffPing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId, isAnonymous, message, pageUrl } = body;

        if (!message || message.trim() === '') {
            return { status: 400, body: "Message is required" };
        }

        const pool = await getPool();

        await pool.request()
            .input('userId', sql.Int, isAnonymous ? null : userId)
            .input('isAnonymous', sql.Bit, isAnonymous ? 1 : 0)
            .input('message', sql.NVarChar, message.trim())
            .input('pageUrl', sql.NVarChar, pageUrl || null)
            .query(`
                INSERT INTO StaffPing (UserID, IsAnonymous, Message, PageUrl)
                VALUES (@userId, @isAnonymous, @message, @pageUrl)
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentUnresolvedCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'staffPings', count: newCount }]
        }]);

        return {
            status: 201,
            jsonBody: { message: "Staff ping sent successfully" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Get count of unresolved pings (for badge)
export async function getUnresolvedPingsCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .query(`SELECT COUNT(*) as count FROM StaffPing WHERE IsResolved = 0`);

        return {
            status: 200,
            jsonBody: { count: result.recordset[0].count }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Get all pings (with optional filter for resolved/unresolved)
export async function getStaffPings(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const showResolved = request.query.get('showResolved') === 'true';
        
        const pool = await getPool();
        
        const result = await pool.request()
            .input('showResolved', sql.Bit, showResolved ? 1 : 0)
            .query(`
                SELECT 
                    sp.PingID,
                    sp.UserID,
                    CASE WHEN sp.IsAnonymous = 1 THEN NULL ELSE u.Username END as Username,
                    sp.IsAnonymous,
                    sp.Message,
                    sp.PageUrl,
                    sp.CreatedAt,
                    sp.IsResolved,
                    sp.ResolvedAt,
                    sp.ResolvedByUserID,
                    ru.Username as ResolvedByUsername,
                    sp.ResolutionNote
                FROM StaffPing sp
                LEFT JOIN [User] u ON sp.UserID = u.UserID
                LEFT JOIN [User] ru ON sp.ResolvedByUserID = ru.UserID
                WHERE sp.IsResolved = @showResolved OR @showResolved = 1
                ORDER BY sp.IsResolved ASC, sp.CreatedAt DESC
            `);

        return {
            status: 200,
            jsonBody: result.recordset
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Resolve a ping
export async function resolveStaffPing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const pingId = request.params.pingId;
    
    if (!pingId) {
        return { status: 400, body: "pingId is required" };
    }

    try {
        const body = await request.json() as any;
        const { resolvedByUserId, resolutionNote } = body;

        if (!resolvedByUserId) {
            return { status: 400, body: "resolvedByUserId is required" };
        }

        const pool = await getPool();

        await pool.request()
            .input('pingId', sql.Int, parseInt(pingId))
            .input('resolvedByUserId', sql.Int, parseInt(resolvedByUserId))
            .input('resolutionNote', sql.NVarChar, resolutionNote || null)
            .query(`
                UPDATE StaffPing
                SET IsResolved = 1,
                    ResolvedAt = GETDATE(),
                    ResolvedByUserID = @resolvedByUserId,
                    ResolutionNote = @resolutionNote
                WHERE PingID = @pingId
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentUnresolvedCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'staffPings', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: "Ping resolved" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Unresolve a ping (reopen)
export async function unresolveStaffPing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const pingId = request.params.pingId;
    
    if (!pingId) {
        return { status: 400, body: "pingId is required" };
    }

    try {
        const pool = await getPool();

        await pool.request()
            .input('pingId', sql.Int, parseInt(pingId))
            .query(`
                UPDATE StaffPing
                SET IsResolved = 0,
                    ResolvedAt = NULL,
                    ResolvedByUserID = NULL,
                    ResolutionNote = NULL
                WHERE PingID = @pingId
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentUnresolvedCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'staffPings', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: "Ping reopened" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Delete a ping (for admins only)
export async function deleteStaffPing(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const pingId = request.params.pingId;
    
    if (!pingId) {
        return { status: 400, body: "pingId is required" };
    }

    try {
        const pool = await getPool();

        await pool.request()
            .input('pingId', sql.Int, parseInt(pingId))
            .query(`DELETE FROM StaffPing WHERE PingID = @pingId`);

        // Broadcast updated count to staff group
        const newCount = await getCurrentUnresolvedCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'staffPings', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: "Ping deleted" }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal server error" };
    }
}

// Register routes
app.http('createStaffPing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'staff-pings',
    extraOutputs: [signalROutput],
    handler: createStaffPing
});

app.http('getUnresolvedPingsCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'staff-pings/count',
    handler: getUnresolvedPingsCount
});

app.http('getStaffPings', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'staff-pings/list',
    handler: getStaffPings
});

app.http('resolveStaffPing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'staff-pings/{pingId}/resolve',
    extraOutputs: [signalROutput],
    handler: resolveStaffPing
});

app.http('unresolveStaffPing', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'staff-pings/{pingId}/unresolve',
    extraOutputs: [signalROutput],
    handler: unresolveStaffPing
});

app.http('deleteStaffPing', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'staff-pings/{pingId}',
    extraOutputs: [signalROutput],
    handler: deleteStaffPing
});
