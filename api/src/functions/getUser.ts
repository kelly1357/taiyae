import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const id = request.params.id;
        if (!id) {
            return { status: 400, jsonBody: { body: "User ID is required" } };
        }
        const pool = await getPool();
        const userResult = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT UserID, Username, Email, Description, Facebook, Instagram, Discord, ImageURL, Is_Moderator, Is_Admin FROM [User] WHERE UserID = @UserID');
        const user = userResult.recordset[0];
        if (!user) {
            return { status: 404, jsonBody: { body: "User not found" } };
        }
        // Add isModerator and isAdmin fields based on database columns
        const isModerator = user.Is_Moderator === true || user.Is_Moderator === 1;
        const isAdmin = user.Is_Admin === true || user.Is_Admin === 1;
        return { status: 200, jsonBody: { ...user, isModerator, isAdmin, role: isModerator ? 'moderator' : 'member' } };
    } catch (error) {
        context.error(error);
        return { status: 500, jsonBody: { body: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) } };
    }
}

app.http('getUser', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: getUser
});
