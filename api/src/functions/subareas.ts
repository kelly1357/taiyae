import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyStaffAuth } from "../auth";

// GET all subareas for a region
export async function getSubareas(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const regionId = request.query.get('regionId');
        
        if (!regionId) {
            return { status: 400, body: "regionId is required" };
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('regionId', sql.NVarChar, regionId)
            .query(`
                SELECT id, regionId, name, description, imageUrl
                FROM Subareas
                WHERE regionId = @regionId
                ORDER BY name
            `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// POST create a new subarea
export async function createSubarea(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body: any = await request.json();
        const { regionId, name, description, imageUrl } = body;

        if (!regionId || !name) {
            return { status: 400, body: "regionId and name are required" };
        }

        // Generate slug-based ID from name
        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const pool = await getPool();
        
        // Check if ID already exists
        const existing = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT id FROM Subareas WHERE id = @id');
        
        if (existing.recordset.length > 0) {
            return { status: 400, body: "A subarea with this name already exists" };
        }

        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('regionId', sql.NVarChar, regionId)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('imageUrl', sql.NVarChar, imageUrl || null)
            .query(`
                INSERT INTO Subareas (id, regionId, name, description, imageUrl)
                VALUES (@id, @regionId, @name, @description, @imageUrl)
            `);

        return {
            status: 201,
            jsonBody: { id, regionId, name, description, imageUrl }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// PUT update a subarea
export async function updateSubarea(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const id = request.params.id;
        const body: any = await request.json();
        const { name, description, imageUrl } = body;

        if (!id) {
            return { status: 400, body: "Subarea ID is required" };
        }

        if (!name) {
            return { status: 400, body: "Name is required" };
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .input('imageUrl', sql.NVarChar, imageUrl || null)
            .query(`
                UPDATE Subareas
                SET name = @name,
                    description = @description,
                    imageUrl = @imageUrl
                OUTPUT INSERTED.id, INSERTED.regionId, INSERTED.name, INSERTED.description, INSERTED.imageUrl
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Subarea not found" };
        }

        return {
            status: 200,
            jsonBody: result.recordset[0]
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// DELETE a subarea
export async function deleteSubarea(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const id = request.params.id;

        if (!id) {
            return { status: 400, body: "Subarea ID is required" };
        }

        const pool = await getPool();
        
        // Check if there are threads in this subarea
        const threads = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT COUNT(*) as count FROM Thread WHERE SubareaID = @id');
        
        if (threads.recordset[0].count > 0) {
            return { status: 400, body: "Cannot delete subarea with existing threads. Move or delete the threads first." };
        }

        const result = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('DELETE FROM Subareas WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return { status: 404, body: "Subarea not found" };
        }

        return {
            status: 200,
            jsonBody: { message: "Subarea deleted successfully" }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// Register routes
app.http('getSubareas', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getSubareas,
    route: 'subareas'
});

app.http('createSubarea', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createSubarea,
    route: 'subareas'
});

app.http('updateSubarea', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: updateSubarea,
    route: 'subareas/{id}'
});

app.http('deleteSubarea', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: deleteSubarea,
    route: 'subareas/{id}'
});
