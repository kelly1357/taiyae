import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getPool } from "../db";
import * as sql from 'mssql';

const JWT_SECRET = process.env.JWT_SECRET || 'taiyae-secure-random-key-1234567890';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Helper to generate JWT
function generateToken(user: any) {
    return jwt.sign({ 
        id: user.UserID, 
        username: user.Username, 
        email: user.Email 
    }, JWT_SECRET, { expiresIn: '24h' });
}

export async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { username, email, password } = body;

        if (!username || !email || !password) {
            return { status: 400, body: "Missing required fields" };
        }

        const pool = await getPool();
        
        // Check if user exists
        const check = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT UserID FROM [User] WHERE Email = @Email');
        
        if (check.recordset.length > 0) {
            return { status: 409, body: "User already exists" };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.VarChar, hashedPassword)
            .input('Auth_Provider', sql.NVarChar, 'email')
            .input('Created', sql.DateTime, new Date())
            .query(`
                INSERT INTO [User] (Username, Email, PasswordHash, Auth_Provider, Created)
                OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.UserStatusID
                VALUES (@Username, @Email, @PasswordHash, @Auth_Provider, @Created)
            `);

        const user = result.recordset[0];
        const token = generateToken(user);

        return {
            status: 201,
            jsonBody: { user, token }
        };
    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error" };
    }
}

export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return { status: 400, body: "Missing email or password" };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM [User] WHERE Email = @Email');

        const user = result.recordset[0];

        if (!user || !user.PasswordHash) {
            return { status: 401, body: "Invalid credentials" };
        }

        const isValid = await bcrypt.compare(password, user.PasswordHash);

        if (!isValid) {
            return { status: 401, body: "Invalid credentials" };
        }

        // Check if user is banned
        if (user.UserStatusID === 3) {
            return {
                status: 403,
                jsonBody: {
                    error: 'banned',
                    message: 'Your account has been banned. Please contact staff if you believe this is an error.'
                }
            };
        }

        const token = generateToken(user);

        // Remove sensitive data
        delete user.PasswordHash;

        // Add isModerator and isAdmin fields based on database columns
        const isModerator = user.Is_Moderator === true || user.Is_Moderator === 1;
        const isAdmin = user.Is_Admin === true || user.Is_Admin === 1;
        // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
        const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
        const userStatus = statusMap[user.UserStatusID] || 'Joining';
        const userWithRole = { ...user, isModerator, isAdmin, role: isModerator ? 'moderator' : 'member', userStatus, userStatusId: user.UserStatusID };

        return {
            status: 200,
            jsonBody: { user: userWithRole, token }
        };
    } catch (error) {
        context.error("Login error:", error);
        return { status: 500, body: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) };
    }
}

export async function googleLogin(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { credential } = body; // Google ID token

        // Reload env var in case of hot reload issues, though usually process restart is needed
        const currentClientId = process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID;

        if (!currentClientId) {
             context.error("Google Client ID is missing in environment variables.");
             return { status: 500, body: "Google Client ID not configured on server." };
        }

        const client = new OAuth2Client(currentClientId);
        
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: currentClientId,
            });
        } catch (verifyError) {
            context.error(`Google Token Verification Failed. Configured Client ID: ${currentClientId}. Error:`, verifyError);
            return { status: 401, body: `Token verification failed: ${verifyError.message}` };
        }

        const payload = ticket.getPayload();

        if (!payload) {
            return { status: 401, body: "Invalid Google Token" };
        }

        const email = payload.email;
        const name = payload.name || email?.split('@')[0];
        
        if (!email) {
             return { status: 400, body: "Email not found in token" };
        }

        const pool = await getPool();
        
        // Check if user exists
        let result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query('SELECT * FROM [User] WHERE Email = @Email');

        let user = result.recordset[0];

        if (!user) {
            // Create new user
            const insertResult = await pool.request()
                .input('Username', sql.NVarChar, name)
                .input('Email', sql.NVarChar, email)
                .input('Auth_Provider', sql.NVarChar, 'google')
                .input('Created', sql.DateTime, new Date())
                .query(`
                    INSERT INTO [User] (Username, Email, Auth_Provider, Created)
                    OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.UserStatusID
                    VALUES (@Username, @Email, @Auth_Provider, @Created)
                `);
            user = insertResult.recordset[0];
        } else {
            // Check if existing user is banned
            if (user.UserStatusID === 3) {
                return {
                    status: 403,
                    jsonBody: {
                        error: 'banned',
                        message: 'Your account has been banned. Please contact staff if you believe this is an error.'
                    }
                };
            }
        }

        const token = generateToken(user);
        if (user.PasswordHash) delete user.PasswordHash;

        // Add isModerator and isAdmin fields based on database columns
        const isModerator = user.Is_Moderator === true || user.Is_Moderator === 1;
        const isAdmin = user.Is_Admin === true || user.Is_Admin === 1;
        // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
        const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
        const userStatus = statusMap[user.UserStatusID] || 'Joining';
        const userWithRole = { ...user, isModerator, isAdmin, role: isModerator ? 'moderator' : 'member', userStatus, userStatusId: user.UserStatusID };

        return {
            status: 200,
            jsonBody: { user: userWithRole, token }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error };
    }
}

