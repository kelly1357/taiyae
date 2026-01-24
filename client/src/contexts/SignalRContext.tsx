import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import type { NewConversationPayload, AdminCountUpdate } from '../hooks/useSignalR';
import type { Message, User, Character } from '../types';

interface SignalRContextValue {
    isConnected: boolean;
    joinCharacterGroup: (characterId: number) => Promise<void>;
    leaveCharacterGroup: (characterId: number) => Promise<void>;
    joinStaffGroup: () => Promise<void>;
    leaveStaffGroup: () => Promise<void>;
}

const SignalRContext = createContext<SignalRContextValue | null>(null);

interface SignalRProviderProps {
    children: React.ReactNode;
    user: User | null;
    userCharacters: Character[];
}

export function SignalRProvider({
    children,
    user,
    userCharacters
}: SignalRProviderProps) {
    const isStaff = user?.isModerator || user?.isAdmin;

    // Handlers that dispatch custom events for components to listen to
    const handleNewMessage = useCallback((message: Message) => {
        window.dispatchEvent(new CustomEvent('signalr:newMessage', { detail: message }));
    }, []);

    const handleNewConversation = useCallback((data: NewConversationPayload) => {
        window.dispatchEvent(new CustomEvent('signalr:newConversation', { detail: data }));
    }, []);

    const handleUnreadCountUpdate = useCallback((data: { characterId: number; unreadCount: number }) => {
        window.dispatchEvent(new CustomEvent('signalr:unreadCountUpdate', { detail: data }));
    }, []);

    const handleAdminCountUpdate = useCallback((data: AdminCountUpdate) => {
        window.dispatchEvent(new CustomEvent('signalr:adminCountUpdate', { detail: data }));
    }, []);

    const {
        isConnected,
        joinCharacterGroup,
        leaveCharacterGroup,
        joinStaffGroup,
        leaveStaffGroup
    } = useSignalR({
        userId: user?.id,
        onNewMessage: handleNewMessage,
        onNewConversation: handleNewConversation,
        onUnreadCountUpdate: handleUnreadCountUpdate,
        onAdminCountUpdate: handleAdminCountUpdate
    });

    // Join groups for all user's characters when connected
    useEffect(() => {
        if (!isConnected || !userCharacters.length) return;

        userCharacters.forEach(char => {
            joinCharacterGroup(Number(char.id));
        });
    }, [isConnected, userCharacters, joinCharacterGroup]);

    // Join staff group when connected if user is admin/moderator
    useEffect(() => {
        if (!isConnected || !isStaff) return;

        joinStaffGroup();
    }, [isConnected, isStaff, joinStaffGroup]);

    return (
        <SignalRContext.Provider value={{ isConnected, joinCharacterGroup, leaveCharacterGroup, joinStaffGroup, leaveStaffGroup }}>
            {children}
        </SignalRContext.Provider>
    );
}

export function useSignalRContext() {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalRContext must be used within a SignalRProvider');
    }
    return context;
}
