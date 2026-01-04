import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function updateActivity(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { characterId } = body;

        if (!characterId) {
            return { status: 400, body: "Missing characterId" };
        }

        const pool = await getPool();
        
        await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                UPDATE Character 
                SET LastActiveAt = GETDATE() 
                WHERE CharacterID = @characterId
            `);

        return { status: 200, body: "Activity updated" };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('updateActivity', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: updateActivity,
    route: 'activity'
});
