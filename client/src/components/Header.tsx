import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { User, Character } from '../types';

interface HeaderProps {
  user?: User;
  activeCharacter?: Character;
  userCharacters?: Character[];
  onLogout?: () => void;
  onCharacterSelect?: (characterId: string | number) => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeCharacter, userCharacters = [], onLogout, onCharacterSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-[#2f3a2f] text-white border-b border-gray-600 relative z-20 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="text-2xl font-bold tracking-wider text-white drop-shadow-sm">HORIZON</Link>
        </div>
        <nav className="flex items-center space-x-6">
          <Link to="/" className="hover:text-gray-200 transition-colors">Home</Link>
          <Link to="/wiki" className="hover:text-gray-200 transition-colors">Wiki</Link>
          <Link to="/regions" className="hover:text-gray-200 transition-colors">Regions</Link>
          <Link to="/characters" className="hover:text-gray-200 transition-colors">Characters</Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-200">Welcome, {user.username}!</span>
              
              {activeCharacter ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <img 
                      src={activeCharacter.imageUrl} 
                      alt={activeCharacter.name} 
                      className="w-8 h-8 rounded-full object-cover border border-white/30"
                    />
                    <span className="text-sm font-semibold">{activeCharacter.name}</span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-gray-900 rounded-md shadow-xl py-1 border border-gray-200 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-700 uppercase font-bold bg-gray-50">
                        Switch Profile
                      </div>
                      {userCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => {
                            onCharacterSelect?.(char.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 transition-colors ${
                            activeCharacter.id === char.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          />
                          <span className="text-sm font-medium text-gray-900">{char.name}</span>
                          {activeCharacter.id === char.id && (
                            <svg className="w-4 h-4 text-green-700 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <Link 
                          to="/my-characters" 
                          className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Characters
                        </Link>
                        <Link 
                          to="/account" 
                          className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/my-characters" className="text-sm text-green-300 hover:text-green-200 font-semibold">
                  Create Character
                </Link>
              )}
              
              <button onClick={onLogout} className="text-sm text-red-300 hover:text-red-200 font-semibold">Logout</button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/login" className="hover:text-gray-200 transition-colors">Sign In</Link>
              <Link to="/register" className="hover:text-gray-200 transition-colors">Join</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
