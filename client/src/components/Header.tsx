import React from 'react';
import { Link } from 'react-router-dom';
import type { User, Character } from '../types';

interface HeaderProps {
  user?: User;
  activeCharacter?: Character;
}

const Header: React.FC<HeaderProps> = ({ user, activeCharacter }) => {
  return (
    <header className="bg-gray-900 text-white border-b border-gray-700 relative z-20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="text-2xl font-bold tracking-wider">HORIZON</Link>
        </div>
        <nav className="flex space-x-6">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/wiki" className="hover:text-gray-300">Wiki</Link>
          <Link to="/characters" className="hover:text-gray-300">Characters</Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <span>Welcome, {user.username}</span>
              {activeCharacter && (
                <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded">
                  <img 
                    src={activeCharacter.imageUrl} 
                    alt={activeCharacter.name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm font-semibold">{activeCharacter.name}</span>
                </div>
              )}
              <button className="text-sm text-red-400 hover:text-red-300">Logout</button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="hover:text-gray-300">Sign In</Link>
              <Link to="/register" className="hover:text-gray-300">Join</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
