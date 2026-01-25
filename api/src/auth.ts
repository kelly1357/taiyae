import { HttpRequest, HttpResponseInit } from "@azure/functions";
import { getPool } from "./db";
import * as sql from 'mssql';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taiyae-secure-random-key-1234567890';

export interface AuthResult {
    authorized: boolean;
    error?: HttpResponseInit;
    userId?: number;
    isAdmin?: boolean;
    isModerator?: boolean;
}

/**
 * Verifies JWT token and returns user info.
 * Does NOT check for staff privileges - use verifyStaffAuth for that.
 */
export async function verifyAuth(request: HttpRequest): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
            authorized: false,
            error: { status: 401, jsonBody: { error: 'Unauthorized - No token provided' } }
        };
    }

    const tokenStr = authHeader.split(' ')[1];
    let decoded: any;
    try {
        decoded = jwt.verify(tokenStr, JWT_SECRET);
    } catch (e: any) {
        return {
            authorized: false,
            error: { status: 401, jsonBody: { error: 'Unauthorized - Invalid token' } }
        };
    }

    // Fetch user info
    const pool = await getPool();
    const result = await pool.request()
        .input('userId', sql.Int, decoded.id)
        .query('SELECT Is_Admin, Is_Moderator, UserStatusID FROM [User] WHERE UserID = @userId');

    if (result.recordset.length === 0) {
        return {
            authorized: false,
            error: { status: 401, jsonBody: { error: 'Unauthorized - User not found' } }
        };
    }

    const user = result.recordset[0];

    // Check if user is banned
    if (user.UserStatusID === 3) {
        return {
            authorized: false,
            error: { status: 403, jsonBody: { error: 'Forbidden - Account is banned' } }
        };
    }

    return {
        authorized: true,
        userId: decoded.id,
        isAdmin: user.Is_Admin === true || user.Is_Admin === 1,
        isModerator: user.Is_Moderator === true || user.Is_Moderator === 1
    };
}

/**
 * Verifies JWT token AND checks that user is admin or moderator.
 * Returns 403 if user is not staff.
 */
export async function verifyStaffAuth(request: HttpRequest): Promise<AuthResult> {
    const auth = await verifyAuth(request);

    if (!auth.authorized) {
        return auth;
    }

    // Check if user has staff privileges
    if (!auth.isAdmin && !auth.isModerator) {
        return {
            authorized: false,
            error: { status: 403, jsonBody: { error: 'Forbidden - Staff access required' } }
        };
    }

    return auth;
}

/**
 * Verifies JWT token AND checks that user is admin.
 * Returns 403 if user is not admin.
 */
export async function verifyAdminAuth(request: HttpRequest): Promise<AuthResult> {
    const auth = await verifyAuth(request);

    if (!auth.authorized) {
        return auth;
    }

    // Check if user is admin
    if (!auth.isAdmin) {
        return {
            authorized: false,
            error: { status: 403, jsonBody: { error: 'Forbidden - Admin access required' } }
        };
    }

    return auth;
}

/**
 * Verifies that the authenticated user owns a specific character.
 * Useful for operations that should only be performed on your own characters.
 */
export async function verifyCharacterOwnership(request: HttpRequest, characterId: number): Promise<AuthResult> {
    const auth = await verifyAuth(request);

    if (!auth.authorized) {
        return auth;
    }

    const pool = await getPool();
    const result = await pool.request()
        .input('characterId', sql.Int, characterId)
        .input('userId', sql.Int, auth.userId)
        .query('SELECT CharacterID FROM Character WHERE CharacterID = @characterId AND UserID = @userId');

    if (result.recordset.length === 0) {
        return {
            authorized: false,
            error: { status: 403, jsonBody: { error: 'Forbidden - You do not own this character' } }
        };
    }

    return auth;
}

/**
 * Verifies ownership OR staff access (staff can act on any character).
 */
export async function verifyCharacterOwnershipOrStaff(request: HttpRequest, characterId: number): Promise<AuthResult> {
    const auth = await verifyAuth(request);

    if (!auth.authorized) {
        return auth;
    }

    // Staff can access any character
    if (auth.isAdmin || auth.isModerator) {
        return auth;
    }

    // Check ownership for non-staff
    const pool = await getPool();
    const result = await pool.request()
        .input('characterId', sql.Int, characterId)
        .input('userId', sql.Int, auth.userId)
        .query('SELECT CharacterID FROM Character WHERE CharacterID = @characterId AND UserID = @userId');

    if (result.recordset.length === 0) {
        return {
            authorized: false,
            error: { status: 403, jsonBody: { error: 'Forbidden - You do not own this character' } }
        };
    }

    return auth;
}
