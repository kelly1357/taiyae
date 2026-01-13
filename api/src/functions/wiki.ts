import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";

// Helper to check if new wiki columns exist
async function hasNewWikiColumns(pool: any): Promise<boolean> {
    const columnsCheck = await pool.request().query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'WikiPage' AND COLUMN_NAME IN ('CreatedByUserID', 'IsHandbook')
    `);
    return columnsCheck.recordset.length >= 2;
}

// GET /api/wiki/:slug - Get a wiki page by slug
export async function getWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const slug = request.params.slug;
    if (!slug) {
        return { status: 400, body: "Missing slug" };
    }

    try {
        const pool = await getPool();
        const hasNewColumns = await hasNewWikiColumns(pool);
        
        let query: string;
        if (hasNewColumns) {
            query = `
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.Content,
                    w.LastModified,
                    w.ModifiedByUserID,
                    w.CreatedByUserID,
                    w.IsHandbook,
                    u.Username as ModifiedByUsername,
                    c.Username as CreatedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
                LEFT JOIN [User] c ON w.CreatedByUserID = c.UserID
                WHERE w.Slug = @slug
            `;
        } else {
            query = `
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.Content,
                    w.LastModified,
                    w.ModifiedByUserID,
                    NULL as CreatedByUserID,
                    1 as IsHandbook,
                    u.Username as ModifiedByUsername,
                    NULL as CreatedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
                WHERE w.Slug = @slug
            `;
        }
        
        const result = await pool.request()
            .input('slug', slug)
            .query(query);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Wiki page not found" };
        }

        return { status: 200, jsonBody: result.recordset[0] };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// GET /api/wiki - Get all wiki pages (optionally filter by handbook status)
export async function getAllWikiPages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const isHandbook = request.query.get('handbook');
        const hasNewColumns = await hasNewWikiColumns(pool);
        
        let query: string;
        if (hasNewColumns) {
            query = `
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.LastModified,
                    w.IsHandbook,
                    w.CreatedByUserID,
                    u.Username as ModifiedByUsername,
                    c.Username as CreatedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
                LEFT JOIN [User] c ON w.CreatedByUserID = c.UserID
            `;
            
            if (isHandbook === 'true') {
                query += ` WHERE w.IsHandbook = 1`;
            } else if (isHandbook === 'false') {
                query += ` WHERE w.IsHandbook = 0`;
            }
        } else {
            // Without new columns, all pages are considered handbook pages
            query = `
                SELECT 
                    w.WikiPageID,
                    w.Slug,
                    w.Title,
                    w.LastModified,
                    1 as IsHandbook,
                    NULL as CreatedByUserID,
                    u.Username as ModifiedByUsername,
                    NULL as CreatedByUsername
                FROM WikiPage w
                LEFT JOIN [User] u ON w.ModifiedByUserID = u.UserID
            `;
            
            // If requesting non-handbook pages but columns don't exist, return empty
            if (isHandbook === 'false') {
                return { status: 200, jsonBody: [] };
            }
        }
        
        query += ` ORDER BY w.Title ASC`;
        
        const result = await pool.request().query(query);

        return { status: 200, jsonBody: result.recordset };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// POST /api/wiki - Create a new user wiki page
export async function createWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { slug, title, content, userId } = body;

        if (!slug || !title || !content) {
            return { status: 400, body: "Slug, title, and content are required" };
        }

        if (!userId) {
            return { status: 401, body: "Must be logged in to create a wiki page" };
        }

        // Validate slug format (lowercase, hyphens, no spaces)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            return { status: 400, body: "Slug must be lowercase letters, numbers, and hyphens only" };
        }

        const pool = await getPool();

        // Check if slug already exists
        const existing = await pool.request()
            .input('slug', slug)
            .query('SELECT WikiPageID FROM WikiPage WHERE Slug = @slug');

        if (existing.recordset.length > 0) {
            return { status: 409, body: "A page with this slug already exists" };
        }

        // Check if new columns exist
        const columnsCheck = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'WikiPage' AND COLUMN_NAME IN ('CreatedByUserID', 'IsHandbook')
        `);
        const hasNewColumns = columnsCheck.recordset.length >= 2;

        // Require new columns for user-created pages
        if (!hasNewColumns) {
            return { status: 500, body: "Database migration required. Please run wiki-user-pages-migration.sql to enable user-created wiki pages." };
        }

        // Create new user page (IsHandbook = 0 means any logged-in user can edit)
        await pool.request()
            .input('slug', slug)
            .input('title', title)
            .input('content', content)
            .input('userId', userId)
            .query(`
                INSERT INTO WikiPage (Slug, Title, Content, CreatedByUserID, ModifiedByUserID, IsHandbook)
                VALUES (@slug, @title, @content, @userId, @userId, 0)
            `);

        return { status: 201, jsonBody: { success: true, slug } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// PUT /api/wiki/:slug - Update a wiki page (with permission checks), or create if moderator
export async function updateWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const slug = request.params.slug;
    if (!slug) {
        return { status: 400, body: "Missing slug" };
    }

    try {
        const body = await request.json() as any;
        const { title, content, userId, isModerator } = body;

        if (!title || !content) {
            return { status: 400, body: "Title and content are required" };
        }

        const pool = await getPool();

        // Check if page exists and get its info
        const existing = await pool.request()
            .input('slug', slug)
            .query('SELECT WikiPageID, IsHandbook, CreatedByUserID FROM WikiPage WHERE Slug = @slug');

        if (existing.recordset.length === 0) {
            // Page doesn't exist - only moderators can create handbook pages via PUT
            if (!isModerator) {
                return { status: 403, body: "Only moderators can create handbook pages" };
            }
            
            // Create new handbook page
            await pool.request()
                .input('slug', slug)
                .input('title', title)
                .input('content', content)
                .input('userId', userId || null)
                .query(`
                    INSERT INTO WikiPage (Slug, Title, Content, ModifiedByUserID, IsHandbook)
                    VALUES (@slug, @title, @content, @userId, 1)
                `);
            
            return { status: 201, jsonBody: { success: true, created: true } };
        }

        const page = existing.recordset[0];

        // Permission check
        if (page.IsHandbook) {
            // Handbook pages: only moderators can edit
            if (!isModerator) {
                return { status: 403, body: "Only moderators can edit handbook pages" };
            }
        } else {
            // User pages: any logged-in user can edit
            if (!userId) {
                return { status: 401, body: "Must be logged in to edit wiki pages" };
            }
        }

        // Update the page
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

        return { status: 200, jsonBody: { success: true } };
    } catch (error: any) {
        context.error(error);
        return { status: 500, body: error.message };
    }
}

