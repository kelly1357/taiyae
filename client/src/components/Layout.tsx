import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';

import Header from './Header';
import { useBackground } from '../contexts/BackgroundContext';
import Login from '../pages/Login';
import type { User, Character } from '../types';


interface LayoutProps {
  user?: User;
  activeCharacter?: Character;
  userCharacters?: Character[];
  onlineCharacters?: Character[];
  onLogout?: () => void;
  onCharacterSelect?: (characterId: string | number) => void;
  onLogin?: (user: User) => void;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  activeCharacter,
  userCharacters,
  onlineCharacters,
  onLogout,
  onCharacterSelect,
  onLogin,
}) => {
  const onlineList = onlineCharacters ?? [];
  const { backgroundUrl, isGrayscale } = useBackground();
  const [imageError, setImageError] = useState(false);

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
        <div className="max-w-[1325px] mx-auto px-4">
          <div className="bg-white/35 p-4">
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
                  Active Character: <Link to={`/character/${activeCharacter.id}`}>{activeCharacter.name}</Link>
                </div>
                <div className="relative">
                  <Link to={`/character/${activeCharacter.id}`}>
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


            {!activeCharacter && user && userCharacters?.length === 0 && (
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

            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Who's Online ({onlineList.length})
              </div>
              <div className="px-4 py-4 text-sm text-gray-800 space-y-2">
                {onlineList.length ? (
                  <div className="flex flex-wrap items-center">
                    {onlineList.map((character, index) => (
                      <span key={character.id}>
                        <Link 
                          to={`/character/${character.id}`}
                          className="hover:text-gray-600"
                        >
                          {character.name}
                        </Link>
                        {index < onlineList.length - 1 && <span className="mx-1 text-gray-400">·</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No characters online.</p>
                )}
                <div className="mt-5 pt-3 border-t border-gray-200 text-xs text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-500">Rogue</span>
                    <span>•</span>
                    <span className="italic text-gray-500">Joining</span>
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
                <button className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold py-2 text-sm uppercase tracking-wide">
                  Ping Staff
                </button>
              </div>
            </section>

            {/* Cbox / Discord */}
            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Cbox | <span className="font-bold">Discord</span>
              </div>
              <div className="p-0">
                <iframe 
                  src="https://www3.cbox.ws/box/?boxid=3551299&boxtag=D5M2uo" 
                  width="100%" 
                  height="450" 
                  allowTransparency={true}
                  allow="autoplay" 
                  frameBorder="0" 
                  marginHeight={0} 
                  marginWidth={0} 
                  scrolling="auto"
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
      </main>
    </div>
  );
};

export default Layout;
