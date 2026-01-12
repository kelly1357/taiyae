import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// GET /api/bulletin - Get the current bulletin
export async function getBulletin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT TOP 1 BulletinID, Content, IsEnabled, UpdatedAt, UpdatedByUserID
            FROM Bulletin
            ORDER BY BulletinID DESC
        `);
        
        if (result.recordset.length === 0) {
            return { status: 200, jsonBody: { Content: '', IsEnabled: false } };
        }
        
        return { status: 200, jsonBody: result.recordset[0] };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// PUT /api/bulletin - Update the bulletin (admin only)
export async function updateBulletin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { content, isEnabled, userId } = body;

        if (content === undefined || isEnabled === undefined) {
            return { status: 400, body: "Missing content or isEnabled" };
        }

        const pool = await getPool();
        
        // Check if bulletin exists
        const existing = await pool.request().query('SELECT TOP 1 BulletinID FROM Bulletin');
        
        if (existing.recordset.length === 0) {
            // Insert new bulletin
            await pool.request()
                .input('content', sql.NVarChar(sql.MAX), content)
                .input('isEnabled', sql.Bit, isEnabled)
                .input('userId', sql.Int, userId || null)
                .query(`
                    INSERT INTO Bulletin (Content, IsEnabled, UpdatedAt, UpdatedByUserID)
                    VALUES (@content, @isEnabled, GETDATE(), @userId)
                `);
        } else {
            // Update existing bulletin
            await pool.request()
                .input('content', sql.NVarChar(sql.MAX), content)
                .input('isEnabled', sql.Bit, isEnabled)
                .input('userId', sql.Int, userId || null)
                .query(`
                    UPDATE Bulletin
                    SET Content = @content, IsEnabled = @isEnabled, UpdatedAt = GETDATE(), UpdatedByUserID = @userId
                    WHERE BulletinID = (SELECT TOP 1 BulletinID FROM Bulletin ORDER BY BulletinID DESC)
                `);
        }

        return { status: 200, jsonBody: { success: true } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

app.http('getBulletin', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'bulletin',
    handler: getBulletin
});

app.http('updateBulletin', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'bulletin',
    handler: updateBulletin
});
