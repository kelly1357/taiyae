import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import type { User, Character } from '../types';

interface LayoutProps {
  user?: User;
  activeCharacter?: Character;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, activeCharacter, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-800 text-gray-100 font-sans flex flex-col">
      <Header user={user} activeCharacter={activeCharacter} onLogout={onLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
