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
    <header className="bg-white/35 border-b border-white/20 relative z-20">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="text-4xl font-normal tracking-widest hover:text-white" style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: 'black' }}>HORIZON</Link>
        </div>
        <nav className="flex items-center space-x-6" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <Link to="/" className="text-xs uppercase tracking-wide hover:text-white" style={{ color: 'black' }}>Home</Link>
          <Link to="/wiki" className="text-xs uppercase tracking-wide hover:text-white" style={{ color: 'black' }}>Wiki</Link>
          <Link to="/regions" className="text-xs uppercase tracking-wide hover:text-white" style={{ color: 'black' }}>Regions</Link>
          <Link to="/characters" className="text-xs uppercase tracking-wide hover:text-white" style={{ color: 'black' }}>Characters</Link>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-xs uppercase tracking-wide" style={{ color: 'black' }}>Welcome, {user.username}!</span>
              
              {activeCharacter ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition-colors border border-gray-600"
                  >
                    <img 
                      src={activeCharacter.imageUrl} 
                      alt={activeCharacter.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-semibold">{activeCharacter.name}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg py-1 border border-gray-700 z-50">
                      <div className="px-4 py-2 border-b border-gray-700 text-xs text-gray-400 uppercase font-semibold">
                        Switch Profile
                      </div>
                      {userCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => {
                            onCharacterSelect?.(char.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-700 transition-colors ${
                            activeCharacter.id === char.id ? 'bg-gray-700' : ''
                          }`}
                        >
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-white">{char.name}</span>
                          {activeCharacter.id === char.id && (
                            <svg className="w-4 h-4 text-green-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-gray-700 mt-1 pt-1">
                        <Link 
                          to="/my-characters" 
                          className="block px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 hover:text-blue-300"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Characters
                        </Link>
                        <Link 
                          to="/account" 
                          className="block px-4 py-2 text-sm text-blue-400 hover:bg-gray-700 hover:text-blue-300"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/my-characters" className="text-xs uppercase tracking-wide hover:text-white" style={{ color: 'black' }}>
                  Create Character
                </Link>
              )}
              
              <button onClick={onLogout} className="text-xs uppercase tracking-wide font-bold hover:text-white" style={{ color: 'black' }}>Logout</button>
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
