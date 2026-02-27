import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

import Header from './Header';
import PingStaffModal from './PingStaffModal';
import { useBackground } from '../contexts/BackgroundContext';
import { usePageTitle } from '../hooks/usePageTitle';
import Login from '../pages/Login';
import type { User, Character } from '../types';

// Generate or retrieve a unique guest session ID
const getGuestSessionId = (): string => {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
};


interface LayoutProps {
  user?: User;
  activeCharacter?: Character;
  userCharacters?: Character[];
  charactersLoaded?: boolean;
  onlineCharacters?: Character[];
  onLogout?: () => void;
  onCharacterSelect?: (characterId: string | number) => void;
  onLogin?: (user: User) => void;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  activeCharacter,
  userCharacters,
  charactersLoaded,
  onlineCharacters,
  onLogout,
  onCharacterSelect,
  onLogin,
}) => {
  const onlineList = onlineCharacters ?? [];
  const { backgroundUrl, isGrayscale } = useBackground();
  usePageTitle();
  const [imageError, setImageError] = useState(false);
  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [packs, setPacks] = useState<{ id: number; name: string; slug: string; color1: string }[]>([]);
  const location = useLocation();

  // Reset imageError when active character changes
  useEffect(() => {
    setImageError(false);
  }, [activeCharacter?.id]);

  // Send activity heartbeat every 5 minutes to keep character marked as online
  useEffect(() => {
    if (!activeCharacter?.id) return;

    const sendHeartbeat = () => {
      fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: activeCharacter.id }),
      }).catch(err => console.error('Activity heartbeat failed:', err));
    };

    // Send immediately on mount/character change
    sendHeartbeat();

    // Then send every 5 minutes
    const interval = setInterval(sendHeartbeat, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [activeCharacter?.id]);

  // Guest heartbeat - only for users without an active character
  useEffect(() => {
    // Wait until we know whether the user has characters loaded
    // This prevents counting logged-in users as guests during initial page load
    if (user && !charactersLoaded) return;

    // If user has an active character, they're not a guest - remove their guest session
    if (activeCharacter?.id) {
      const sessionId = localStorage.getItem('guestSessionId');
      if (sessionId) {
        fetch('/api/guests/session', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});
      }
      return;
    }

    // Users without an active character (including logged-in users with no characters) count as guests
    const sessionId = getGuestSessionId();

    const sendGuestHeartbeat = () => {
      fetch('/api/guests/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(err => console.error('Guest heartbeat failed:', err));
    };

    // Send immediately
    sendGuestHeartbeat();

    // Then send every 5 minutes
    const interval = setInterval(sendGuestHeartbeat, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, activeCharacter?.id, charactersLoaded]);

  // Fetch guest count periodically
  useEffect(() => {
    const fetchGuestCount = () => {
      fetch('/api/guests/count')
        .then(res => res.json())
        .then(data => setGuestCount(data.count || 0))
        .catch(() => {});
    };

    // Fetch immediately
    fetchGuestCount();

    // Then refresh every 2 minutes
    const interval = setInterval(fetchGuestCount, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch active packs
  useEffect(() => {
    fetch('/api/packs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPacks(data.filter((p: { isActive: boolean }) => p.isActive));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen text-gray-100 font-sans flex flex-col relative">
      {/* Full-page background */}
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: `url('${backgroundUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          zIndex: -1,
          filter: isGrayscale ? 'grayscale(100%)' : 'none',
        }}
      />

      <Header 
        user={user} 
        activeCharacter={activeCharacter} 
        userCharacters={userCharacters}
        onLogout={onLogout} 
        onCharacterSelect={onCharacterSelect}
      />
      <main className="flex-grow py-8 relative z-10 mt-5">
        <div className="max-w-[1325px] mx-auto px-0 md:px-4">
          <div className="md:bg-white/35 p-0 md:p-4">
          <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 flex-shrink-0 space-y-6">


            {/* Show Login component in sidebar for unauthenticated users, in read-only mode */}
            {!user && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Member Login
                </div>
                <div className="px-4 py-4">
                  <Login onLogin={onLogin || (() => {})} compact />
                </div>
              </section>
            )}

            {user && activeCharacter && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Active Character: <Link to={`/character/${activeCharacter.slug || activeCharacter.id}`}>{activeCharacter.name}</Link>
                </div>
                <div className="relative">
                  <Link to={`/character/${activeCharacter.slug || activeCharacter.id}`}>
                    {activeCharacter.imageUrl && activeCharacter.imageUrl.trim() !== '' && !imageError ? (
                      <img
                        src={activeCharacter.imageUrl}
                        alt={activeCharacter.name}
                        className="w-full aspect-square object-cover block"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                        <img 
                          src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                          alt="Placeholder" 
                          className="w-24 h-24 opacity-40"
                        />
                      </div>
                    )}
                  </Link>
                </div>
              </section>
            )}

            {/* Prompt for Joining users to apply */}
            {user && user.userStatus === 'Joining' && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Welcome to Horizon!
                </div>
                <div className="px-4 py-4 space-y-3 text-gray-800">
                  <p className="text-sm text-gray-700">
                    Hello, <span className="font-semibold">{user.username}</span>! We're excited to have you here.
                  </p>
                  <p className="text-sm text-gray-600">
                    To start roleplaying, introduce yourself in the Joining forum. Once approved, you'll be able to create your first character.
                  </p>
                  <Link 
                    to="/ooc-forum/1" 
                    className="block w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 text-sm uppercase tracking-wide text-center transition-colors"
                  >
                    Get Started →
                  </Link>
                </div>
              </section>
            )}

            {!activeCharacter && user && charactersLoaded && userCharacters?.length === 0 && user.userStatus !== 'Joining' && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Create a Character!
                </div>
                <div className="px-4 py-4 space-y-3 text-gray-800">
                  <p className="text-sm text-gray-700">
                    Welcome to Horizon, <span className="font-semibold">{user.username}</span>! You're almost ready to start roleplaying.
                  </p>
                  <p className="text-sm text-gray-600">
                    Create your first character to join the adventure and start posting in roleplay areas.
                  </p>
                  <Link 
                    to="/my-characters?new=true" 
                    className="block w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 text-sm uppercase tracking-wide text-center transition-colors"
                  >
                    Get Started →
                  </Link>
                </div>
              </section>
            )}

            {/* Starting Skill Points prompt */}
            {user && activeCharacter && !activeCharacter.hasClaimedStartingSP && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Skill Points Available!
                </div>
                <div className="px-4 py-4 space-y-3 text-gray-800">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{activeCharacter.name}</span> hasn't claimed their starting skill points yet!
                  </p>
                  <p className="text-sm text-gray-600">
                    Distribute your starting points across Experience, Physical, and Knowledge.
                  </p>
                  <Link
                    to="/starting-skill-points"
                    className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 text-sm uppercase tracking-wide text-center transition-colors"
                  >
                    Claim Skill Points →
                  </Link>
                </div>
              </section>
            )}

            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Who's Online ({onlineList.length})
              </div>
              <div className="px-4 py-4 text-sm text-gray-800 space-y-2">
                {(onlineList.length > 0 || guestCount > 0) ? (
                  <div className="flex flex-wrap items-center justify-center">
                    {onlineList.map((character, index) => {
                      const isStaff = character.isModerator || character.isAdmin;
                      const hasPackColor = !!character.packColor1;
                      
                      // Determine styling based on staff status and pack membership
                      const linkStyle: React.CSSProperties = {};
                      let className = 'hover:opacity-80';
                      
                      if (isStaff && hasPackColor) {
                        // Staff in a pack: light pack color background, pack color text
                        linkStyle.backgroundColor = `${character.packColor1}30`; // 30 = ~19% opacity
                        linkStyle.color = character.packColor1;
                        className += ' px-1.5 py-0.5 rounded';
                      } else if (isStaff) {
                        // Staff not in a pack: gray background
                        className += ' bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded';
                      } else if (hasPackColor) {
                        // Pack member (not staff): pack color text
                        linkStyle.color = character.packColor1;
                      }
                      
                      return (
                        <span key={character.id}>
                          <Link 
                            to={`/character/${character.slug || character.id}`}
                            className={className}
                            style={linkStyle}
                          >
                            {character.name}
                          </Link>
                          {(index < onlineList.length - 1 || guestCount > 0) && <span className="mx-1 text-gray-400">·</span>}
                        </span>
                      );
                    })}
                    {guestCount > 0 && (
                      <span className="text-gray-500">
                        {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center">No one online.</p>
                )}
                <div className="mt-5 pt-3 border-t border-gray-200 text-xs text-center">
                  <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    {packs.map((pack, index) => (
                      <span key={pack.id}>
                        <Link to={`/pack/${pack.slug}`} style={{ color: pack.color1 }} className="hover:underline">
                          {pack.name}
                        </Link>
                        {(index < packs.length - 1) && <span className="ml-2">•</span>}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Link to="/rogues" className="text-gray-500 hover:underline">Rogue</Link>
                    <span>•</span>
                    <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Staff</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Need Assistance?
              </div>
              <div className="px-4 py-4 text-sm text-gray-800 space-y-3">
                <p className="text-gray-700">
                  Can't reach staff in chat? Ping us and we'll get back to you as soon as possible.
                </p>
                <button 
                  onClick={() => setIsPingModalOpen(true)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2 text-sm uppercase tracking-wide"
                >
                  Ping Staff
                </button>
              </div>
            </section>

            {/* Cbox / Discord */}
            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Cbox | <a href="https://discord.gg/HFmZ8G4dQe" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:underline">Discord</a>
              </div>
              <div className="p-0">
                <iframe
                  src="https://www3.cbox.ws/box/?boxid=3551299&boxtag=D5M2uo"
                  width="100%"
                  height="450"
                  allow="autoplay"
                  style={{ border: 0, margin: 0 }}
                  title="Cbox Chat"
                ></iframe>
              </div>
            </section>
          </aside>

          <section className="flex-1">
            <Outlet context={{ user, activeCharacter }} />
          </section>
          </div>
          </div>
        </div>

        {/* Ping Staff Modal */}
        <PingStaffModal
          isOpen={isPingModalOpen}
          onClose={() => setIsPingModalOpen(false)}
          userId={typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id}
          currentPageUrl={location.pathname}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
};

export default Layout;