export async function updateUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const id = request.params.id;
        const body: any = await request.json();
        const { username, currentPassword, newPassword, playerInfo, facebook, instagram, discord, imageUrl } = body;

        if (!id) {
            return { status: 400, jsonBody: { body: "User ID is required" } };
        }

        // Verify token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
             return { status: 401, jsonBody: { body: "Unauthorized" } };
        }
        const tokenStr = authHeader.split(' ')[1];
        try {
            const decoded: any = jwt.verify(tokenStr, JWT_SECRET);
            if (String(decoded.id) !== String(id)) {
                return { status: 403, jsonBody: { body: "Forbidden" } };
            }
        } catch (e) {
            return { status: 401, jsonBody: { body: "Invalid token" } };
        }

        const pool = await getPool();
        
        // Get current user
        const userResult = await pool.request()
            .input('UserID', sql.Int, id)
            .query('SELECT * FROM [User] WHERE UserID = @UserID');
            
        const user = userResult.recordset[0];
        
        if (!user) {
            return { status: 404, jsonBody: { body: "User not found" } };
        }

        const updates = [];
        const requestObj = pool.request().input('UserID', sql.Int, id);

        // Update Username
        if (username && username !== user.Username) {
            // Check if username is taken
            const check = await pool.request()
                .input('Username', sql.NVarChar, username)
                .input('CurrentUserID', sql.Int, id)
                .query('SELECT UserID FROM [User] WHERE Username = @Username AND UserID != @CurrentUserID');
            
            if (check.recordset.length > 0) {
                return { status: 409, jsonBody: { body: "Username already taken" } };
            }

            requestObj.input('Username', sql.NVarChar, username);
            updates.push("Username = @Username");
        }

        // Update ImageURL (avatar)
        if (imageUrl !== undefined) {
            requestObj.input('ImageURL', sql.NVarChar, imageUrl);
            updates.push("ImageURL = @ImageURL");
        }

        // Update Player Info
        if (playerInfo !== undefined) {
            requestObj.input('Description', sql.NVarChar, playerInfo);
            updates.push("Description = @Description");
        }

        // Update Social Media
        if (facebook !== undefined) {
            requestObj.input('Facebook', sql.NVarChar, facebook);
            updates.push("Facebook = @Facebook");
        }
        if (instagram !== undefined) {
            requestObj.input('Instagram', sql.NVarChar, instagram);
            updates.push("Instagram = @Instagram");
        }
        if (discord !== undefined) {
            requestObj.input('Discord', sql.NVarChar, discord);
            updates.push("Discord = @Discord");
        }

        // Update Password
        if (newPassword) {
            if (user.Auth_Provider !== 'email') {
                return { status: 400, jsonBody: { body: "Cannot change password for external auth provider" } };
            }

            if (!currentPassword) {
                return { status: 400, jsonBody: { body: "Current password is required" } };
            }

            const isValid = await bcrypt.compare(currentPassword, user.PasswordHash);
            if (!isValid) {
                return { status: 401, jsonBody: { body: "Invalid current password" } };
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            requestObj.input('PasswordHash', sql.VarChar, hashedPassword);
            updates.push("PasswordHash = @PasswordHash");
        }

        if (updates.length === 0) {
            return { status: 200, jsonBody: { body: "No changes made" } };
        }

        const query = `
            UPDATE [User] 
            SET ${updates.join(', ')}
            OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.Description, INSERTED.Facebook, INSERTED.Instagram, INSERTED.Discord, INSERTED.ImageURL
            WHERE UserID = @UserID
        `;

        const result = await requestObj.query(query);
        const updatedUser = result.recordset[0];

        // Generate new token as username might have changed
        const newToken = generateToken(updatedUser);

        return {
            status: 200,
            jsonBody: { user: updatedUser, token: newToken }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, jsonBody: { body: "Internal Server Error: " + (error instanceof Error ? error.message : String(error)) } };
    }
}

app.http('register', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: register
});

app.http('login', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: login
});

app.http('auth-google', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: googleLogin
});

app.http('updateUser', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'users/{id}',
    handler: updateUser
});
