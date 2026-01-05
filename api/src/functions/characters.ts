import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

export async function getHealthStatuses(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT StatusID as id, StatusValue as name FROM HealthStatus');
        return { jsonBody: result.recordset };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function getCharacters(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.query.get('userId');
    
    try {
        const pool = await getPool();
        let query = `
                SELECT 
                    c.CharacterID as id, 
                    c.UserID as userId, 
                    c.CharacterName as name, 
                    c.Sex as sex, 
                    c.MonthsAge as monthsAge, 
                    c.AvatarImage as imageUrl, 
                    c.PackID as packId,
                    p.PackName as packName,
                    hs.StatusValue as healthStatus,
                    c.HealthStatus_Id as healthStatusId,
                    c.CI_General_HTML as bio,
                    h.HeightValue as height,
                    b.BuildValue as build,
                    c.Experience as experience,
                    c.Physical as physical,
                    c.Knowledge as knowledge,
                    c.Total as totalSkill,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline
                FROM Character c
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                LEFT JOIN Pack p ON c.PackID = p.PackID
                LEFT JOIN Height h ON c.HeightID = h.HeightID
                LEFT JOIN Build b ON c.BuildID = b.BuildID
            `;
        
        const requestObj = pool.request();

        if (userId) {
            requestObj.input('userId', sql.Int, parseInt(userId));
            query += ` WHERE c.UserID = @userId`;
        } else {
            query += ` WHERE c.Is_Active = 1`;
        }

        query += ` ORDER BY c.CharacterName`;

        const result = await requestObj.query(query);
        
        // Map monthsAge to age string if needed, or handle in client
        
        // Map monthsAge to age string if needed, or handle in client
        const characters = result.recordset.map(c => ({
            ...c,
            age: `${Math.floor(c.monthsAge / 12)} years ${c.monthsAge % 12} months` // Simple conversion
        }));

        return {
            jsonBody: characters
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function getCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    
    if (!id) {
        return { status: 400, body: "Please provide a character id" };
    }

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query(`
                SELECT 
                    c.CharacterID as id, 
                    c.UserID as userId, 
                    c.CharacterName as name, 
                    c.Sex as sex, 
                    c.MonthsAge as monthsAge, 
                    c.AvatarImage as imageUrl, 
                    c.PackID as packId,
                    hs.StatusValue as healthStatus,
                    c.HealthStatus_Id as healthStatusId,
                    c.CI_General_HTML as bio,
                    c.Experience as experience,
                    c.Physical as physical,
                    c.Knowledge as knowledge,
                    c.Total as totalSkill
                FROM Character c
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                WHERE c.CharacterID = @id
            `);
        
        if (result.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }

        const c = result.recordset[0];
        const character = {
            ...c,
            age: `${Math.floor(c.monthsAge / 12)} years ${c.monthsAge % 12} months`
        };

        return {
            jsonBody: character
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function createCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId, name, sex, age, imageUrl, bio, healthStatusId } = body;
        
        const monthsAge = body.monthsAge || 0; 
        const hStatusId = healthStatusId || 1;

        const pool = await getPool();
        
        const result = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('name', sql.NVarChar, name)
            .input('sex', sql.NVarChar, sex)
            .input('monthsAge', sql.Int, monthsAge)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('bio', sql.NVarChar, bio)
            .input('healthStatusId', sql.Int, hStatusId)
            .query(`
                INSERT INTO Character (UserID, CharacterName, Sex, MonthsAge, AvatarImage, CI_General_HTML, HealthStatus_Id)
                OUTPUT INSERTED.CharacterID
                VALUES (@userId, @name, @sex, @monthsAge, @imageUrl, @bio, @healthStatusId)
            `);
            
        return {
            status: 201,
            jsonBody: { id: result.recordset[0].CharacterID }
        };
    } catch (error) {
        context.error('Create character failed', error);
        return { status: 500, body: "Internal Server Error: " + error.message };
    }
}

export async function updateCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    if (!id) return { status: 400, body: "Missing ID" };

    try {
        const body = await request.json() as any;
        const { name, sex, monthsAge, imageUrl, bio, healthStatusId } = body;

        const pool = await getPool();
        
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('name', sql.NVarChar, name)
            .input('sex', sql.NVarChar, sex)
            .input('monthsAge', sql.Int, monthsAge)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('bio', sql.NVarChar, bio)
            .input('healthStatusId', sql.Int, healthStatusId)
            .query(`
                UPDATE Character 
                SET CharacterName = @name, Sex = @sex, MonthsAge = @monthsAge, AvatarImage = @imageUrl, CI_General_HTML = @bio, HealthStatus_Id = @healthStatusId
                WHERE CharacterID = @id
            `);
            
        return { status: 200, body: "Updated" };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function getCharacterStats(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                COUNT(*) as totalCharacters,
                SUM(CASE WHEN Sex = 'Male' THEN 1 ELSE 0 END) as maleCount,
                SUM(CASE WHEN Sex = 'Female' THEN 1 ELSE 0 END) as femaleCount,
                SUM(CASE WHEN MonthsAge < 12 THEN 1 ELSE 0 END) as pupsCount
            FROM Character
            WHERE Is_Active = 1
        `);
        
        const stats = result.recordset[0];
        return { 
            jsonBody: {
                totalCharacters: stats.totalCharacters || 0,
                maleCount: stats.maleCount || 0,
                femaleCount: stats.femaleCount || 0,
                pupsCount: stats.pupsCount || 0
            }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getHealthStatuses', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health-statuses',
    handler: getHealthStatuses
});

app.http('getCharacters', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'characters',
    handler: getCharacters
});

// IMPORTANT: This must be registered BEFORE characters/{id} to avoid route conflicts
app.http('getCharacterStats', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'character-stats',
    handler: getCharacterStats
});

app.http('getCharacter', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'characters/{id}',
    handler: getCharacter
});

app.http('createCharacter', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'characters',
    handler: createCharacter
});

app.http('updateCharacter', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'characters/{id}',
    handler: updateCharacter
});
