import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyStaffAuth } from "../auth";

export async function createRegion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization via JWT
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body: any = await request.json();
        const { name, description, imageUrl, headerImageUrl } = body;

        if (!name || !description) {
            return { status: 400, body: "Name and Description are required" };
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('RegionName', sql.NVarChar, name)
            .input('Description', sql.NVarChar, description)
            .input('ImageURL', sql.NVarChar, imageUrl || null)
            .input('HeaderImageURL', sql.NVarChar, headerImageUrl || null)
            .query(`
                INSERT INTO Region (RegionName, Description, ImageURL, HeaderImageURL)
                OUTPUT INSERTED.RegionID, INSERTED.RegionName, INSERTED.Description, INSERTED.ImageURL, INSERTED.HeaderImageURL
                VALUES (@RegionName, @Description, @ImageURL, @HeaderImageURL)
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
