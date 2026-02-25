import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getPool } from "../db";
import * as sql from 'mssql';
import { sendConfirmationEmail, sendPasswordResetEmail } from '../email';

const JWT_SECRET = process.env.JWT_SECRET || 'taiyae-secure-random-key-1234567890';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Helper to generate JWT
function generateToken(user: any) {
    return jwt.sign({ 
        id: user.UserID, 
        username: user.Username, 
        email: user.Email 
    }, JWT_SECRET, { expiresIn: '7d' });
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
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const result = await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Email', sql.NVarChar, email)
            .input('PasswordHash', sql.VarChar, hashedPassword)
            .input('Auth_Provider', sql.NVarChar, 'email')
            .input('Created', sql.DateTime, new Date())
            .input('Email_Verified', sql.Bit, 0)
            .input('Verification_Token', sql.VarChar, verificationToken)
            .input('Verification_Token_Expiry', sql.DateTime, tokenExpiry)
            .query(`
                INSERT INTO [User] (Username, Email, PasswordHash, Auth_Provider, Created, Email_Verified, Verification_Token, Verification_Token_Expiry)
                OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.UserStatusID
                VALUES (@Username, @Email, @PasswordHash, @Auth_Provider, @Created, @Email_Verified, @Verification_Token, @Verification_Token_Expiry)
            `);

        // Send verification email
        try {
            await sendConfirmationEmail(email, verificationToken);
        } catch (emailError) {
            context.error('Failed to send verification email:', emailError);
            // User was created but email failed — they can use resend
        }

        return {
            status: 201,
            jsonBody: { message: 'Account created! Please check your email to verify your account.', needsVerification: true }
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

        // Check if email is verified (only for email auth users)
        if (user.Auth_Provider === 'email' && !user.Email_Verified) {
            return {
                status: 403,
                jsonBody: {
                    error: 'email_not_verified',
                    message: 'Please verify your email before logging in. Check your inbox for a verification link.',
                    needsConfirmation: true,
                    email: user.Email
                }
            };
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
        const isAbsent = user.Is_Absent === true || user.Is_Absent === 1;
        // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
        const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
        const userStatus = statusMap[user.UserStatusID] || 'Joining';
        const userWithRole = { ...user, isModerator, isAdmin, isAbsent, absenceNote: user.Absence_Note || null, role: isModerator ? 'moderator' : 'member', userStatus, userStatusId: user.UserStatusID };

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
            // Create new user (Google users are auto-verified)
            const insertResult = await pool.request()
                .input('Username', sql.NVarChar, name)
                .input('Email', sql.NVarChar, email)
                .input('Auth_Provider', sql.NVarChar, 'google')
                .input('Created', sql.DateTime, new Date())
                .input('Email_Verified', sql.Bit, 1)
                .query(`
                    INSERT INTO [User] (Username, Email, Auth_Provider, Created, Email_Verified)
                    OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.UserStatusID
                    VALUES (@Username, @Email, @Auth_Provider, @Created, @Email_Verified)
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
        const isAbsent = user.Is_Absent === true || user.Is_Absent === 1;
        // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
        const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
        const userStatus = statusMap[user.UserStatusID] || 'Joining';
        const userWithRole = { ...user, isModerator, isAdmin, isAbsent, absenceNote: user.Absence_Note || null, role: isModerator ? 'moderator' : 'member', userStatus, userStatusId: user.UserStatusID };

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
        const { username, currentPassword, newPassword, playerInfo, facebook, instagram, discord, imageUrl, isAbsent, absenceNote } = body;

        if (!id) {
            return { status: 400, jsonBody: { body: "User ID is required" } };
        }

        // Verify token
        const authHeader = request.headers.get('X-Authorization');
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

        // Update Absence Status
        if (isAbsent !== undefined) {
            requestObj.input('Is_Absent', sql.Bit, isAbsent ? 1 : 0);
            updates.push("Is_Absent = @Is_Absent");
        }
        if (absenceNote !== undefined) {
            requestObj.input('Absence_Note', sql.NVarChar, absenceNote || null);
            updates.push("Absence_Note = @Absence_Note");
        }

        if (updates.length === 0) {
            return { status: 200, jsonBody: { body: "No changes made" } };
        }

        const query = `
            UPDATE [User] 
            SET ${updates.join(', ')}
            OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider, INSERTED.Description, INSERTED.Facebook, INSERTED.Instagram, INSERTED.Discord, INSERTED.ImageURL, INSERTED.Is_Absent, INSERTED.Absence_Note
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

// ─── Email Confirmation ───

export async function confirmEmail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const token = request.query.get('token');

        if (!token) {
            return { status: 400, jsonBody: { error: 'Missing verification token' } };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Token', sql.VarChar, token)
            .query(`
                SELECT UserID, Email, Email_Verified, Verification_Token_Expiry
                FROM [User]
                WHERE Verification_Token = @Token AND Auth_Provider = 'email'
            `);

        const user = result.recordset[0];

        if (!user) {
            return { status: 400, jsonBody: { error: 'Invalid or expired verification link.' } };
        }

        if (user.Email_Verified) {
            return { status: 200, jsonBody: { message: 'Your email is already verified. You can log in.' } };
        }

        if (user.Verification_Token_Expiry && new Date(user.Verification_Token_Expiry) < new Date()) {
            return { status: 400, jsonBody: { error: 'This verification link has expired. Please request a new one.', expired: true, email: user.Email } };
        }

        // Mark as verified and clear token
        await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .query(`
                UPDATE [User]
                SET Email_Verified = 1, Verification_Token = NULL, Verification_Token_Expiry = NULL
                WHERE UserID = @UserID
            `);

        return { status: 200, jsonBody: { message: 'Email verified successfully! You can now log in.' } };
    } catch (error) {
        context.error('Confirm email error:', error);
        return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
}

app.http('confirmEmail', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'confirm-email',
    handler: confirmEmail
});

// ─── Resend Confirmation Email ───

export async function resendConfirmation(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { email } = body;

        if (!email) {
            return { status: 400, jsonBody: { error: 'Email is required' } };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query(`
                SELECT UserID, Email_Verified, Auth_Provider
                FROM [User]
                WHERE Email = @Email
            `);

        const user = result.recordset[0];

        // Always return success to prevent user enumeration
        if (!user || user.Auth_Provider !== 'email' || user.Email_Verified) {
            return { status: 200, jsonBody: { message: 'If an unverified account exists with that email, a new verification link has been sent.' } };
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .input('Token', sql.VarChar, verificationToken)
            .input('Expiry', sql.DateTime, tokenExpiry)
            .query(`
                UPDATE [User]
                SET Verification_Token = @Token, Verification_Token_Expiry = @Expiry
                WHERE UserID = @UserID
            `);

        try {
            await sendConfirmationEmail(email, verificationToken);
        } catch (emailError) {
            context.error('Failed to resend verification email:', emailError);
            return { status: 500, jsonBody: { error: 'Failed to send verification email. Please try again later.' } };
        }

        return { status: 200, jsonBody: { message: 'If an unverified account exists with that email, a new verification link has been sent.' } };
    } catch (error) {
        context.error('Resend confirmation error:', error);
        return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
}

app.http('resendConfirmation', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'resend-confirmation',
    handler: resendConfirmation
});

// ─── Forgot Password ───

export async function forgotPassword(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { email } = body;

        if (!email) {
            return { status: 400, jsonBody: { error: 'Email is required' } };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Email', sql.NVarChar, email)
            .query(`
                SELECT UserID, Auth_Provider
                FROM [User]
                WHERE Email = @Email
            `);

        const user = result.recordset[0];

        // Always return success to prevent user enumeration
        // Only process for email auth users
        if (user && user.Auth_Provider === 'email') {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await pool.request()
                .input('UserID', sql.Int, user.UserID)
                .input('Token', sql.VarChar, resetToken)
                .input('Expiry', sql.DateTime, tokenExpiry)
                .query(`
                    UPDATE [User]
                    SET Reset_Token = @Token, Reset_Token_Expiry = @Expiry
                    WHERE UserID = @UserID
                `);

            try {
                await sendPasswordResetEmail(email, resetToken);
            } catch (emailError) {
                context.error('Failed to send password reset email:', emailError);
            }
        }

        return { status: 200, jsonBody: { message: 'If an account exists with that email, a password reset link has been sent.' } };
    } catch (error) {
        context.error('Forgot password error:', error);
        return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
}

app.http('forgotPassword', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'forgot-password',
    handler: forgotPassword
});

// ─── Reset Password ───

export async function resetPassword(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body: any = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return { status: 400, jsonBody: { error: 'Token and new password are required' } };
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return { status: 400, jsonBody: { error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' } };
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('Token', sql.VarChar, token)
            .query(`
                SELECT UserID, Reset_Token_Expiry, Auth_Provider
                FROM [User]
                WHERE Reset_Token = @Token AND Auth_Provider = 'email'
            `);

        const user = result.recordset[0];

        if (!user) {
            return { status: 400, jsonBody: { error: 'Invalid or expired reset link.' } };
        }

        if (user.Reset_Token_Expiry && new Date(user.Reset_Token_Expiry) < new Date()) {
            return { status: 400, jsonBody: { error: 'This reset link has expired. Please request a new one.' } };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.request()
            .input('UserID', sql.Int, user.UserID)
            .input('PasswordHash', sql.VarChar, hashedPassword)
            .query(`
                UPDATE [User]
                SET PasswordHash = @PasswordHash, Reset_Token = NULL, Reset_Token_Expiry = NULL
                WHERE UserID = @UserID
            `);

        return { status: 200, jsonBody: { message: 'Password has been reset successfully. You can now log in with your new password.' } };
    } catch (error) {
        context.error('Reset password error:', error);
        return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
}

app.http('resetPassword', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'reset-password',
    handler: resetPassword
});
