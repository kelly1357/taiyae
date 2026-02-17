import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';
import { checkAndRevokeFullProfile } from './achievements';
import { formatHorizonDateString } from '../horizonCalendar';
import { generateUniqueSlug } from '../slugify';

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
    const characterId = request.query.get('characterId');
    const characterSlug = request.query.get('characterSlug');
    const includeInactive = request.query.get('includeInactive') === 'true';
    
    // Determine if this is a single character lookup (needs full details) or a list (optimized)
    const isSingleCharacter = !!(characterId || characterSlug);
    
    try {
        const pool = await getPool();
        
        // Base query - only include expensive post counts for single character lookups
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
                    u.Is_Moderator as isModerator,
                    u.Is_Admin as isAdmin,
                    u.Is_Absent as isAbsent,
                    u.Absence_Note as absenceNote,
                    c.CharacterName as name, 
                    c.Surname as surname,
                    c.Slug as slug,
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
                    COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) as status,
                    c.DeathDate as deathDate,
                    COALESCE(c.ShowInDropdown, 1) as showInDropdown,
                    CASE 
                        WHEN c.LastActiveAt > DATEADD(minute, -15, GETDATE()) THEN 1 
                        ELSE 0 
                    END as isOnline` + (isSingleCharacter ? `,
                    (SELECT COUNT(*) FROM Post WHERE CharacterID = c.CharacterID) as icPostCount,
                    (SELECT COUNT(*) FROM Post p2 
                     JOIN Thread t2 ON p2.ThreadID = t2.ThreadID 
                     WHERE p2.UserID = c.UserID 
                       AND t2.OOCForumID IS NOT NULL 
                       AND t2.OriginalRegionId IS NULL) as oocPostCount` : '') + `
                FROM Character c
                LEFT JOIN [User] u ON c.UserID = u.UserID
                LEFT JOIN HealthStatus hs ON c.HealthStatus_Id = hs.StatusID
                LEFT JOIN Pack p ON c.PackID = p.PackID
                LEFT JOIN Height h ON c.HeightID = h.HeightID
                LEFT JOIN Build b ON c.BuildID = b.BuildID
            `;
        
        const requestObj = pool.request();

        if (characterId) {
            // Fetch a specific character by ID (includes inactive/dead for profile viewing)
            requestObj.input('characterId', sql.Int, parseInt(characterId));
            query += ` WHERE c.CharacterID = @characterId`;
        } else if (characterSlug) {
            // Fetch a specific character by slug (includes inactive/dead for profile viewing)
            requestObj.input('characterSlug', sql.NVarChar, characterSlug);
            query += ` WHERE c.Slug = @characterSlug`;
        } else if (userId) {
            // When fetching for a specific user (character management), return all their characters
            requestObj.input('userId', sql.Int, parseInt(userId));
            query += ` WHERE c.UserID = @userId`;
        } else if (includeInactive) {
            // Include all characters (active, inactive, and dead)
            // No WHERE clause needed
        } else {
            // Public character list - only show Active characters (not Inactive or Dead)
            query += ` WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'`;
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
            jsonBody: characters,
            headers: isSingleCharacter ? {} : { 'Cache-Control': 'public, max-age=60' }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function getCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const id = request.params.id;
    
    if (!id) {
        return { status: 400, body: "Please provide a character id or slug" };
    }

    // Check if id is numeric (character ID) or string (slug)
    const isNumeric = /^\d+$/.test(id);

    try {
        const pool = await getPool();
        const requestObj = pool.request();
        
        let whereClause: string;
        if (isNumeric) {
            requestObj.input('id', sql.Int, parseInt(id));
            whereClause = 'c.CharacterID = @id';
        } else {
            requestObj.input('slug', sql.NVarChar, id);
            whereClause = 'c.Slug = @slug';
        }
        
        const result = await requestObj.query(`
                SELECT 
                    c.CharacterID as id, 
                    c.UserID as userId, 
                    c.CharacterName as name, 
                    c.Surname as surname,
                    c.Slug as slug,
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
                WHERE ${whereClause}
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
        
        // Generate unique slug from character name
        const slug = await generateUniqueSlug(pool, name);
        
        const result = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .input('name', sql.NVarChar, name)
            .input('slug', sql.NVarChar, slug)
            .input('sex', sql.NVarChar, sex)
            .input('monthsAge', sql.Int, monthsAge)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('bio', sql.NVarChar, bio)
            .input('healthStatusId', sql.Int, hStatusId)
            .query(`
                INSERT INTO Character (UserID, CharacterName, Slug, Sex, MonthsAge, AvatarImage, CI_General_HTML, HealthStatus_Id, Created)
                OUTPUT INSERTED.CharacterID, INSERTED.Slug
                VALUES (@userId, @name, @slug, @sex, @monthsAge, @imageUrl, @bio, @healthStatusId, GETDATE())
            `);
            
        return {
            status: 201,
            jsonBody: { id: result.recordset[0].CharacterID, slug: result.recordset[0].Slug }
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
        const { name, surname, sex, monthsAge, imageUrl, bio, healthStatusId, father, mother, heightId, buildId, birthplace, siblings, pups, spiritSymbol, profileImages, status, deathDate } = body;

        // Extract profile images from array
        const profileImage1 = profileImages?.[0] || null;
        const profileImage2 = profileImages?.[1] || null;
        const profileImage3 = profileImages?.[2] || null;
        const profileImage4 = profileImages?.[3] || null;

        const pool = await getPool();
        
        // Get the userId for this character before updating (for achievement check)
        const characterResult = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .query('SELECT UserID FROM Character WHERE CharacterID = @id');
        const userId = characterResult.recordset[0]?.UserID;
        
        const updateRequest = pool.request()
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
            .input('status', sql.VarChar(20), status || 'Active')
            .input('deathDate', sql.VarChar(50), status === 'Dead' ? (deathDate || formatHorizonDateString()) : null);
        
        // Update Is_Active based on status for backward compatibility
        const isActive = status === 'Active' ? 1 : 0;
        // Update ShowInDropdown when status changes
        const showInDropdown = status === 'Active' ? 1 : 0;
        updateRequest.input('isActive', sql.Bit, isActive);
        updateRequest.input('showInDropdown', sql.Bit, showInDropdown);
        
        await updateRequest.query(`
            UPDATE Character 
            SET CharacterName = @name, Surname = @surname, Sex = @sex, MonthsAge = @monthsAge, AvatarImage = @imageUrl, CI_General_HTML = @bio, HealthStatus_Id = @healthStatusId, Father = @father, Mother = @mother, HeightID = @heightId, BuildID = @buildId, Birthplace = @birthplace, Siblings = @siblings, Pups = @pups, SpiritSymbol = @spiritSymbol, ProfileImage1 = @profileImage1, ProfileImage2 = @profileImage2, ProfileImage3 = @profileImage3, ProfileImage4 = @profileImage4, Status = @status, DeathDate = @deathDate, Is_Active = @isActive, ShowInDropdown = @showInDropdown
            WHERE CharacterID = @id
        `);
        
        // Check if FULL_PROFILE achievement should be revoked
        if (userId) {
            await checkAndRevokeFullProfile(userId);
        }
            
        return { status: 200, body: "Updated" };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Moderator-only endpoint to update character name, sex, age, and status
export async function moderatorUpdateCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    if (!characterId) return { status: 400, body: "Missing character ID" };

    try {
        const body = await request.json() as any;
        const { name, sex, monthsAge, status, userId } = body;
        
        context.log('Moderator edit request:', { characterId, name, sex, monthsAge, status, userId });

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        const pool = await getPool();

        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can edit character details" };
        }

        // Build update query dynamically based on provided fields
        const updates: string[] = [];
        const requestObj = pool.request().input('id', sql.Int, parseInt(characterId));

        if (name !== undefined) {
            updates.push('CharacterName = @name');
            requestObj.input('name', sql.NVarChar, name);
        }
        if (sex !== undefined) {
            updates.push('Sex = @sex');
            requestObj.input('sex', sql.NVarChar, sex);
        }
        if (monthsAge !== undefined) {
            updates.push('MonthsAge = @monthsAge');
            requestObj.input('monthsAge', sql.Int, monthsAge);
        }
        if (status !== undefined && ['Active', 'Inactive', 'Dead'].includes(status)) {
            updates.push('Status = @status');
            updates.push('Is_Active = @isActive');
            updates.push('ShowInDropdown = @showInDropdown');
            requestObj.input('status', sql.NVarChar, status);
            requestObj.input('isActive', sql.Bit, status === 'Active' ? 1 : 0);
            requestObj.input('showInDropdown', sql.Bit, status === 'Active' ? 1 : 0);
            
            // Set DeathDate when marking as Dead, clear it otherwise
            if (status === 'Dead') {
                updates.push('DeathDate = @deathDate');
                requestObj.input('deathDate', sql.VarChar(50), formatHorizonDateString());
            } else {
                updates.push('DeathDate = NULL');
            }
            
            context.log('Status update included:', { status, isActive: status === 'Active' ? 1 : 0 });
        }

        if (updates.length === 0) {
            return { status: 400, body: "No fields to update" };
        }

        updates.push('Modified = GETDATE()');
        
        const updateQuery = `UPDATE Character SET ${updates.join(', ')} WHERE CharacterID = @id`;
        context.log('Executing update query:', updateQuery);

        const result = await requestObj.query(updateQuery);
        context.log('Update result:', result.rowsAffected);
            
        return { 
            status: 200, 
            jsonBody: { 
                message: "Character updated successfully",
                rowsAffected: result.rowsAffected,
                fieldsUpdated: updates.length - 1 // exclude Modified
            }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error.message };
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

export async function getThreadSummaries(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    
    if (!characterId) {
        return { status: 400, body: "Please provide a character id" };
    }

    try {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(`
                SELECT ThreadID as threadId, Summary as summary
                FROM CharacterThreadSummary
                WHERE CharacterID = @characterId
            `);
        
        // Convert to a record object for easier frontend use
        const summaries: Record<number, string> = {};
        for (const row of result.recordset) {
            summaries[row.threadId] = row.summary;
        }
        
        return {
            jsonBody: summaries
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function updateThreadSummary(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    const threadId = request.params.threadId;
    
    if (!characterId || !threadId) {
        return { status: 400, body: "Please provide character id and thread id" };
    }

    try {
        const body: any = await request.json();
        const { summary } = body;
        
        if (summary === undefined) {
            return { status: 400, body: "Summary is required" };
        }

        const pool = await getPool();
        
        // Verify the user owns this character (get character's userId)
        const charResult = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query('SELECT UserID FROM Character WHERE CharacterID = @characterId');
        
        if (charResult.recordset.length === 0) {
            return { status: 404, body: "Character not found" };
        }
        
        // Use MERGE to insert or update
        await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('threadId', sql.Int, parseInt(threadId))
            .input('summary', sql.NVarChar(sql.MAX), summary)
            .query(`
                MERGE CharacterThreadSummary AS target
                USING (SELECT @characterId AS CharacterID, @threadId AS ThreadID) AS source
                ON target.CharacterID = source.CharacterID AND target.ThreadID = source.ThreadID
                WHEN MATCHED THEN
                    UPDATE SET Summary = @summary, Modified = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (CharacterID, ThreadID, Summary, Created, Modified)
                    VALUES (@characterId, @threadId, @summary, GETDATE(), GETDATE());
            `);
        
        return {
            jsonBody: { success: true }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Get all inactive and dead characters (moderator-only)
export async function getInactiveCharacters(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId } = body;

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        const pool = await getPool();

        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can view inactive characters" };
        }

        // Get inactive and dead characters with their last post date
        const result = await pool.request().query(`
            SELECT 
                c.CharacterID as id,
                c.Slug as slug,
                c.CharacterName as name,
                c.Surname as surname,
                c.AvatarImage as imageUrl,
                c.Sex as sex,
                c.MonthsAge as monthsAge,
                u.Username as playerName,
                u.UserID as playerId,
                p.PackName as packName,
                COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) as status,
                c.DeathDate as deathDate,
                (SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID) as lastPostDate,
                (SELECT COUNT(*) FROM Post WHERE CharacterID = c.CharacterID) as totalPosts,
                DATEDIFF(day, 
                    COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created), 
                    GETDATE()
                ) as daysSinceLastPost
            FROM Character c
            LEFT JOIN [User] u ON c.UserID = u.UserID
            LEFT JOIN Pack p ON c.PackID = p.PackID
            WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) IN ('Inactive', 'Dead')
            ORDER BY c.CharacterName
        `);

        const characters = result.recordset.map(c => {
            const years = Math.floor(c.monthsAge / 12);
            const months = c.monthsAge % 12;
            return {
                ...c,
                age: `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''}`
            };
        });

        return { jsonBody: characters };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Get characters that should be auto-inactivated (no posts in 30 days)
export async function getCharactersToInactivate(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId } = body;

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        const pool = await getPool();

        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can view this" };
        }

        // Get active characters with no posts in 30+ days
        const result = await pool.request().query(`
            SELECT 
                c.CharacterID as id,
                c.Slug as slug,
                c.CharacterName as name,
                c.Surname as surname,
                c.AvatarImage as imageUrl,
                c.Sex as sex,
                c.MonthsAge as monthsAge,
                u.Username as playerName,
                u.UserID as playerId,
                p.PackName as packName,
                (SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID) as lastPostDate,
                (SELECT COUNT(*) FROM Post WHERE CharacterID = c.CharacterID) as totalPosts,
                DATEDIFF(day, 
                    COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created), 
                    GETDATE()
                ) as daysSinceLastPost
            FROM Character c
            LEFT JOIN [User] u ON c.UserID = u.UserID
            LEFT JOIN Pack p ON c.PackID = p.PackID
            WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
              AND DATEDIFF(day, 
                    COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created), 
                    GETDATE()
                  ) >= 30
            ORDER BY daysSinceLastPost DESC
        `);

        const characters = result.recordset.map(c => {
            const years = Math.floor(c.monthsAge / 12);
            const months = c.monthsAge % 12;
            return {
                ...c,
                age: `${years} yr${years !== 1 ? 's' : ''}, ${months} mo${months !== 1 ? 's' : ''}`
            };
        });

        return { jsonBody: characters };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Moderator-only endpoint to change character status
export async function updateCharacterStatus(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    if (!characterId) return { status: 400, body: "Missing character ID" };

    try {
        const body = await request.json() as any;
        const { userId, status, deathDate } = body;

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        if (!status || !['Active', 'Inactive', 'Dead'].includes(status)) {
            return { status: 400, body: "Invalid status. Must be Active, Inactive, or Dead" };
        }

        const pool = await getPool();

        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can change character status" };
        }

        // Update character status
        const isActive = status === 'Active' ? 1 : 0;
        // When deactivating, remove from dropdown. When activating, add to dropdown.
        const showInDropdown = status === 'Active' ? 1 : 0;
        
        await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('status', sql.VarChar(20), status)
            .input('deathDate', sql.VarChar(50), status === 'Dead' ? (deathDate || formatHorizonDateString()) : null)
            .input('isActive', sql.Bit, isActive)
            .input('showInDropdown', sql.Bit, showInDropdown)
            .query(`
                UPDATE Character 
                SET Status = @status, 
                    DeathDate = @deathDate, 
                    Is_Active = @isActive,
                    ShowInDropdown = @showInDropdown,
                    Modified = GETDATE()
                WHERE CharacterID = @characterId
            `);

        return { status: 200, jsonBody: { message: `Character status updated to ${status}` } };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Bulk inactivate characters (moderator-only)
export async function bulkInactivateCharacters(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { userId, characterIds } = body;

        if (!userId) {
            return { status: 400, body: "Missing user ID" };
        }

        if (!characterIds || !Array.isArray(characterIds) || characterIds.length === 0) {
            return { status: 400, body: "No characters specified" };
        }

        const pool = await getPool();

        // Verify the user is a moderator or admin
        const modCheck = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT Is_Moderator, Is_Admin FROM [User] WHERE UserID = @userId');
        
        if (modCheck.recordset.length === 0) {
            return { status: 404, body: "User not found" };
        }
        
        const isModerator = modCheck.recordset[0].Is_Moderator || modCheck.recordset[0].Is_Admin;
        if (!isModerator) {
            return { status: 403, body: "Only moderators can inactivate characters" };
        }

        // Bulk update
        const idList = characterIds.map((id: number) => Number(id)).join(',');
        await pool.request().query(`
            UPDATE Character 
            SET Status = 'Inactive', 
                Is_Active = 0,
                ShowInDropdown = 0,
                Modified = GETDATE()
            WHERE CharacterID IN (${idList})
              AND COALESCE(Status, CASE WHEN Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
        `);

        return { status: 200, jsonBody: { message: `${characterIds.length} character(s) marked as inactive` } };
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

app.http('getInactiveCharacters', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'moderation/inactive-characters',
    handler: getInactiveCharacters
});

app.http('getCharactersToInactivate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'moderation/characters-to-inactivate',
    handler: getCharactersToInactivate
});

// Count of characters pending inactivation (30+ days no posts)
export async function getCharactersToInactivateCount(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const pool = await getPool();

        // Get count of active characters with no posts in 30+ days
        const result = await pool.request().query(`
            SELECT COUNT(*) as count
            FROM Character c
            WHERE COALESCE(c.Status, CASE WHEN c.Is_Active = 1 THEN 'Active' ELSE 'Inactive' END) = 'Active'
              AND DATEDIFF(day, 
                    COALESCE((SELECT MAX(Created) FROM Post WHERE CharacterID = c.CharacterID), c.Created), 
                    GETDATE()
                  ) >= 30
        `);

        return { jsonBody: { count: result.recordset[0]?.count || 0 } };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('updateCharacterStatus', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'moderation/characters/{id}/status',
    handler: updateCharacterStatus
});

// Toggle showInDropdown for a character (user can enable/disable their inactive characters from header dropdown)
export async function toggleShowInDropdown(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.params.id;
    
    if (!characterId) {
        return { status: 400, body: "Character ID is required" };
    }

    try {
        const body = await request.json() as any;
        const { userId, showInDropdown } = body;

        if (!userId) {
            return { status: 400, body: "User ID is required" };
        }

        if (typeof showInDropdown !== 'boolean') {
            return { status: 400, body: "showInDropdown must be a boolean" };
        }

        const pool = await getPool();

        // Verify the character belongs to this user
        const ownerCheck = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT CharacterID, Status FROM Character WHERE CharacterID = @characterId AND UserID = @userId');
        
        if (ownerCheck.recordset.length === 0) {
            return { status: 403, body: "You can only modify your own characters" };
        }

        // Update the showInDropdown field
        await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .input('showInDropdown', sql.Bit, showInDropdown ? 1 : 0)
            .query(`
                UPDATE Character 
                SET ShowInDropdown = @showInDropdown,
                    Modified = GETDATE()
                WHERE CharacterID = @characterId
            `);

        return { 
            status: 200, 
            jsonBody: { success: true, showInDropdown } 
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('toggleShowInDropdown', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'characters/{id}/show-in-dropdown',
    handler: toggleShowInDropdown
});

app.http('bulkInactivateCharacters', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'moderation/characters/bulk-inactivate',
    handler: bulkInactivateCharacters
});

app.http('getCharactersToInactivateCount', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'moderation/characters-to-inactivate/count',
    handler: getCharactersToInactivateCount
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

app.http('getThreadSummaries', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'characters/{id}/thread-summaries',
    handler: getThreadSummaries
});

app.http('updateThreadSummary', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'characters/{id}/thread-summaries/{threadId}',
    handler: updateThreadSummary
});

app.http('moderatorUpdateCharacter', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'characters/{id}/moderator-edit',
    handler: moderatorUpdateCharacter
});
