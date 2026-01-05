import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useBackground } from '../contexts/BackgroundContext';
import type { User, Character } from '../types';

interface LayoutProps {
  user?: User;
  activeCharacter?: Character;
  userCharacters?: Character[];
  onlineCharacters?: Character[];
  onLogout?: () => void;
  onCharacterSelect?: (characterId: string | number) => void;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  activeCharacter,
  userCharacters,
  onlineCharacters,
  onLogout,
  onCharacterSelect,
}) => {
  const onlineList = onlineCharacters ?? [];
  const { backgroundUrl } = useBackground();

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
            {activeCharacter && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Active Character
                </div>
                <div className="relative">
                  <img
                    src={activeCharacter.imageUrl || '/default-avatar.png'}
                    alt={activeCharacter.name}
                    className="w-full aspect-square object-cover block"
                  />
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 text-sm font-semibold uppercase tracking-wide shadow">
                    {activeCharacter.name}
                  </span>
                </div>
              </section>
            )}

            {!activeCharacter && (
              <section className="bg-white border border-gray-300 shadow">
                <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                  Member Login
                </div>
                <div className="px-4 py-4 space-y-3 text-gray-800">
                  <input
                    type="text"
                    placeholder="Username"
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-500"
                  />
                  <button className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold py-2 uppercase tracking-wide">
                    Log In
                  </button>
                  <div className="text-xs text-gray-500 text-center">New here? Join Horizon</div>
                </div>
              </section>
            )}

            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Who's Online ({onlineList.length})
              </div>
              <div className="px-4 py-4 text-sm text-gray-800 space-y-2">
                {onlineList.length ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-2">
                    {onlineList.map((character) => (
                      <span key={character.id} className="hover:text-gray-600 cursor-pointer">
                        {character.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No characters online.</p>
                )}
              </div>
            </section>

            <section className="bg-white border border-gray-300 shadow">
              <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
                Packs
              </div>
              <div className="px-4 py-4 text-sm text-gray-800">
                <span className="block hover:text-gray-600 cursor-pointer">Rogue</span>
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