// DELETE /api/wiki/:slug - Delete a wiki page (creator or moderator only)
export async function deleteWikiPage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const slug = request.params.slug;
    if (!slug) {
        return { status: 400, body: "Missing slug" };
    }

    try {
        const body = await request.json() as any;
        const { userId, isModerator } = body;

        const pool = await getPool();

        // Check if page exists and get its info
        const existing = await pool.request()
            .input('slug', slug)
            .query('SELECT WikiPageID, IsHandbook, CreatedByUserID FROM WikiPage WHERE Slug = @slug');

        if (existing.recordset.length === 0) {
            return { status: 404, body: "Wiki page not found" };
        }

        const page = existing.recordset[0];

        // Handbook pages cannot be deleted
        if (page.IsHandbook) {
            return { status: 403, body: "Handbook pages cannot be deleted" };
        }

        // Permission check: only creator or moderator can delete
        const isCreator = page.CreatedByUserID === userId;
        if (!isCreator && !isModerator) {
            return { status: 403, body: "Only the page creator or moderators can delete this page" };
        }

        // Delete the page
        await pool.request()
            .input('slug', slug)
            .query('DELETE FROM WikiPage WHERE Slug = @slug');

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

app.http('createWikiPage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'wiki',
    handler: createWikiPage
});

app.http('updateWikiPage', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'wiki/{slug}',
    handler: updateWikiPage
});

app.http('deleteWikiPage', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'wiki/{slug}',
    handler: deleteWikiPage
});
