import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { getPool } from "../db";
import { verifyAuth, verifyStaffAuth } from "../auth";
import * as sql from 'mssql';

// SignalR output binding for broadcasting admin count updates
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'messaging',
});

// Helper to get current pending count
async function getCurrentPendingCount(): Promise<number> {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT COUNT(*) as count FROM PlotNews WHERE IsApproved = 0
    `);
    return result.recordset[0].count;
}

// POST /api/plot-news
// Submit a new plot news item
export async function submitPlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify user is authenticated
    const auth = await verifyAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body = await request.json() as {
            packName: string;
            newsText: string;
            threadURL?: string;
            threadTitle?: string;
            userId?: number;
        };

        const { packName, newsText, threadURL, threadTitle, userId } = body;

        if (!packName || !newsText) {
            return { status: 400, body: "packName and newsText are required" };
        }

        if (newsText.length > 150) {
            return { status: 400, body: "newsText must be 150 characters or less" };
        }

        const pool = await getPool();
        await pool.request()
            .input('packName', sql.NVarChar, packName)
            .input('newsText', sql.NVarChar, newsText)
            .input('threadURL', sql.NVarChar, threadURL || null)
            .input('threadTitle', sql.NVarChar, threadTitle || null)
            .input('userId', sql.Int, userId || null)
            .query(`
                INSERT INTO PlotNews (PackName, NewsText, ThreadURL, ThreadTitle, SubmittedByUserID, SubmittedAt, IsApproved)
                VALUES (@packName, @newsText, @threadURL, @threadTitle, @userId, GETDATE(), 0)
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'plotNews', count: newCount }]
        }]);

        return {
            status: 201,
            jsonBody: { message: "Plot news submitted successfully" }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('submitPlotNews', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'plot-news',
    extraOutputs: [signalROutput],
    handler: submitPlotNews
});

// GET /api/plot-news
// Get approved plot news (for home page display)
export async function getApprovedPlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT TOP 3 
                    pn.PlotNewsID,
                    pn.PackName,
                    pn.NewsText,
                    pn.ThreadURL,
                    pn.ApprovedAt,
                    (SELECT TOP 1 p.Subject FROM Post p WHERE p.ThreadID = 
                        TRY_CAST(
                            CASE 
                                WHEN pn.ThreadURL LIKE '%/thread/%' 
                                THEN SUBSTRING(pn.ThreadURL, CHARINDEX('/thread/', pn.ThreadURL) + 8, LEN(pn.ThreadURL))
                                ELSE NULL 
                            END 
                        AS INT)
                     ORDER BY p.PostID ASC) as ThreadTitle
                FROM PlotNews pn
                WHERE pn.IsApproved = 1
                ORDER BY pn.ApprovedAt DESC
            `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getApprovedPlotNews', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'plot-news',
    handler: getApprovedPlotNews
});

// GET /api/plot-news/all
// Get all approved plot news with pagination
export async function getAllApprovedPlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const page = parseInt(request.query.get('page') || '1');
        const limit = parseInt(request.query.get('limit') || '10');
        const offset = (page - 1) * limit;

        const pool = await getPool();
        
        // Get total count
        const countResult = await pool.request()
            .query(`SELECT COUNT(*) as total FROM PlotNews WHERE IsApproved = 1`);
        const totalCount = countResult.recordset[0].total;

        // Get paginated results
        const result = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT 
                    pn.PlotNewsID,
                    pn.PackName,
                    pn.NewsText,
                    pn.ThreadURL,
                    pn.ApprovedAt,
                    pn.SubmittedAt,
                    u.Username as SubmittedByUsername,
                    (SELECT TOP 1 p.Subject FROM Post p WHERE p.ThreadID = 
                        TRY_CAST(
                            CASE 
                                WHEN pn.ThreadURL LIKE '%/thread/%' 
                                THEN SUBSTRING(pn.ThreadURL, CHARINDEX('/thread/', pn.ThreadURL) + 8, LEN(pn.ThreadURL))
                                ELSE NULL 
                            END 
                        AS INT)
                     ORDER BY p.PostID ASC) as ThreadTitle
                FROM PlotNews pn
                LEFT JOIN [dbo].[User] u ON pn.SubmittedByUserID = u.UserID
                WHERE pn.IsApproved = 1
                ORDER BY pn.ApprovedAt DESC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

        return {
            status: 200,
            jsonBody: {
                items: result.recordset,
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getAllApprovedPlotNews', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'plot-news/all',
    handler: getAllApprovedPlotNews
});

// GET /api/plot-news/pending
// Get pending plot news submissions (for admin page)
export async function getPendingPlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    p.PlotNewsID,
                    p.PackName,
                    p.NewsText,
                    p.ThreadURL,
                    p.ThreadTitle,
                    p.SubmittedByUserID,
                    p.SubmittedAt,
                    u.Username as SubmittedByUsername
                FROM PlotNews p
                LEFT JOIN [dbo].[User] u ON p.SubmittedByUserID = u.UserID
                WHERE p.IsApproved = 0
                ORDER BY p.SubmittedAt DESC
            `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getPendingPlotNews', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'plot-news/pending',
    handler: getPendingPlotNews
});

