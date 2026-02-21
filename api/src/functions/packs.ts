import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { verifyStaffAuth } from "../auth";
import { formatHorizonDateString } from "../horizonCalendar";

// GET all packs (or single pack by slug)
export async function getPacks(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT 
                p.id,
                p.name,
                p.slug,
                p.history,
                p.hierarchyExplanation,
                p.[values],
                p.color1,
                p.color2,
                p.misc,
                p.isActive,
                p.disbandedDate,
                p.tagId,
                ps.pupsBorn,
                ps.deaths,
                ps.currentMales,
                ps.currentFemales,
                ps.currentPups
            FROM Packs p
            LEFT JOIN PackStats ps ON p.id = ps.packId
            ORDER BY p.isActive DESC, p.name
        `);

        // For each pack, get ranks and subareas
        const packs = await Promise.all(result.recordset.map(async (pack) => {
            const ranksResult = await pool.request()
                .input('packId', sql.Int, pack.id)
                .query('SELECT id, name, displayOrder FROM PackRanks WHERE packId = @packId ORDER BY displayOrder');
            
            const subareasResult = await pool.request()
                .input('packId', sql.Int, pack.id)
                .query(`
                    SELECT s.id, s.name 
                    FROM PackSubareas ps 
                    JOIN Subareas s ON ps.subareaId = s.id 
                    WHERE ps.packId = @packId
                `);
            
            // Get active members (not dead, grouped by rank)
            const membersResult = await pool.request()
                .input('packId', sql.Int, pack.id)
                .query(`
                    SELECT c.CharacterID, c.CharacterName, c.Slug, c.Sex, c.packRankId, pr.name as rankName, pr.displayOrder
                    FROM Character c
                    LEFT JOIN PackRanks pr ON c.packRankId = pr.id
                    WHERE c.PackID = @packId AND c.Status != 'Dead'
                    ORDER BY pr.displayOrder, c.CharacterName
                `);

            return {
                ...pack,
                disbandedDate: pack.disbandedDate ? formatHorizonDateString(new Date(pack.disbandedDate)) : null,
                stats: {
                    pupsBorn: pack.pupsBorn || 0,
                    deaths: pack.deaths || 0,
                    currentMales: pack.currentMales || 0,
                    currentFemales: pack.currentFemales || 0,
                    currentPups: pack.currentPups || 0
                },
                ranks: ranksResult.recordset,
                subareas: subareasResult.recordset,
                members: membersResult.recordset.map(m => ({
                    id: m.CharacterID,
                    name: m.CharacterName,
                    slug: m.Slug,
                    sex: m.Sex,
                    rankId: m.packRankId,
                    rankName: m.rankName,
                    displayOrder: m.displayOrder
                }))
            };
        }));

        return { 
            jsonBody: packs,
            headers: { 'Cache-Control': 'public, max-age=60' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// GET single pack by slug
export async function getPackBySlug(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const slug = request.params.slug;
        const pool = await getPool();
        
        const result = await pool.request()
            .input('slug', sql.NVarChar, slug)
            .query(`
                SELECT 
                    p.id,
                    p.name,
                    p.slug,
                    p.history,
                    p.hierarchyExplanation,
                    p.[values],
                    p.color1,
                    p.color2,
                    p.color1Name,
                    p.color2Name,
                    p.misc,
                    p.isActive,
                    p.foundedText,
                    p.disbandedDate,
                    p.tagId,
                    ps.pupsBorn,
                    ps.deaths,
                    ps.currentMales,
                    ps.currentFemales,
                    ps.currentPups
                FROM Packs p
                LEFT JOIN PackStats ps ON p.id = ps.packId
                WHERE p.slug = @slug
            `);

        if (result.recordset.length === 0) {
            return { status: 404, body: "Pack not found" };
        }

        const pack = result.recordset[0];

        // Get ranks
        const ranksResult = await pool.request()
            .input('packId', sql.Int, pack.id)
            .query('SELECT id, name, displayOrder FROM PackRanks WHERE packId = @packId ORDER BY displayOrder');
        
        // Get subareas
        const subareasResult = await pool.request()
            .input('packId', sql.Int, pack.id)
            .query(`
                SELECT s.id, s.name 
                FROM PackSubareas ps 
                JOIN Subareas s ON ps.subareaId = s.id 
                WHERE ps.packId = @packId
            `);
        
        // Get active members
        const membersResult = await pool.request()
            .input('packId', sql.Int, pack.id)
            .query(`
                SELECT c.CharacterID, c.CharacterName, c.Slug, c.Sex, c.MonthsAge, c.packRankId, pr.name as rankName, pr.displayOrder
                FROM Character c
                LEFT JOIN PackRanks pr ON c.packRankId = pr.id
                WHERE c.PackID = @packId AND c.Status != 'Dead'
                ORDER BY pr.displayOrder, c.CharacterName
            `);

        // Calculate current stats from actual members
        const members = membersResult.recordset;
        const currentMales = members.filter(m => m.Sex === 'Male' && (m.MonthsAge === null || m.MonthsAge >= 12)).length;
        const currentFemales = members.filter(m => m.Sex === 'Female' && (m.MonthsAge === null || m.MonthsAge >= 12)).length;
        const currentPups = members.filter(m => m.MonthsAge !== null && m.MonthsAge < 12).length;

        // Get pack news (if tagId exists)
        let news: any[] = [];
        if (pack.tagId) {
            const newsResult = await pool.request()
                .input('tagId', sql.Int, pack.tagId)
                .query(`
                    SELECT pn.id, pn.title, pn.content, pn.createdAt
                    FROM PlotNews pn
                    JOIN PlotNewsTags pnt ON pn.id = pnt.plotNewsId
                    WHERE pnt.tagId = @tagId AND pn.status = 'approved'
                    ORDER BY pn.createdAt DESC
                `);
            news = newsResult.recordset;
        }

        return { 
            jsonBody: {
                ...pack,
                disbandedDate: pack.disbandedDate ? formatHorizonDateString(new Date(pack.disbandedDate)) : null,
                stats: {
                    pupsBorn: pack.pupsBorn || 0,
                    deaths: pack.deaths || 0,
                    currentMales,
                    currentFemales,
                    currentPups
                },
                ranks: ranksResult.recordset,
                subareas: subareasResult.recordset,
                members: members.map(m => ({
                    id: m.CharacterID,
                    name: m.CharacterName,
                    slug: m.Slug,
                    sex: m.Sex,
                    rankId: m.packRankId,
                    rankName: m.rankName,
                    displayOrder: m.displayOrder
                })),
                news
            }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// GET rogues (characters without a pack)
export async function getRogues(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT 
                c.CharacterID as id,
                c.CharacterName as name,
                c.Slug as slug,
                c.Sex as sex,
                c.MonthsAge as monthsAge,
                c.Status as status
            FROM Character c
            WHERE (c.PackID IS NULL OR c.PackID = 0) AND c.Status != 'Dead'
            ORDER BY c.CharacterName
        `);

        // Calculate stats
        const characters = result.recordset;
        const stats = {
            total: characters.length,
            males: characters.filter(c => c.sex === 'Male').length,
            females: characters.filter(c => c.sex === 'Female').length,
            pups: characters.filter(c => c.monthsAge !== null && c.monthsAge < 12).length
        };

        return { 
            jsonBody: {
                characters,
                stats
            },
            headers: { 'Cache-Control': 'public, max-age=60' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// POST create a new pack (staff only)
export async function createPack(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const body: any = await request.json();
        const { name, history, hierarchyExplanation, values, color1, color2, color1Name, color2Name, misc, ranks, subareaIds, foundedText } = body;

        if (!name || !color1 || !color2) {
            return { status: 400, body: "Name and colors are required" };
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const pool = await getPool();

        // Insert pack
        const packResult = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('slug', sql.NVarChar, slug)
            .input('history', sql.NVarChar, history || null)
            .input('hierarchyExplanation', sql.NVarChar, hierarchyExplanation || null)
            .input('values', sql.NVarChar, values || null)
            .input('color1', sql.NVarChar, color1)
            .input('color2', sql.NVarChar, color2)
            .input('color1Name', sql.NVarChar, color1Name || null)
            .input('color2Name', sql.NVarChar, color2Name || null)
            .input('misc', sql.NVarChar, misc || null)
            .input('foundedText', sql.NVarChar, foundedText || null)
            .query(`
                INSERT INTO Packs (name, slug, history, hierarchyExplanation, [values], color1, color2, color1Name, color2Name, misc, foundedText)
                OUTPUT INSERTED.id
                VALUES (@name, @slug, @history, @hierarchyExplanation, @values, @color1, @color2, @color1Name, @color2Name, @misc, @foundedText)
            `);

        const packId = packResult.recordset[0].id;

        // Create stats row
        await pool.request()
            .input('packId', sql.Int, packId)
            .query('INSERT INTO PackStats (packId) VALUES (@packId)');

        // Insert ranks
        if (ranks && ranks.length > 0) {
            for (let i = 0; i < ranks.length; i++) {
                await pool.request()
                    .input('packId', sql.Int, packId)
                    .input('name', sql.NVarChar, ranks[i])
                    .input('displayOrder', sql.Int, i + 1)
                    .query('INSERT INTO PackRanks (packId, name, displayOrder) VALUES (@packId, @name, @displayOrder)');
            }
        }

        // Insert subareas
        if (subareaIds && subareaIds.length > 0) {
            for (const subareaId of subareaIds) {
                await pool.request()
                    .input('packId', sql.Int, packId)
                    .input('subareaId', sql.NVarChar, subareaId)
                    .query('INSERT INTO PackSubareas (packId, subareaId) VALUES (@packId, @subareaId)');
            }
        }

        return {
            status: 201,
            jsonBody: { id: packId, slug, message: "Pack created" }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// PUT update pack (staff only)
export async function updatePack(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
        return auth.error!;
    }

    try {
        const id = request.params.id;
        const body: any = await request.json();
        const { name, history, hierarchyExplanation, values, color1, color2, color1Name, color2Name, misc, isActive, stats, foundedText, ranks, subareaIds } = body;

        const pool = await getPool();

        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('history', sql.NVarChar, history || null)
            .input('hierarchyExplanation', sql.NVarChar, hierarchyExplanation || null)
            .input('values', sql.NVarChar, values || null)
            .input('color1', sql.NVarChar, color1)
            .input('color2', sql.NVarChar, color2)
            .input('color1Name', sql.NVarChar, color1Name || null)
            .input('color2Name', sql.NVarChar, color2Name || null)
            .input('misc', sql.NVarChar, misc || null)
            .input('isActive', sql.Bit, isActive !== false)
            .input('disbandedDate', sql.DateTime, isActive === false ? new Date() : null)
            .input('foundedText', sql.NVarChar, foundedText || null)
            .query(`
                UPDATE Packs SET
                    name = @name,
                    history = @history,
                    hierarchyExplanation = @hierarchyExplanation,
                    [values] = @values,
                    color1 = @color1,
                    color2 = @color2,
                    color1Name = @color1Name,
                    color2Name = @color2Name,
                    misc = @misc,
                    isActive = @isActive,
                    disbandedDate = @disbandedDate,
                    foundedText = @foundedText
                WHERE id = @id
            `);

        // Update ranks if provided
        if (ranks !== undefined) {
            // Delete existing ranks
            await pool.request()
                .input('packId', sql.Int, id)
                .query('DELETE FROM PackRanks WHERE packId = @packId');
            
            // Insert new ranks
            if (ranks && ranks.length > 0) {
                for (let i = 0; i < ranks.length; i++) {
                    await pool.request()
                        .input('packId', sql.Int, id)
                        .input('name', sql.NVarChar, ranks[i])
                        .input('displayOrder', sql.Int, i + 1)
                        .query('INSERT INTO PackRanks (packId, name, displayOrder) VALUES (@packId, @name, @displayOrder)');
                }
            }
        }

        // Update subareas if provided
        if (subareaIds !== undefined) {
            // Delete existing subareas
            await pool.request()
                .input('packId', sql.Int, id)
                .query('DELETE FROM PackSubareas WHERE packId = @packId');
            
            // Insert new subareas
            if (subareaIds && subareaIds.length > 0) {
                for (const subareaId of subareaIds) {
                    await pool.request()
                        .input('packId', sql.Int, id)
                        .input('subareaId', sql.NVarChar, subareaId)
                        .query('INSERT INTO PackSubareas (packId, subareaId) VALUES (@packId, @subareaId)');
                }
            }
        }

        // Update stats if provided
        if (stats) {
            await pool.request()
                .input('packId', sql.Int, id)
                .input('pupsBorn', sql.Int, stats.pupsBorn || 0)
                .input('deaths', sql.Int, stats.deaths || 0)
                .query(`
                    UPDATE PackStats SET
                        pupsBorn = @pupsBorn,
                        deaths = @deaths
                    WHERE packId = @packId
                `);
        }

        return { jsonBody: { message: "Pack updated" } };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

// Register routes
app.http('getPacks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getPacks,
    route: 'packs'
});

app.http('getPackBySlug', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getPackBySlug,
    route: 'packs/{slug}'
});

app.http('getRogues', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: getRogues,
    route: 'rogues'
});

app.http('createPack', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: createPack,
    route: 'packs'
});

app.http('updatePack', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: updatePack,
    route: 'packs/{id}'
});
