import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function createRegion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { name, description, imageUrl } = body;

        if (!name || !description) {
            return { status: 400, body: "Name and Description are required" };
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('RegionName', sql.NVarChar, name)
            .input('Description', sql.NVarChar, description)
            .input('ImageURL', sql.NVarChar, imageUrl || null)
            .query(`
                INSERT INTO Region (RegionName, Description, ImageURL)
                OUTPUT INSERTED.RegionID, INSERTED.RegionName, INSERTED.Description, INSERTED.ImageURL
                VALUES (@RegionName, @Description, @ImageURL)
            `);

        const region = result.recordset[0];

        return {
            status: 201,
            jsonBody: region
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

app.http('createRegion', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createRegion,
    route: 'region'
});
