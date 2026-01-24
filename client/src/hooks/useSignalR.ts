import { useState, useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import type { Message } from '../types';

export interface AdminCountUpdate {
    type: 'skillPoints' | 'achievements' | 'plotNews' | 'staffPings' | 'all';
    count?: number;
    counts?: {
        skillPoints: number;
        achievements: number;
        plotNews: number;
        staffPings: number;
    };
}

interface SignalRHookReturn {
    connection: signalR.HubConnection | null;
    isConnected: boolean;
    joinCharacterGroup: (characterId: number) => Promise<void>;
    leaveCharacterGroup: (characterId: number) => Promise<void>;
    joinStaffGroup: () => Promise<void>;
    leaveStaffGroup: () => Promise<void>;
}

interface UseSignalROptions {
    userId: string | number | undefined;
    onNewMessage?: (message: Message) => void;
    onNewConversation?: (data: NewConversationPayload) => void;
    onUnreadCountUpdate?: (data: { characterId: number; unreadCount: number }) => void;
    onAdminCountUpdate?: (data: AdminCountUpdate) => void;
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
    onUnreadCountUpdate,
    onAdminCountUpdate
}: UseSignalROptions): SignalRHookReturn {
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const currentGroupsRef = useRef<Set<number>>(new Set());
    const isInStaffGroupRef = useRef(false);
    const callbacksRef = useRef({ onNewMessage, onNewConversation, onUnreadCountUpdate, onAdminCountUpdate });

    // Keep callbacks ref updated
    useEffect(() => {
        callbacksRef.current = { onNewMessage, onNewConversation, onUnreadCountUpdate, onAdminCountUpdate };
    }, [onNewMessage, onNewConversation, onUnreadCountUpdate, onAdminCountUpdate]);

    // Build and manage connection
    useEffect(() => {
        if (!userId) return;
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl('/api', {
                headers: { 'x-user-id': String(userId) }
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
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
            callbacksRef.current.onNewMessage?.(message);
        });

        newConnection.on('newConversation', (data: NewConversationPayload) => {
            callbacksRef.current.onNewConversation?.(data);
        });

        newConnection.on('unreadCountUpdate', (data: { characterId: number; unreadCount: number }) => {
            callbacksRef.current.onUnreadCountUpdate?.(data);
        });

        newConnection.on('adminCountUpdate', (data: AdminCountUpdate) => {
            callbacksRef.current.onAdminCountUpdate?.(data);
        });

        // Connection lifecycle handlers
        newConnection.onreconnecting(() => {
            setIsConnected(false);
        });

        newConnection.onreconnected(() => {
            setIsConnected(true);
            // Rejoin all groups after reconnection
            currentGroupsRef.current.forEach(characterId => {
                fetch('/api/signalr/join-group', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterId, userId: String(userId) })
                }).catch(() => {});
            });
            // Rejoin staff group if was previously joined
            if (isInStaffGroupRef.current) {
                fetch('/api/signalr/join-staff-group', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: String(userId) })
                }).catch(() => {});
            }
        });

        newConnection.onclose(() => {
            setIsConnected(false);
        });

        // Start connection
        newConnection.start()
            .then(() => {
                setIsConnected(true);
            })
            .catch(() => {});

        return () => {
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
            }
        } catch {
            // Silently fail
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
            }
        } catch {
            // Silently fail
        }
    }, [userId]);

    const joinStaffGroup = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await fetch('/api/signalr/join-staff-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: String(userId) })
            });

            if (response.ok) {
                isInStaffGroupRef.current = true;
            }
        } catch {
            // Silently fail
        }
    }, [userId]);

    const leaveStaffGroup = useCallback(async () => {
        if (!userId) return;

        try {
            const response = await fetch('/api/signalr/leave-staff-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: String(userId) })
            });

            if (response.ok) {
                isInStaffGroupRef.current = false;
            }
        } catch {
            // Silently fail
        }
    }, [userId]);

    return {
        connection,
        isConnected,
        joinCharacterGroup,
        leaveCharacterGroup,
        joinStaffGroup,
        leaveStaffGroup
    };
}
