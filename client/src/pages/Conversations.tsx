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

  // New conversation state
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [selectedCharacterName, setSelectedCharacterName] = useState<string>('');
  const [characterSearch, setCharacterSearch] = useState('');
  const [showCharacterResults, setShowCharacterResults] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const characterSearchRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(
    c => c.conversationId === parseInt(selectedConversationId || '0', 10)
  );

  // Fetch conversations
  const fetchConversations = async () => {
    if (!activeCharacter) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/conversations?characterId=${activeCharacter.id}`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      setMessages(data);
      setMessagesLoading(false);

      // Scroll messages container to bottom after messages load
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);

      // Mark conversation as read
      await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characterId: activeCharacter?.id }),
      });

      // Refresh conversations to update unread count
      fetchConversations();

      // Dispatch event to update header badge
      window.dispatchEvent(new CustomEvent('conversationRead'));
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
          String(c.id) !== String(activeCharacter?.id) &&
          c.healthStatus !== 'Inactive'
      );
      setAllCharacters(filtered);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  // Click outside handler for character search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (characterSearchRef.current && !characterSearchRef.current.contains(event.target as Node)) {
        setShowCharacterResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter characters based on search (matches from start of first or last name)
  const filteredCharacters = allCharacters.filter((char) => {
    const search = characterSearch.toLowerCase();
    const firstName = (char.name || '').toLowerCase();
    const lastName = (char.surname || '').toLowerCase();
    return firstName.startsWith(search) || lastName.startsWith(search);
  });

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
    fetchAllCharacters();
  }, [user, activeCharacter, navigate]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && activeCharacter) {
      fetchMessages(parseInt(selectedConversationId, 10));
    } else {
      setMessages([]);
    }
  }, [selectedConversationId, activeCharacter]);

  // Handle real-time messages via SignalR
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent<Message>) => {
      const newMsg = event.detail;

      // If this message is for the current conversation, add it to messages
      if (selectedConversationId && newMsg.conversationId === parseInt(selectedConversationId, 10)) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.messageId === newMsg.messageId)) {
            return prev;
          }
          return [...prev, newMsg];
        });

        // Scroll to bottom
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);

        // Mark as read since we're viewing it
        if (activeCharacter) {
          const token = localStorage.getItem('token');
          fetch(`/api/conversations/${newMsg.conversationId}/mark-read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ characterId: activeCharacter.id }),
          }).catch(err => console.error('Failed to mark as read:', err));

          // Dispatch event to update header badge
          window.dispatchEvent(new CustomEvent('conversationRead'));
        }
      }

      // Refresh conversations list to update last message preview
      fetchConversations();
    };

    const handleNewConversation = () => {
      // Refresh conversations list when a new conversation starts
      fetchConversations();
    };

    window.addEventListener('signalr:newMessage', handleNewMessage as EventListener);
    window.addEventListener('signalr:newConversation', handleNewConversation as EventListener);

    return () => {
      window.removeEventListener('signalr:newMessage', handleNewMessage as EventListener);
      window.removeEventListener('signalr:newConversation', handleNewConversation as EventListener);
    };
  }, [selectedConversationId, activeCharacter]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversationId || !activeCharacter) {
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: activeCharacter.id,
          message: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage('');
        // Immediately fetch new messages
        await fetchMessages(parseInt(selectedConversationId, 10));
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Start new conversation (just send first message)
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCharacter || !newMessage.trim() || !activeCharacter) {
      return;
    }

    setCreatingConversation(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromCharacterId: activeCharacter.id,
          toCharacterId: selectedCharacter,
          initialMessage: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowNewConversation(false);
        setSelectedCharacter('');
        setSelectedCharacterName('');
        setCharacterSearch('');
        setNewMessage('');
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
    <div className="bg-white shadow h-[calc(100vh-200px)] flex">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-80 border-r border-gray-300 flex flex-col ${selectedConversationId && !showNewConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="bg-[#2f3a2f] text-white p-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold">Messages</h2>
          <button
            onClick={() => {
              setShowNewConversation(!showNewConversation);
              if (!showNewConversation) {
                setSelectedCharacter('');
                setNewMessage('');
              }
            }}
            className="bg-white text-[#2f3a2f] px-3 py-1 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            {showNewConversation ? 'Cancel' : 'New'}
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 && !showNewConversation ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Start a new conversation!
            </div>
          ) : (
            <>
              {showNewConversation && (
                <div className="p-3 border-b-2 border-green-600 bg-green-50">
                  <div className="font-semibold text-gray-900 mb-2">New Conversation</div>
                  <div className="relative" ref={characterSearchRef}>
                    <input
                      type="text"
                      placeholder="Search for a character..."
                      value={selectedCharacter ? selectedCharacterName : characterSearch}
                      onChange={(e) => {
                        setCharacterSearch(e.target.value);
                        setSelectedCharacter('');
                        setSelectedCharacterName('');
                        setShowCharacterResults(true);
                      }}
                      onFocus={() => setShowCharacterResults(true)}
                      className="w-full border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-600 mb-2"
                    />
                    {showCharacterResults && characterSearch && !selectedCharacter && (
                      <div className="absolute z-10 w-full bg-white border border-gray-300 shadow-lg max-h-48 overflow-y-auto">
                        {filteredCharacters.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No characters found</div>
                        ) : (
                          filteredCharacters.slice(0, 20).map((char) => (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => {
                                setSelectedCharacter(String(char.id));
                                setSelectedCharacterName(`${char.name}${char.surname ? ' ' + char.surname : ''}`);
                                setCharacterSearch('');
                                setShowCharacterResults(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                            >
                              {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') ? (
                                <img src={char.imageUrl} alt={char.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <img
                                    src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg"
                                    alt="Placeholder"
                                    className="w-4 h-4 opacity-40"
                                  />
                                </div>
                              )}
                              <span className="text-gray-900">{char.name} {char.surname || ''}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {selectedCharacter && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCharacter('');
                          setSelectedCharacterName('');
                          setCharacterSearch('');
                        }}
                        className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                        title="Clear selection"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}
              {conversations.map((conv) => {
                const isFromChar = conv.fromCharacterId === parseInt(String(activeCharacter.id), 10);
                const otherChar = isFromChar
                  ? { name: conv.toCharacterName, imageUrl: conv.toCharacterImageUrl }
                  : { name: conv.fromCharacterName, imageUrl: conv.fromCharacterImageUrl };

                const isSelected = conv.conversationId === parseInt(selectedConversationId || '0', 10);

                return (
                  <div
                    key={conv.conversationId}
                    onClick={() => {
                      setShowNewConversation(false);
                      setSearchParams({ conversationId: conv.conversationId.toString() });
                    }}
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
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {conv.lastMessageCreated && (
                              <span className="text-xs text-gray-500">
                                {formatDate(conv.lastMessageCreated)}
                              </span>
                            )}
                            {(conv.unreadCount ?? 0) > 0 && (
                              <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm text-gray-600 truncate ${(conv.unreadCount ?? 0) > 0 ? 'font-bold' : ''}`}>
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Main Content - Messages */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedConversationId && !showNewConversation ? 'flex' : 'hidden md:flex'}`}>
        {selectedConversationId && selectedConversation && !showNewConversation ? (
          <>
            {/* Mobile Back Button + Header */}
            <div className="md:hidden bg-[#2f3a2f] text-white p-3 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setSearchParams({})}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 flex-shrink-0">
                  {renderAvatar(
                    selectedConversation.fromCharacterId === parseInt(String(activeCharacter.id), 10)
                      ? selectedConversation.toCharacterImageUrl
                      : selectedConversation.fromCharacterImageUrl,
                    selectedConversation.fromCharacterId === parseInt(String(activeCharacter.id), 10)
                      ? selectedConversation.toCharacterName
                      : selectedConversation.fromCharacterName
                  )}
                </div>
                <span className="font-semibold truncate">
                  {selectedConversation.fromCharacterId === parseInt(String(activeCharacter.id), 10)
                    ? selectedConversation.toCharacterName
                    : selectedConversation.fromCharacterName}
                </span>
              </div>
            </div>
            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              {messagesLoading && messages.length === 0 ? (
                <div className="text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isActiveChar = msg.characterId === parseInt(String(activeCharacter.id), 10);

                    return (
                      <div
                        key={msg.messageId}
                        className={`flex items-start gap-3 ${isActiveChar ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        {isActiveChar ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 flex-shrink-0">
                            {renderAvatar(msg.characterImageUrl, msg.characterName)}
                          </div>
                        ) : (
                          <Link
                            to={`/character/${msg.characterId}`}
                            className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            {renderAvatar(msg.characterImageUrl, msg.characterName)}
                          </Link>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[85%] md:max-w-md px-4 py-2 rounded-lg ${
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
            <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-gray-300 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-green-600 text-black text-base"
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
                  className="bg-green-600 text-white px-4 md:px-6 py-2 font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 hidden md:block">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </>
        ) : showNewConversation && selectedCharacter ? (
          <>
            {/* New Conversation Header */}
            <div className="bg-[#2f3a2f] text-white p-4 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedCharacter('');
                  setSelectedCharacterName('');
                  setCharacterSearch('');
                }}
                className="md:hidden text-white hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white flex-shrink-0">
                {renderAvatar(
                  allCharacters.find(c => String(c.id) === selectedCharacter)?.imageUrl,
                  allCharacters.find(c => String(c.id) === selectedCharacter)?.name
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {allCharacters.find(c => String(c.id) === selectedCharacter)?.name}
                </h2>
                <p className="text-sm text-gray-300">New conversation</p>
              </div>
            </div>

            {/* Empty state */}
            <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Start your conversation</p>
                <p className="text-sm">Send a message below to begin</p>
              </div>
            </div>

            {/* Message Input */}
            <form onSubmit={handleStartConversation} className="p-3 md:p-4 border-t border-gray-300 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your first message..."
                  className="flex-1 border border-gray-300 px-3 py-2 resize-none focus:outline-none focus:border-green-600 text-black text-base"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartConversation(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={creatingConversation || !newMessage.trim()}
                  className="bg-green-600 text-white px-4 md:px-6 py-2 font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end"
                >
                  {creatingConversation ? '...' : 'Start'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 hidden md:block">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">
                {showNewConversation ? 'Select a character to message' : 'A-wooooo! Select a conversation.'}
              </p>
              {showNewConversation && (
                <p className="text-sm">Choose a character from the list on the left</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
