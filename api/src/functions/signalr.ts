import { app, HttpRequest, HttpResponseInit, InvocationContext, input, output } from "@azure/functions";

// SignalR connection input binding for negotiate
const signalRConnectionInput = input.generic({
    type: 'signalRConnectionInfo',
    name: 'connectionInfo',
    hubName: 'messaging',
    userId: '{headers.x-user-id}',
});

// SignalR output binding for group management
const signalRGroupOutput = output.generic({
    type: 'signalR',
    name: 'signalRGroupActions',
    hubName: 'messaging',
});

// POST /api/negotiate - Get SignalR connection info for client
export async function negotiate(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const connectionInfo = context.extraInputs.get(signalRConnectionInput);

        if (!connectionInfo) {
            context.error('Failed to get SignalR connection info');
            return { status: 500, body: "Failed to get SignalR connection info" };
        }

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(connectionInfo),
        };
    } catch (error) {
        context.error('Negotiate error:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// POST /api/signalr/join-group - Join a character group for receiving messages
export async function joinCharacterGroup(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { characterId: number; userId: string };
        const { characterId, userId } = body;

        if (!characterId || !userId) {
            return { status: 400, body: "characterId and userId are required" };
        }

        context.extraOutputs.set(signalRGroupOutput, [{
            userId: String(userId),
            groupName: `character-${characterId}`,
            action: 'add'
        }]);

        return {
            status: 200,
            jsonBody: { success: true, group: `character-${characterId}` }
        };
    } catch (error) {
        context.error('Join group error:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// POST /api/signalr/leave-group - Leave a character group
export async function leaveCharacterGroup(
    request: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as { characterId: number; userId: string };
        const { characterId, userId } = body;

        if (!characterId || !userId) {
            return { status: 400, body: "characterId and userId are required" };
        }

        context.extraOutputs.set(signalRGroupOutput, [{
            userId: String(userId),
            groupName: `character-${characterId}`,
            action: 'remove'
        }]);

        return {
            status: 200,
            jsonBody: { success: true, group: `character-${characterId}` }
        };
    } catch (error) {
        context.error('Leave group error:', error);
        return { status: 500, body: "Internal Server Error" };
    }
}

// Register HTTP triggers
app.http('negotiate', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'negotiate',
    extraInputs: [signalRConnectionInput],
    handler: negotiate
});

app.http('joinCharacterGroup', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'signalr/join-group',
    extraOutputs: [signalRGroupOutput],
    handler: joinCharacterGroup
});

app.http('leaveCharacterGroup', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'signalr/leave-group',
    extraOutputs: [signalRGroupOutput],
    handler: leaveCharacterGroup
});
