import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyStaffAuth } from "../auth";

export async function updateRegion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization via JWT
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const id = request.params.id;
        const body: any = await request.json();
        const { name, description, imageUrl, headerImageUrl } = body;

        if (!id) {
            return { status: 400, body: "Region ID is required" };
        }

        if (!name || !description) {
            return { status: 400, body: "Name and Description are required" };
        }

        const pool = await getPool();
        
        const result = await pool.request()
            .input('RegionID', sql.Int, id)
            .input('RegionName', sql.NVarChar, name)
            .input('Description', sql.NVarChar, description)
            .input('ImageURL', sql.NVarChar, imageUrl || null)
            .input('HeaderImageURL', sql.NVarChar, headerImageUrl || null)
            .query(`
                UPDATE Region
                SET RegionName = @RegionName,
                    Description = @Description,
                    ImageURL = @ImageURL,
                    HeaderImageURL = @HeaderImageURL
                OUTPUT INSERTED.RegionID, INSERTED.RegionName, INSERTED.Description, INSERTED.ImageURL, INSERTED.HeaderImageURL
                WHERE RegionID = @RegionID
            `);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Region not found" };
        }

        const region = result.recordset[0];

        return {
            status: 200,
            jsonBody: region
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

app.http('updateRegion', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: updateRegion,
    route: 'region/{id}'
});
