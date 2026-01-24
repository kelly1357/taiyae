import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useSignalR } from '../hooks/useSignalR';
import type { NewConversationPayload } from '../hooks/useSignalR';
import type { Message, User, Character } from '../types';

interface SignalRContextValue {
    isConnected: boolean;
    joinCharacterGroup: (characterId: number) => Promise<void>;
    leaveCharacterGroup: (characterId: number) => Promise<void>;
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

    const {
        isConnected,
        joinCharacterGroup,
        leaveCharacterGroup
    } = useSignalR({
        userId: user?.id,
        onNewMessage: handleNewMessage,
        onNewConversation: handleNewConversation,
        onUnreadCountUpdate: handleUnreadCountUpdate
    });

    // Join groups for all user's characters when connected
    useEffect(() => {
        if (!isConnected || !userCharacters.length) return;

        // Join groups for all characters owned by this user
        userCharacters.forEach(char => {
            joinCharacterGroup(Number(char.id));
        });
    }, [isConnected, userCharacters, joinCharacterGroup]);

    return (
        <SignalRContext.Provider value={{ isConnected, joinCharacterGroup, leaveCharacterGroup }}>
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
