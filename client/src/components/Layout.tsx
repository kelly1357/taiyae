import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import type { User, Character } from '../types';

interface LayoutProps {
  user?: User;
  activeCharacter?: Character;
  userCharacters?: Character[];
  onLogout?: () => void;
  onCharacterSelect?: (characterId: string | number) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, activeCharacter, userCharacters, onLogout, onCharacterSelect }) => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <Header 
        user={user} 
        activeCharacter={activeCharacter} 
        userCharacters={userCharacters}
        onLogout={onLogout} 
        onCharacterSelect={onCharacterSelect}
      />
      <main className="flex-grow container mx-auto px-4 py-8 relative z-10">
        <Outlet context={{ user, activeCharacter }} />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
