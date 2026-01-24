import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';

interface SignalRHookReturn {
    connection: signalR.HubConnection | null;
    isConnected: boolean;
    joinCharacterGroup: (characterId: number) => Promise<void>;
    leaveCharacterGroup: (characterId: number) => Promise<void>;
}

interface UseSignalROptions {
    userId: string | number | undefined;
    onNewMessage?: (message: Message) => void;
    onNewConversation?: (data: NewConversationPayload) => void;
    onUnreadCountUpdate?: (data: { characterId: number; unreadCount: number }) => void;
}

export interface NewConversationPayload {
    conversationId: number;
    fromCharacterId: number;
    toCharacterId: number;
    fromCharacterName?: string;
    fromCharacterImageUrl?: string;
    initialMessage: {
        messageId: number;
        body: string;
        created: string;
        characterId: number;
        characterName?: string;
        characterImageUrl?: string;
    };
}

export function useSignalR({
    userId,
    onNewMessage,
    onNewConversation,
    onUnreadCountUpdate
}: UseSignalROptions): SignalRHookReturn {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const currentGroupsRef = useRef<Set<number>>(new Set());
    const callbacksRef = useRef({ onNewMessage, onNewConversation, onUnreadCountUpdate });

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = { onNewMessage, onNewConversation, onUnreadCountUpdate };
    }, [onNewMessage, onNewConversation, onUnreadCountUpdate]);

    // Build and manage connection
    useEffect(() => {
        if (!userId) return;

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl('/api/negotiate', {
                headers: { 'x-user-id': String(userId) }
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    // Exponential backoff: 0s, 2s, 10s, 30s, then every 30s
                    if (retryContext.previousRetryCount < 4) {
                        return [0, 2000, 10000, 30000][retryContext.previousRetryCount];
                    }
                    return 30000;
                }
            })
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        setConnection(newConnection);

        // Set up event handlers
        newConnection.on('newMessage', (message: Message) => {
            console.log('[SignalR] Received new message:', message);
            callbacksRef.current.onNewMessage?.(message);
        });

        newConnection.on('newConversation', (data: NewConversationPayload) => {
            console.log('[SignalR] Received new conversation:', data);
            callbacksRef.current.onNewConversation?.(data);
        });

        newConnection.on('unreadCountUpdate', (data: { characterId: number; unreadCount: number }) => {
            console.log('[SignalR] Received unread count update:', data);
            callbacksRef.current.onUnreadCountUpdate?.(data);
        });

        // Connection lifecycle handlers
        newConnection.onreconnecting((error) => {
            console.log('[SignalR] Reconnecting...', error);
            setIsConnected(false);
        });

        newConnection.onreconnected((connectionId) => {
            console.log('[SignalR] Reconnected with id:', connectionId);
            setIsConnected(true);
            // Rejoin all groups after reconnection
            currentGroupsRef.current.forEach(characterId => {
                fetch('/api/signalr/join-group', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterId, userId: String(userId) })
                }).catch(err => console.error('[SignalR] Failed to rejoin group:', err));
            });
        });

        newConnection.onclose((error) => {
            console.log('[SignalR] Connection closed', error);
            setIsConnected(false);
        });

        // Start connection
        newConnection.start()
            .then(() => {
                console.log('[SignalR] Connected successfully');
                setIsConnected(true);
            })
            .catch(err => {
                console.error('[SignalR] Connection error:', err);
            });

        return () => {
            console.log('[SignalR] Stopping connection...');
            newConnection.stop();
        };
    }, [userId]);

    const joinCharacterGroup = useCallback(async (characterId: number) => {
        if (!userId) return;

        try {
            const response = await fetch('/api/signalr/join-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, userId: String(userId) })
            });

            if (response.ok) {
                currentGroupsRef.current.add(characterId);
                console.log(`[SignalR] Joined character group: ${characterId}`);
            } else {
                console.error('[SignalR] Failed to join group:', await response.text());
            }
        } catch (error) {
            console.error('[SignalR] Failed to join character group:', error);
        }
    }, [userId]);

    const leaveCharacterGroup = useCallback(async (characterId: number) => {
        if (!userId) return;

        try {
            const response = await fetch('/api/signalr/leave-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, userId: String(userId) })
            });

            if (response.ok) {
                currentGroupsRef.current.delete(characterId);
                console.log(`[SignalR] Left character group: ${characterId}`);
            }
        } catch (error) {
            console.error('[SignalR] Failed to leave character group:', error);
        }
    }, [userId]);

    return {
        connection,
        isConnected,
        joinCharacterGroup,
        leaveCharacterGroup
    };
}
