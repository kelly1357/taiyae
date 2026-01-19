import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext, useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { Conversation, Message, Character } from '../types';

interface LayoutContext {
  user: any;
  activeCharacter: Character | undefined;
}

const Conversations: React.FC = () => {
  const { user, activeCharacter } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedConversationId = searchParams.get('conversationId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // New conversation modal state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [initialMessage, setInitialMessage] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);

  const selectedConversation = conversations.find(
    c => c.conversationId === parseInt(selectedConversationId || '0')
  );

  const otherCharacter = selectedConversation
    ? selectedConversation.fromCharacterId === activeCharacter?.id
      ? {
          id: selectedConversation.toCharacterId,
          name: selectedConversation.toCharacterName,
          imageUrl: selectedConversation.toCharacterImageUrl,
        }
      : {
          id: selectedConversation.fromCharacterId,
          name: selectedConversation.fromCharacterName,
          imageUrl: selectedConversation.fromCharacterImageUrl,
        }
    : null;

  // Fetch conversations
  const fetchConversations = async () => {
    if (!activeCharacter) return;

    try {
      const res = await fetch(`/api/conversations?characterId=${activeCharacter.id}`);
      const data = await res.json();
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: number) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data);
      setMessagesLoading(false);

      // Mark conversation as read
      await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: activeCharacter?.id }),
      });

      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessagesLoading(false);
    }
  };

  // Fetch all characters for new conversation
  const fetchAllCharacters = async () => {
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      // Filter out current character and inactive characters
      const filtered = data.filter(
        (c: Character) =>
          c.id !== activeCharacter?.id &&
          c.healthStatus !== 'Inactive'
      );
      setAllCharacters(filtered);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!activeCharacter) {
      return;
    }

    fetchConversations();
  }, [user, activeCharacter, navigate]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && activeCharacter) {
      fetchMessages(parseInt(selectedConversationId));
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, activeCharacter]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (selectedConversationId && activeCharacter) {
      // Poll every 3 seconds for new messages
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(parseInt(selectedConversationId));
      }, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [selectedConversationId, activeCharacter]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversationId || !activeCharacter) {
      return;
    }

    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: activeCharacter.id,
          message: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage('');
        // Immediately fetch new messages
        await fetchMessages(parseInt(selectedConversationId));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Create new conversation
  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCharacter || !initialMessage.trim() || !activeCharacter) {
      return;
    }

    setCreatingConversation(true);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCharacterId: activeCharacter.id,
          toCharacterId: selectedCharacter,
          initialMessage: initialMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowNewConversation(false);
        setSelectedCharacter('');
        setInitialMessage('');
        // Refresh conversations and navigate to new conversation
        await fetchConversations();
        setSearchParams({ conversationId: data.conversationId.toString() });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreatingConversation(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderAvatar = (imageUrl?: string, name?: string) => {
    const hasValidImage = imageUrl && imageUrl.trim() !== '' && !imageUrl.includes('via.placeholder');

    if (hasValidImage) {
      return (
        <img
          src={imageUrl}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
        <img
          src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg"
          alt="Placeholder"
          className="w-5 h-5 opacity-40"
        />
      </div>
    );
  };

  if (!user) {
    return null;
  }

  if (!activeCharacter) {
    return (
      <div className="bg-white p-8 shadow">
        <p className="text-gray-600">Please select a character to view conversations.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow min-h-[600px] flex">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="bg-[#2f3a2f] text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <button
            onClick={() => {
              setShowNewConversation(true);
              fetchAllCharacters();
            }}
            className="bg-white text-[#2f3a2f] px-3 py-1 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            New
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Start a new conversation!
            </div>
          ) : (
            conversations.map((conv) => {
              const isFromChar = conv.fromCharacterId === activeCharacter.id;
              const otherChar = isFromChar
                ? { name: conv.toCharacterName, imageUrl: conv.toCharacterImageUrl }
                : { name: conv.fromCharacterName, imageUrl: conv.fromCharacterImageUrl };

              const isSelected = conv.conversationId === parseInt(selectedConversationId || '0');

              return (
                <div
                  key={conv.conversationId}
                  onClick={() => setSearchParams({ conversationId: conv.conversationId.toString() })}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                      {renderAvatar(otherChar.imageUrl, otherChar.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-gray-900 truncate">{otherChar.name}</span>
                        {conv.lastMessageCreated && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatDate(conv.lastMessageCreated)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage || 'No messages yet'}</p>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <div className="mt-1">
                          <span className="inline-block bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {conv.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId && selectedConversation ? (
          <>
            {/* Header */}
            <div className="bg-[#2f3a2f] text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white flex-shrink-0">
                {renderAvatar(otherCharacter?.imageUrl, otherCharacter?.name)}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{otherCharacter?.name}</h2>
                <Link
                  to={`/character/${otherCharacter?.id}`}
                  className="text-sm text-gray-300 hover:underline"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              {messagesLoading ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isActiveChar = msg.characterId === activeCharacter.id;

                    return (
                      <div
                        key={msg.messageId}
                        className={`flex items-start gap-3 ${isActiveChar ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                          {renderAvatar(msg.characterImageUrl, msg.characterName)}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-md px-4 py-2 rounded-lg ${
                            isActiveChar
                              ? 'bg-green-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-900'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isActiveChar ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 bg-white">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-green-600"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-green-600 text-white px-6 py-2 font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">Select a conversation to view messages</p>
              <p className="text-sm">or start a new conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">New Conversation</h2>
            <form onSubmit={handleCreateConversation}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Character
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-green-600"
                  required
                >
                  <option value="">Choose a character...</option>
                  {allCharacters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name} {char.surname ? char.surname : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-green-600"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewConversation(false);
                    setSelectedCharacter('');
                    setInitialMessage('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={creatingConversation}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingConversation || !selectedCharacter || !initialMessage.trim()}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingConversation ? 'Creating...' : 'Start Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Conversations;
