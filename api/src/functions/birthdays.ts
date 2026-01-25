import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

export async function getBirthdayCharacters(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        // Get all characters whose age in months is exactly divisible by 12 (whole years)
        // Excludes newborns (0 months) and dead/inactive characters
        const result = await pool.request().query(`
            SELECT 
                c.CharacterID as id,
                c.CharacterName as name,
                c.Slug as slug,
                c.AvatarImage as imageUrl,
                c.MonthsAge as monthsAge,
                c.Sex as sex,
                p.PackName as packName,
                u.Username as username,
                u.UserID as odUserId
            FROM Character c
            LEFT JOIN Pack p ON c.PackID = p.PackID
            LEFT JOIN [User] u ON c.UserID = u.UserID
            WHERE c.MonthsAge > 0 
              AND (c.MonthsAge % 12) = 0
              AND COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
            ORDER BY c.MonthsAge DESC, c.CharacterName ASC
        `);
        
        return { jsonBody: result.recordset };
    } catch (error: any) {
        context.error('Birthday query error:', error.message, error.stack);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

// Get count only (for header badge)
export async function getBirthdayCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT COUNT(*) as count
            FROM Character c
            WHERE c.MonthsAge > 0 
              AND c.MonthsAge % 12 = 0
              AND COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
        `);
        
        return { jsonBody: { count: result.recordset[0].count } };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getBirthdayCharacters', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'birthdays',
    handler: getBirthdayCharacters
});

app.http('getBirthdayCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'birthdays/count',
    handler: getBirthdayCount
});
