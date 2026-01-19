import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../db";
import * as sql from 'mssql';

// GET /api/conversations?characterId={id} - Get all conversations for a character
export async function getConversations(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const characterId = request.query.get('characterId');

    if (!characterId) {
        return { status: 400, body: "characterId is required" };
    }

    try {
        const pool = await getPool();

        const query = `
            SELECT
                c.ConversationID as conversationId,
                c.FromCharacterID as fromCharacterId,
                c.ToCharacterID as toCharacterId,
                c.FromCharacterLastSeen as fromCharacterLastSeen,
                c.ToCharacterLastSeen as toCharacterLastSeen,
                c.Created as created,
                c.Archived as archived,
                fromChar.CharacterName as fromCharacterName,
                fromChar.AvatarImage as fromCharacterImageUrl,
                toChar.CharacterName as toCharacterName,
                toChar.AvatarImage as toCharacterImageUrl,
                lastMsg.Body as lastMessage,
                lastMsg.Created as lastMessageCreated,
                (
                    SELECT COUNT(*)
                    FROM Message m
                    WHERE m.ConversationID = c.ConversationID
                    AND m.CharacterID != @characterId
                    AND m.Created > CASE
                        WHEN c.FromCharacterID = @characterId THEN c.FromCharacterLastSeen
                        ELSE c.ToCharacterLastSeen
                    END
                ) as unreadCount
            FROM Conversation c
            LEFT JOIN Character fromChar ON c.FromCharacterID = fromChar.CharacterID
            LEFT JOIN Character toChar ON c.ToCharacterID = toChar.CharacterID
            OUTER APPLY (
                SELECT TOP 1 Body, Created
                FROM Message
                WHERE ConversationID = c.ConversationID
                ORDER BY Created DESC
            ) lastMsg
            WHERE (c.FromCharacterID = @characterId OR c.ToCharacterID = @characterId)
            AND c.Archived = 0
            ORDER BY lastMsg.Created DESC
        `;

        const result = await pool.request()
            .input('characterId', sql.Int, parseInt(characterId))
            .query(query);

        return {
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// GET /api/conversations/{conversationId}/messages - Get all messages in a conversation
export async function getMessages(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const conversationId = request.params.conversationId;

    if (!conversationId) {
        return { status: 400, body: "conversationId is required" };
    }

    try {
        const pool = await getPool();

        const query = `
            SELECT
                m.MessageID as messageId,
                m.ConversationID as conversationId,
                m.CharacterID as characterId,
                m.Body as body,
                m.Created as created,
                c.CharacterName as characterName,
                c.AvatarImage as characterImageUrl
            FROM Message m
            LEFT JOIN Character c ON m.CharacterID = c.CharacterID
            WHERE m.ConversationID = @conversationId
            ORDER BY m.Created ASC
        `;

        const result = await pool.request()
            .input('conversationId', sql.Int, parseInt(conversationId))
            .query(query);

        return {
            jsonBody: result.recordset
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// POST /api/conversations - Create a new conversation
export async function createConversation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as any;
        const { fromCharacterId, toCharacterId, initialMessage } = body;

        if (!fromCharacterId || !toCharacterId || !initialMessage) {
            return { status: 400, body: "fromCharacterId, toCharacterId, and initialMessage are required" };
        }

        // Ensure fromCharacterId and toCharacterId are different
        if (fromCharacterId === toCharacterId) {
            return { status: 400, body: "Cannot create conversation with yourself" };
        }

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // Check if conversation already exists between these two characters
            const checkQuery = `
                SELECT ConversationID as conversationId
                FROM Conversation
                WHERE (FromCharacterID = @fromCharacterId AND ToCharacterID = @toCharacterId)
                   OR (FromCharacterID = @toCharacterId AND ToCharacterID = @fromCharacterId)
            `;

            const checkResult = await transaction.request()
                .input('fromCharacterId', sql.Int, parseInt(fromCharacterId))
                .input('toCharacterId', sql.Int, parseInt(toCharacterId))
                .query(checkQuery);

            let conversationId;

            if (checkResult.recordset.length > 0) {
                // Conversation exists, use it
                conversationId = checkResult.recordset[0].conversationId;
            } else {
                // Create new conversation
                const insertConversationQuery = `
                    INSERT INTO Conversation (FromCharacterID, ToCharacterID, Created, Archived)
                    OUTPUT INSERTED.ConversationID
                    VALUES (@fromCharacterId, @toCharacterId, GETDATE(), 0)
                `;

                const conversationResult = await transaction.request()
                    .input('fromCharacterId', sql.Int, parseInt(fromCharacterId))
                    .input('toCharacterId', sql.Int, parseInt(toCharacterId))
                    .query(insertConversationQuery);

                conversationId = conversationResult.recordset[0].ConversationID;
            }

            // Insert the initial message
            const insertMessageQuery = `
                INSERT INTO Message (ConversationID, CharacterID, Body, Created)
                OUTPUT INSERTED.MessageID
                VALUES (@conversationId, @characterId, @body, GETDATE())
            `;

            const messageResult = await transaction.request()
                .input('conversationId', sql.Int, conversationId)
                .input('characterId', sql.Int, parseInt(fromCharacterId))
                .input('body', sql.NVarChar(sql.MAX), initialMessage)
                .query(insertMessageQuery);

            await transaction.commit();

            return {
                jsonBody: {
                    conversationId: conversationId,
                    messageId: messageResult.recordset[0].MessageID
                }
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// POST /api/conversations/{conversationId}/messages - Send a new message
export async function sendMessage(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const conversationId = request.params.conversationId;
        const body = await request.json() as any;
        const { characterId, message } = body;

        if (!conversationId || !characterId || !message) {
            return { status: 400, body: "conversationId, characterId, and message are required" };
        }

        const pool = await getPool();

        // Verify the character is part of this conversation
        const verifyQuery = `
            SELECT FromCharacterID, ToCharacterID
            FROM Conversation
            WHERE ConversationID = @conversationId
        `;

        const verifyResult = await pool.request()
            .input('conversationId', sql.Int, parseInt(conversationId))
            .query(verifyQuery);

        if (verifyResult.recordset.length === 0) {
            return { status: 404, body: "Conversation not found" };
        }

        const conversation = verifyResult.recordset[0];
        const charId = parseInt(characterId);

        if (conversation.FromCharacterID !== charId && conversation.ToCharacterID !== charId) {
            return { status: 403, body: "Character is not part of this conversation" };
        }

        // Insert the message
        const insertQuery = `
            INSERT INTO Message (ConversationID, CharacterID, Body, Created)
            OUTPUT INSERTED.MessageID, INSERTED.Created
            VALUES (@conversationId, @characterId, @body, GETDATE())
        `;

        const result = await pool.request()
            .input('conversationId', sql.Int, parseInt(conversationId))
            .input('characterId', sql.Int, charId)
            .input('body', sql.NVarChar(sql.MAX), message)
            .query(insertQuery);

        return {
            jsonBody: {
                messageId: result.recordset[0].MessageID,
                created: result.recordset[0].Created
            }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// PUT /api/conversations/{conversationId}/mark-read - Mark conversation as read
export async function markConversationRead(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const conversationId = request.params.conversationId;
        const body = await request.json() as any;
        const { characterId } = body;

        if (!conversationId || !characterId) {
            return { status: 400, body: "conversationId and characterId are required" };
        }

        const pool = await getPool();

        // Update the appropriate LastSeen timestamp
        const updateQuery = `
            UPDATE Conversation
            SET FromCharacterLastSeen = CASE WHEN FromCharacterID = @characterId THEN GETDATE() ELSE FromCharacterLastSeen END,
                ToCharacterLastSeen = CASE WHEN ToCharacterID = @characterId THEN GETDATE() ELSE ToCharacterLastSeen END
            WHERE ConversationID = @conversationId
            AND (FromCharacterID = @characterId OR ToCharacterID = @characterId)
        `;

        await pool.request()
            .input('conversationId', sql.Int, parseInt(conversationId))
            .input('characterId', sql.Int, parseInt(characterId))
            .query(updateQuery);

        return {
            jsonBody: { success: true }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// GET /api/conversations/unread-counts?userId={id} - Get unread message counts for all characters belonging to a user
export async function getUnreadCountsByCharacter(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const userId = request.query.get('userId');

    if (!userId) {
        return { status: 400, body: "userId is required" };
    }

    try {
        const pool = await getPool();

        // Get all characters for this user
        const charactersResult = await pool.request()
            .input('userId', sql.Int, parseInt(userId))
            .query('SELECT CharacterID FROM Character WHERE UserID = @userId');

        const unreadByCharacter: Record<number, number> = {};

        // For each character, count their unread messages using the same logic as getConversations
        for (const row of charactersResult.recordset) {
            const characterId = row.CharacterID;
            
            const countResult = await pool.request()
                .input('characterId', sql.Int, characterId)
                .query(`
                    SELECT ISNULL(SUM(unreadCount), 0) as totalUnread
                    FROM (
                        SELECT
                            (
                                SELECT COUNT(*)
                                FROM Message m
                                WHERE m.ConversationID = c.ConversationID
                                AND m.CharacterID != @characterId
                                AND m.Created > CASE
                                    WHEN c.FromCharacterID = @characterId THEN c.FromCharacterLastSeen
                                    ELSE c.ToCharacterLastSeen
                                END
                            ) as unreadCount
                        FROM Conversation c
                        WHERE (c.FromCharacterID = @characterId OR c.ToCharacterID = @characterId)
                        AND c.Archived = 0
                    ) counts
                `);

            const totalUnread = countResult.recordset[0]?.totalUnread || 0;
            if (totalUnread > 0) {
                unreadByCharacter[characterId] = totalUnread;
            }
        }

        return {
            jsonBody: { unreadByCharacter }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

app.http('getConversations', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'conversations',
    handler: getConversations
});

app.http('getUnreadCountsByCharacter', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'conversations/unread-counts',
    handler: getUnreadCountsByCharacter
});

app.http('getMessages', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'conversations/{conversationId}/messages',
    handler: getMessages
});

app.http('createConversation', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'conversations',
    handler: createConversation
});

app.http('sendMessage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'conversations/{conversationId}/messages',
    handler: sendMessage
});

app.http('markConversationRead', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'conversations/{conversationId}/mark-read',
    handler: markConversationRead
});