// GET /api/plot-news/pending/count
// Get count of pending plot news (for notification badge)
export async function getPendingPlotNewsCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT COUNT(*) as count
                FROM PlotNews
                WHERE IsApproved = 0
            `);

        return {
            status: 200,
            jsonBody: { count: result.recordset[0].count }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getPendingPlotNewsCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'plot-news/pending/count',
    handler: getPendingPlotNewsCount
});

// POST /api/plot-news/approve
// Approve a plot news item (and all related entries from multi-pack submissions)
export async function approvePlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body = await request.json() as {
            plotNewsId: number;
            userId?: number;
        };

        const { plotNewsId, userId } = body;

        if (!plotNewsId) {
            return { status: 400, body: "plotNewsId is required" };
        }

        const pool = await getPool();
        
        // First, get the details of the item being approved to find related entries
        const itemResult = await pool.request()
            .input('plotNewsId', sql.Int, plotNewsId)
            .query(`
                SELECT NewsText, ThreadURL, SubmittedByUserID, SubmittedAt
                FROM PlotNews
                WHERE PlotNewsID = @plotNewsId
            `);
        
        if (itemResult.recordset.length === 0) {
            return { status: 404, body: "Plot news item not found" };
        }
        
        const item = itemResult.recordset[0];
        
        // Approve all related entries (same text, URL, submitter, and submitted within 5 seconds)
        await pool.request()
            .input('newsText', sql.NVarChar, item.NewsText)
            .input('threadURL', sql.NVarChar, item.ThreadURL)
            .input('submittedByUserID', sql.Int, item.SubmittedByUserID)
            .input('submittedAt', sql.DateTime, item.SubmittedAt)
            .input('userId', sql.Int, userId || null)
            .query(`
                UPDATE PlotNews
                SET IsApproved = 1,
                    ApprovedByUserID = @userId,
                    ApprovedAt = GETDATE()
                WHERE NewsText = @newsText
                    AND ISNULL(ThreadURL, '') = ISNULL(@threadURL, '')
                    AND SubmittedByUserID = @submittedByUserID
                    AND ABS(DATEDIFF(SECOND, SubmittedAt, @submittedAt)) <= 5
                    AND IsApproved = 0
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'plotNews', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: "Plot news approved" }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('approvePlotNews', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'plot-news/approve',
    extraOutputs: [signalROutput],
    handler: approvePlotNews
});

