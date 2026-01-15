import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// GET all adoptables
export async function getAdoptables(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                a.AdoptableID as id,
                a.CharacterName as characterName,
                a.ImageURL as imageUrl,
                a.Sex as sex,
                a.Birthplace as birthplace,
                a.AgeYears as ageYears,
                a.AgeMonths as ageMonths,
                a.Parents as parents,
                a.HeightID as heightId,
                h.HeightValue as height,
                a.BuildID as buildId,
                b.BuildValue as build,
                a.SpiritSymbol as spiritSymbol,
                a.CoatColor1 as coatColor1,
                a.CoatColor2 as coatColor2,
                a.CoatColor3 as coatColor3,
                a.CoatColor4 as coatColor4,
                a.EyeColor as eyeColor,
                a.Siblings as siblings,
                a.CharacterInfo as characterInfo,
                a.CreatedByUserID as createdByUserId,
                u.Username as createdByUsername,
                a.CreatedAt as createdAt
            FROM Adoptable a
            LEFT JOIN Height h ON a.HeightID = h.HeightID
            LEFT JOIN Build b ON a.BuildID = b.BuildID
            LEFT JOIN [User] u ON a.CreatedByUserID = u.UserID
            ORDER BY a.CreatedAt DESC
        `);
        
        return { jsonBody: result.recordset };
    } catch (error) {
        context.error('Error fetching adoptables:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// GET single adoptable by ID
export async function getAdoptable(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    a.AdoptableID as id,
                    a.CharacterName as characterName,
                    a.ImageURL as imageUrl,
                    a.Sex as sex,
                    a.Birthplace as birthplace,
                    a.AgeYears as ageYears,
                    a.AgeMonths as ageMonths,
                    a.Parents as parents,
                    a.HeightID as heightId,
                    h.HeightValue as height,
                    a.BuildID as buildId,
                    b.BuildValue as build,
                    a.SpiritSymbol as spiritSymbol,
                    a.CoatColor1 as coatColor1,
                    a.CoatColor2 as coatColor2,
                    a.CoatColor3 as coatColor3,
                    a.CoatColor4 as coatColor4,
                    a.EyeColor as eyeColor,
                    a.Siblings as siblings,
                    a.CharacterInfo as characterInfo,
                    a.CreatedByUserID as createdByUserId,
                    u.Username as createdByUsername,
                    a.CreatedAt as createdAt
                FROM Adoptable a
                LEFT JOIN Height h ON a.HeightID = h.HeightID
                LEFT JOIN Build b ON a.BuildID = b.BuildID
                LEFT JOIN [User] u ON a.CreatedByUserID = u.UserID
                WHERE a.AdoptableID = @id
            `);
        
        if (result.recordset.length === 0) {
            return { status: 404, body: "Adoptable not found" };
        }
        
        return { jsonBody: result.recordset[0] };
    } catch (error) {
        context.error('Error fetching adoptable:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// CREATE new adoptable
export async function createAdoptable(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        
        context.log('Received adoptable body:', JSON.stringify(body));
        
        // Validate required fields
        if (!body.characterName || !body.sex || !body.createdByUserId) {
            context.log('Validation failed - characterName:', body.characterName, 'sex:', body.sex, 'createdByUserId:', body.createdByUserId);
            return { status: 400, body: "Character name, sex, and user ID are required" };
        }
        
        const pool = await getPool();
        const result = await pool.request()
            .input('characterName', sql.NVarChar(100), body.characterName)
            .input('imageUrl', sql.NVarChar(500), body.imageUrl || null)
            .input('sex', sql.NVarChar(20), body.sex)
            .input('birthplace', sql.NVarChar(200), body.birthplace || null)
            .input('ageYears', sql.Int, body.ageYears || 0)
            .input('ageMonths', sql.Int, body.ageMonths || 0)
            .input('parents', sql.NVarChar(500), body.parents || null)
            .input('heightId', sql.Int, body.heightId || null)
            .input('buildId', sql.Int, body.buildId || null)
            .input('spiritSymbol', sql.NVarChar(50), body.spiritSymbol || null)
            .input('coatColor1', sql.NVarChar(7), body.coatColor1 || null)
            .input('coatColor2', sql.NVarChar(7), body.coatColor2 || null)
            .input('coatColor3', sql.NVarChar(7), body.coatColor3 || null)
            .input('coatColor4', sql.NVarChar(7), body.coatColor4 || null)
            .input('eyeColor', sql.NVarChar(7), body.eyeColor || null)
            .input('siblings', sql.NVarChar(500), body.siblings || null)
            .input('characterInfo', sql.NVarChar(sql.MAX), body.characterInfo || null)
            .input('createdByUserId', sql.Int, body.createdByUserId)
            .query(`
                INSERT INTO Adoptable (
                    CharacterName, ImageURL, Sex, Birthplace, AgeYears, AgeMonths,
                    Parents, HeightID, BuildID, SpiritSymbol, CoatColor1, CoatColor2,
                    CoatColor3, CoatColor4, EyeColor, Siblings, CharacterInfo, CreatedByUserID
                )
                OUTPUT INSERTED.AdoptableID as id
                VALUES (
                    @characterName, @imageUrl, @sex, @birthplace, @ageYears, @ageMonths,
                    @parents, @heightId, @buildId, @spiritSymbol, @coatColor1, @coatColor2,
                    @coatColor3, @coatColor4, @eyeColor, @siblings, @characterInfo, @createdByUserId
                )
            `);
        
        return { 
            status: 201, 
            jsonBody: { id: result.recordset[0].id, message: "Adoptable created successfully" }
        };
    } catch (error) {
        context.error('Error creating adoptable:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// UPDATE adoptable
export async function updateAdoptable(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    
    try {
        const body = await request.json() as any;
        const pool = await getPool();
        
        // Get the adoptable first to check ownership
        const existing = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT CreatedByUserID FROM Adoptable WHERE AdoptableID = @id');
        
        if (existing.recordset.length === 0) {
            return { status: 404, body: "Adoptable not found" };
        }
        
        // Check if user is owner or moderator
        const createdByUserId = existing.recordset[0].CreatedByUserID;
        if (body.requestingUserId !== createdByUserId && !body.isModerator) {
            return { status: 403, body: "Not authorized to edit this adoptable" };
        }
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('characterName', sql.NVarChar(100), body.characterName)
            .input('imageUrl', sql.NVarChar(500), body.imageUrl || null)
            .input('sex', sql.NVarChar(20), body.sex)
            .input('birthplace', sql.NVarChar(200), body.birthplace || null)
            .input('ageYears', sql.Int, body.ageYears || 0)
            .input('ageMonths', sql.Int, body.ageMonths || 0)
            .input('parents', sql.NVarChar(500), body.parents || null)
            .input('heightId', sql.Int, body.heightId || null)
            .input('buildId', sql.Int, body.buildId || null)
            .input('spiritSymbol', sql.NVarChar(50), body.spiritSymbol || null)
            .input('coatColor1', sql.NVarChar(7), body.coatColor1 || null)
            .input('coatColor2', sql.NVarChar(7), body.coatColor2 || null)
            .input('coatColor3', sql.NVarChar(7), body.coatColor3 || null)
            .input('coatColor4', sql.NVarChar(7), body.coatColor4 || null)
            .input('eyeColor', sql.NVarChar(7), body.eyeColor || null)
            .input('siblings', sql.NVarChar(500), body.siblings || null)
            .input('characterInfo', sql.NVarChar(sql.MAX), body.characterInfo || null)
            .query(`
                UPDATE Adoptable SET
                    CharacterName = @characterName,
                    ImageURL = @imageUrl,
                    Sex = @sex,
                    Birthplace = @birthplace,
                    AgeYears = @ageYears,
                    AgeMonths = @ageMonths,
                    Parents = @parents,
                    HeightID = @heightId,
                    BuildID = @buildId,
                    SpiritSymbol = @spiritSymbol,
                    CoatColor1 = @coatColor1,
                    CoatColor2 = @coatColor2,
                    CoatColor3 = @coatColor3,
                    CoatColor4 = @coatColor4,
                    EyeColor = @eyeColor,
                    Siblings = @siblings,
                    CharacterInfo = @characterInfo
                WHERE AdoptableID = @id
            `);
        
        return { jsonBody: { message: "Adoptable updated successfully" } };
    } catch (error) {
        context.error('Error updating adoptable:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// DELETE adoptable
export async function deleteAdoptable(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    
    try {
        const body = await request.json() as any;
        const pool = await getPool();
        
        // Get the adoptable first to check ownership
        const existing = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT CreatedByUserID FROM Adoptable WHERE AdoptableID = @id');
        
        if (existing.recordset.length === 0) {
            return { status: 404, body: "Adoptable not found" };
        }
        
        // Check if user is owner or moderator
        const createdByUserId = existing.recordset[0].CreatedByUserID;
        if (body.requestingUserId !== createdByUserId && !body.isModerator) {
            return { status: 403, body: "Not authorized to delete this adoptable" };
        }
        
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Adoptable WHERE AdoptableID = @id');
        
        return { jsonBody: { message: "Adoptable deleted successfully" } };
    } catch (error) {
        context.error('Error deleting adoptable:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Register endpoints
app.http('getAdoptables', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'adoptables',
    handler: getAdoptables
});

app.http('getAdoptable', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'adoptables/{id}',
    handler: getAdoptable
});

app.http('createAdoptable', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'adoptables',
    handler: createAdoptable
});

app.http('updateAdoptable', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'adoptables/{id}',
    handler: updateAdoptable
});

app.http('deleteAdoptable', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'adoptables/{id}',
    handler: deleteAdoptable
});
