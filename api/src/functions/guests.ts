import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// Ensure GuestSession table exists
async function ensureGuestTable(): Promise<void> {
    const pool = await getPool();
    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GuestSession' AND xtype='U')
        CREATE TABLE GuestSession (
            SessionID nvarchar(50) PRIMARY KEY,
            LastActiveAt datetime NOT NULL,
            UserAgent nvarchar(500) NULL
        )
    `);
}

// POST: Update guest activity (heartbeat)
export async function updateGuestActivity(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { sessionId: string };
        const { sessionId } = body;

        if (!sessionId) {
            return { status: 400, body: "Missing sessionId" };
        }

        await ensureGuestTable();
        const pool = await getPool();
        
        const userAgent = request.headers.get('user-agent')?.substring(0, 500) || null;

        // Upsert the guest session
        await pool.request()
            .input('sessionId', sql.NVarChar, sessionId)
            .input('userAgent', sql.NVarChar, userAgent)
            .query(`
                MERGE GuestSession AS target
                USING (SELECT @sessionId AS SessionID) AS source
                ON target.SessionID = source.SessionID
                WHEN MATCHED THEN
                    UPDATE SET LastActiveAt = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (SessionID, LastActiveAt, UserAgent)
                    VALUES (@sessionId, GETDATE(), @userAgent);
            `);

        return { status: 200, body: "Guest activity updated" };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// GET: Get count of active guests (active in last 15 minutes)
export async function getGuestCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        await ensureGuestTable();
        const pool = await getPool();

        // Clean up old sessions (older than 15 minutes)
        await pool.request().query(`
            DELETE FROM GuestSession
            WHERE LastActiveAt < DATEADD(MINUTE, -15, GETDATE())
        `);

        // Count active guests
        const result = await pool.request().query(`
            SELECT COUNT(*) AS count
            FROM GuestSession
            WHERE LastActiveAt >= DATEADD(MINUTE, -15, GETDATE())
        `);

        return {
            status: 200,
            jsonBody: { count: result.recordset[0].count }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// DELETE: Remove a guest session (when user logs in)
export async function removeGuestSession(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { sessionId: string };
        const { sessionId } = body;

        if (!sessionId) {
            return { status: 400, body: "Missing sessionId" };
        }

        const pool = await getPool();
        
        await pool.request()
            .input('sessionId', sql.NVarChar, sessionId)
            .query(`DELETE FROM GuestSession WHERE SessionID = @sessionId`);

        return { status: 200, body: "Guest session removed" };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('updateGuestActivity', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: updateGuestActivity,
    route: 'guests/heartbeat'
});

app.http('getGuestCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getGuestCount,
    route: 'guests/count'
});

app.http('removeGuestSession', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: removeGuestSession,
    route: 'guests/session'
});
