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
            .input('Is_Active', sql.Bit, 1)
            .query(`
                INSERT INTO [User] (Username, Email, PasswordHash, Auth_Provider, Created, Is_Active)
                OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider
                VALUES (@Username, @Email, @PasswordHash, @Auth_Provider, @Created, @Is_Active)
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

        const token = generateToken(user);
        
        // Remove sensitive data
        delete user.PasswordHash;

        return {
            status: 200,
            jsonBody: { user, token }
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
                .input('Is_Active', sql.Bit, 1)
                .query(`
                    INSERT INTO [User] (Username, Email, Auth_Provider, Created, Is_Active)
                    OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Auth_Provider
                    VALUES (@Username, @Email, @Auth_Provider, @Created, @Is_Active)
                `);
            user = insertResult.recordset[0];
        } else {
            // Update auth provider if it was null or different? 
            // For now, let's just respect the existing user.
            // Maybe update Last_Login_IP if we had it.
        }

        const token = generateToken(user);
        if (user.PasswordHash) delete user.PasswordHash;

        return {
            status: 200,
            jsonBody: { user, token }
        };

    } catch (error) {
        context.error(error);
        return { status: 500, body: "Internal Server Error: " + error };
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