// PUT /api/plot-news/:id
// Update a plot news item (edit pack, text, URL before approving)
export async function updatePlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const plotNewsId = request.params.id;
        const body = await request.json() as {
            packName?: string;
            newsText?: string;
            threadURL?: string;
            threadTitle?: string;
        };

        const { packName, newsText, threadURL, threadTitle } = body;

        if (!plotNewsId) {
            return { status: 400, body: "plotNewsId is required" };
        }

        if (newsText && newsText.length > 150) {
            return { status: 400, body: "newsText must be 150 characters or less" };
        }

        const pool = await getPool();
        await pool.request()
            .input('plotNewsId', sql.Int, parseInt(plotNewsId))
            .input('packName', sql.NVarChar, packName)
            .input('newsText', sql.NVarChar, newsText)
            .input('threadURL', sql.NVarChar, threadURL)
            .input('threadTitle', sql.NVarChar, threadTitle)
            .query(`
                UPDATE PlotNews
                SET PackName = COALESCE(@packName, PackName),
                    NewsText = COALESCE(@newsText, NewsText),
                    ThreadURL = COALESCE(@threadURL, ThreadURL),
                    ThreadTitle = COALESCE(@threadTitle, ThreadTitle)
                WHERE PlotNewsID = @plotNewsId
            `);

        return {
            status: 200,
            jsonBody: { message: "Plot news updated" }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('updatePlotNews', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'plot-news/{id}',
    handler: updatePlotNews
});

// DELETE /api/plot-news/:id
// Delete a plot news item
export async function deletePlotNews(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Verify staff authorization
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const plotNewsId = request.params.id;

        if (!plotNewsId) {
            return { status: 400, body: "plotNewsId is required" };
        }

        const pool = await getPool();
        await pool.request()
            .input('plotNewsId', sql.Int, parseInt(plotNewsId))
            .query(`
                DELETE FROM PlotNews
                WHERE PlotNewsID = @plotNewsId
            `);

        // Broadcast updated count to staff group
        const newCount = await getCurrentPendingCount();
        context.extraOutputs.set(signalROutput, [{
            target: 'adminCountUpdate',
            groupName: 'staff',
            arguments: [{ type: 'plotNews', count: newCount }]
        }]);

        return {
            status: 200,
            jsonBody: { message: "Plot news deleted" }
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('deletePlotNews', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'plot-news/{id}',
    extraOutputs: [signalROutput],
    handler: deletePlotNews
});

// GET /api/plot-news/pack/:packName
// Get approved plot news for a specific pack (limit 4)
// Returns all pack tags for items that include this pack
export async function getPlotNewsByPack(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const packName = decodeURIComponent(request.params.packName || '');
        
        if (!packName) {
            return { status: 400, body: "packName is required" };
        }

        const pool = await getPool();
        // First get the 4 most recent approved items for this pack
        const result = await pool.request()
            .input('packName', sql.NVarChar, packName)
            .query(`
                SELECT TOP 4 
                    pn.PlotNewsID,
                    pn.PackName,
                    pn.NewsText,
                    pn.ThreadURL,
                    pn.ApprovedAt,
                    pn.SubmittedByUserID,
                    (SELECT TOP 1 p.Subject FROM Post p WHERE p.ThreadID = 
                        TRY_CAST(
                            CASE 
                                WHEN pn.ThreadURL LIKE '%/thread/%' 
                                THEN SUBSTRING(pn.ThreadURL, CHARINDEX('/thread/', pn.ThreadURL) + 8, LEN(pn.ThreadURL))
                                ELSE NULL 
                            END 
                        AS INT)
                     ORDER BY p.PostID ASC) as ThreadTitle,
                    -- Get all pack names for this same submission (same text, URL, submitter)
                    (SELECT STRING_AGG(related.PackName, ',') 
                     FROM PlotNews related 
                     WHERE related.NewsText = pn.NewsText 
                       AND ISNULL(related.ThreadURL, '') = ISNULL(pn.ThreadURL, '')
                       AND related.SubmittedByUserID = pn.SubmittedByUserID
                       AND related.IsApproved = 1
                    ) as AllPackNames
                FROM PlotNews pn
                WHERE pn.IsApproved = 1 AND pn.PackName = @packName
                ORDER BY pn.ApprovedAt DESC
            `);

        return {
            status: 200,
            jsonBody: result.recordset
        };
    } catch (error: any) {
        context.error(error);
        return { status: 500, jsonBody: { error: error.message } };
    }
}

app.http('getPlotNewsByPack', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'plot-news/pack/{packName}',
    handler: getPlotNewsByPack
});
