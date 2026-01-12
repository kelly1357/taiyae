import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

// GET /api/wiki/:slug - Get a wiki page by slug
export async function getWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const slug = request.params.slug;
    if (!slug) {
        return { status: 400, body: "Missing slug" };
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('slug', slug)
            .query(`
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.Content,
                    w.LastModified,
                    w.ModifiedByUserID,
                    u.Username as ModifiedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
                WHERE w.Slug = @slug
            `);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Wiki page not found" };
        }

        return { status: 200, jsonBody: result.recordset[0] };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// GET /api/wiki - Get all wiki pages (for admin listing)
export async function getAllWikiPages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.LastModified,
                    u.Username as ModifiedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
                ORDER BY w.Title ASC
            `);

        return { status: 200, jsonBody: result.recordset };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// PUT /api/wiki/:slug - Update or create a wiki page
export async function updateWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const slug = request.params.slug;
    if (!slug) {
        return { status: 400, body: "Missing slug" };
    }

    try {
        const body = await request.json() as any;
        const { title, content, userId } = body;

        if (!title || !content) {
            return { status: 400, body: "Title and content are required" };
        }

        const pool = await getPool();

        // Check if page exists
        const existing = await pool.request()
            .input('slug', slug)
            .query('SELECT WikiPageID FROM WikiPage WHERE Slug = @slug');

        if (existing.recordset.length > 0) {
            // Update existing page
            await pool.request()
                .input('slug', slug)
                .input('title', title)
                .input('content', content)
                .input('userId', userId || null)
                .query(`
                    UPDATE WikiPage 
                    SET Title = @title, 
                        Content = @content, 
                        LastModified = GETDATE(),
                        ModifiedByUserID = @userId
                    WHERE Slug = @slug
                `);
        } else {
            // Create new page
            await pool.request()
                .input('slug', slug)
                .input('title', title)
                .input('content', content)
                .input('userId', userId || null)
                .query(`
                    INSERT INTO WikiPage (Slug, Title, Content, ModifiedByUserID)
                    VALUES (@slug, @title, @content, @userId)
                `);
        }

        return { status: 200, jsonBody: { success: true } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

app.http('getWikiPage', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'wiki/{slug}',
    handler: getWikiPage
});

app.http('getAllWikiPages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'wiki',
    handler: getAllWikiPages
});

app.http('updateWikiPage', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'wiki/{slug}',
    handler: updateWikiPage
});
