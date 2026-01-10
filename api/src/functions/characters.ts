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

export async function getHeights(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT HeightID as id, HeightValue as name FROM Height ORDER BY HeightID');
        return { jsonBody: result.recordset };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function getBuilds(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT BuildID as id, BuildValue as name FROM Build ORDER BY BuildID');
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
                    c.UserID as odUserId, 
                    u.Username as username,
                    u.Created as userCreatedAt,
                    u.Description as playerInfo,
                    u.Facebook as facebook,
                    u.Instagram as instagram,
                    u.Discord as discord,
                    c.CharacterName as name, 
                    c.Surname as surname,
                    c.Sex as sex, 
                    c.MonthsAge as monthsAge, 
                    c.AvatarImage as imageUrl, 
                    c.PackID as packId,
                    p.PackName as packName,
                    hs.StatusValue as healthStatus,
                    c.HealthStatus_Id as healthStatusId,
                    c.CI_General_HTML as bio,
                    h.HeightValue as height,
                    c.HeightID as heightId,
                    b.BuildValue as build,
                    c.BuildID as buildId,
                    c.Experience as experience,
                    c.Physical as physical,
                    c.Knowledge as knowledge,
                    c.Total as totalSkill,
                    c.Father as father,
                    c.Mother as mother,
                    c.Birthplace as birthplace,
                    c.Siblings as siblings,
                    c.Pups as pups,
                    c.SpiritSymbol as spiritSymbol,
                    c.ProfileImage1 as profileImage1,
                    c.ProfileImage2 as profileImage2,
                    c.ProfileImage3 as profileImage3,
                    c.ProfileImage4 as profileImage4,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline,
                    (SELECT COUNT(*) FROM Post WHERE CharacterID = c.CharacterID) as icPostCount,
                    (SELECT COUNT(*) FROM OOCPost WHERE UserID = c.UserID) as oocPostCount
                FROM Character c
                LEFT JOIN [User] u ON c.UserID = u.UserID
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
        const characters = result.recordset.map(c => {
            const years = Math.floor(c.monthsAge / 12);
            const months = c.monthsAge % 12;
            const yearStr = years === 1 ? 'year' : 'years';
            const monthStr = months === 1 ? 'month' : 'months';
            const profileImages = [c.profileImage1, c.profileImage2, c.profileImage3, c.profileImage4].filter(Boolean);
            return {
                ...c,
                age: `${years} ${yearStr}, ${months} ${monthStr}`,
                profileImages
            };
        });

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
                    c.Surname as surname,
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
                    c.Total as totalSkill,
                    c.SpiritSymbol as spiritSymbol,
                    c.ProfileImage1 as profileImage1,
                    c.ProfileImage2 as profileImage2,
                    c.ProfileImage3 as profileImage3,
                    c.ProfileImage4 as profileImage4
                FROM Character c
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                WHERE c.CharacterID = @id
            `);
        
        if (result.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }

        const c = result.recordset[0];
        const years = Math.floor(c.monthsAge / 12);
        const months = c.monthsAge % 12;
        const yearStr = years === 1 ? 'year' : 'years';
        const monthStr = months === 1 ? 'month' : 'months';
        const profileImages = [c.profileImage1, c.profileImage2, c.profileImage3, c.profileImage4].filter(Boolean);
        const character = {
            ...c,
            age: `${years} ${yearStr} ${months} ${monthStr}`,
            profileImages
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
        const { name, surname, sex, monthsAge, imageUrl, bio, healthStatusId, father, mother, heightId, buildId, birthplace, siblings, pups, spiritSymbol, profileImages } = body;

        // Extract profile images from array
        const profileImage1 = profileImages?.[0] || null;
        const profileImage2 = profileImages?.[1] || null;
        const profileImage3 = profileImages?.[2] || null;
        const profileImage4 = profileImages?.[3] || null;

        const pool = await getPool();
        
        await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('name', sql.NVarChar, name)
            .input('surname', sql.NVarChar, surname || null)
            .input('sex', sql.NVarChar, sex)
            .input('monthsAge', sql.Int, monthsAge)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('bio', sql.NVarChar, bio)
            .input('healthStatusId', sql.Int, healthStatusId)
            .input('father', sql.NVarChar, father || null)
            .input('mother', sql.NVarChar, mother || null)
            .input('heightId', sql.Int, heightId || null)
            .input('buildId', sql.Int, buildId || null)
            .input('birthplace', sql.NVarChar, birthplace || null)
            .input('siblings', sql.NVarChar, siblings || null)
            .input('pups', sql.NVarChar, pups || null)
            .input('spiritSymbol', sql.NVarChar, spiritSymbol || null)
            .input('profileImage1', sql.NVarChar, profileImage1)
            .input('profileImage2', sql.NVarChar, profileImage2)
            .input('profileImage3', sql.NVarChar, profileImage3)
            .input('profileImage4', sql.NVarChar, profileImage4)
            .query(`
                UPDATE Character 
                SET CharacterName = @name, Surname = @surname, Sex = @sex, MonthsAge = @monthsAge, AvatarImage = @imageUrl, CI_General_HTML = @bio, HealthStatus_Id = @healthStatusId, Father = @father, Mother = @mother, HeightID = @heightId, BuildID = @buildId, Birthplace = @birthplace, Siblings = @siblings, Pups = @pups, SpiritSymbol = @spiritSymbol, ProfileImage1 = @profileImage1, ProfileImage2 = @profileImage2, ProfileImage3 = @profileImage3, ProfileImage4 = @profileImage4
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

export async function getCharacterThreadlog(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    
    if (!characterId) {
        return { status: 400, body: "Please provide a character id" };
    }

    try {
        const pool = await getPool();
        
        // Get all threads the character has posted in, ordered by thread creation date desc
        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                WITH CharacterThreads AS (
                    SELECT DISTINCT ThreadID
                    FROM Post
                    WHERE CharacterID = @characterId
                    AND ThreadID IN (SELECT ThreadID FROM Thread WHERE OOCForumID IS NULL OR OriginalRegionId IS NOT NULL)
                ),
                ThreadInfo AS (
                    SELECT 
                        t.ThreadID,
                        t.Created as threadCreated,
                        (SELECT TOP 1 p.Subject FROM Post p WHERE p.ThreadID = t.ThreadID ORDER BY p.Created ASC) as threadTitle,
                        (SELECT COUNT(*) FROM Post p WHERE p.ThreadID = t.ThreadID) as replyCount
                    FROM Thread t
                    WHERE t.ThreadID IN (SELECT ThreadID FROM CharacterThreads)
                ),
                DistinctParticipants AS (
                    SELECT DISTINCT p.ThreadID, c.CharacterID, c.CharacterName
                    FROM Post p
                    JOIN Character c ON p.CharacterID = c.CharacterID
                    WHERE p.ThreadID IN (SELECT ThreadID FROM CharacterThreads)
                ),
                ThreadParticipants AS (
                    SELECT 
                        ThreadID,
                        STRING_AGG(CharacterName, ', ') WITHIN GROUP (ORDER BY CharacterName) as participants,
                        STRING_AGG(CAST(CharacterID AS VARCHAR), ', ') WITHIN GROUP (ORDER BY CharacterName) as participantIds
                    FROM DistinctParticipants
                    GROUP BY ThreadID
                ),
                LastPosts AS (
                    SELECT 
                        p.ThreadID,
                        c.CharacterID as lastPosterId,
                        c.CharacterName as lastPosterName,
                        p.Created as lastPostDate,
                        ROW_NUMBER() OVER (PARTITION BY p.ThreadID ORDER BY p.Created DESC) as rn
                    FROM Post p
                    JOIN Character c ON p.CharacterID = c.CharacterID
                    WHERE p.ThreadID IN (SELECT ThreadID FROM CharacterThreads)
                )
                SELECT 
                    ti.ThreadID as threadId,
                    ti.threadTitle,
                    ti.threadCreated,
                    ti.replyCount,
                    tp.participants,
                    tp.participantIds,
                    lp.lastPosterId,
                    lp.lastPosterName,
                    lp.lastPostDate
                FROM ThreadInfo ti
                LEFT JOIN ThreadParticipants tp ON ti.ThreadID = tp.ThreadID
                LEFT JOIN LastPosts lp ON ti.ThreadID = lp.ThreadID AND lp.rn = 1
                ORDER BY ti.threadCreated DESC
            `);
        
        return {
            jsonBody: result.recordset
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

app.http('getHeights', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'heights',
    handler: getHeights
});

app.http('getBuilds', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'builds',
    handler: getBuilds
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

app.http('getCharacterThreadlog', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'characters/{id}/threadlog',
    handler: getCharacterThreadlog
});
