import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyStaffAuth } from "../auth";

// GET /api/sitewide-updates - Get sitewide updates (with pagination)
export async function getSitewideUpdates(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const limit = parseInt(request.query.get('limit') || '3');
        const page = parseInt(request.query.get('page') || '1');
        const offset = (page - 1) * limit;

        const pool = await getPool();
        
        // Get total count
        const countResult = await pool.request().query('SELECT COUNT(*) as total FROM SitewideUpdates');
        const total = countResult.recordset[0].total;

        // Get updates with pagination
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .input('offset', sql.Int, offset)
            .query(`
                SELECT s.UpdateID, s.Content, s.CreatedAt, s.CreatedByUserID, u.Username as CreatedByUsername
                FROM SitewideUpdates s
                LEFT JOIN [User] u ON s.CreatedByUserID = u.UserID
                ORDER BY s.CreatedAt DESC
                OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
            `);
        
        return { 
            status: 200, 
            jsonBody: {
                updates: result.recordset,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/sitewide-updates - Create a new sitewide update
export async function createSitewideUpdate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization via JWT
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body = await request.json() as any;
        const { content } = body;

        if (!content) {
            return { status: 400, body: "Content is required" };
        }

        const pool = await getPool();

        const result = await pool.request()
            .input('content', sql.NVarChar(sql.MAX), content)
            .input('userId', sql.Int, auth.userId)
            .query(`
                INSERT INTO SitewideUpdates (Content, CreatedByUserID)
                OUTPUT INSERTED.UpdateID, INSERTED.Content, INSERTED.CreatedAt, INSERTED.CreatedByUserID
                VALUES (@content, @userId)
            `);

        return { status: 201, jsonBody: result.recordset[0] };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// DELETE /api/sitewide-updates/:id - Delete a sitewide update
export async function deleteSitewideUpdate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization via JWT
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const id = request.params.id;

        if (!id) {
            return { status: 400, body: "Update ID is required" };
        }

        const pool = await getPool();

        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('DELETE FROM SitewideUpdates WHERE UpdateID = @id');

        return { status: 200, jsonBody: { success: true } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

app.http('getSitewideUpdates', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'sitewide-updates',
    handler: getSitewideUpdates
});

app.http('createSitewideUpdate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'sitewide-updates',
    handler: createSitewideUpdate
});

app.http('deleteSitewideUpdate', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'sitewide-updates/{id}',
    handler: deleteSitewideUpdate
});
