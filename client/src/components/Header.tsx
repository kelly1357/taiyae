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
  const [openNavDropdown, setOpenNavDropdown] = useState<string | null>(null);
  const [dropdownHovering, setDropdownHovering] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenNavDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownMouseEnter = (label: string) => {
    setOpenNavDropdown(label);
    setDropdownHovering(label);
  };
  const handleDropdownMouseLeave = (label: string) => {
    setDropdownHovering(null);
    setTimeout(() => {
      if (dropdownHovering !== label) setOpenNavDropdown(null);
    }, 120);
  };

  const handleDropdownContentEnter = (label: string) => {
    setDropdownHovering(label);
  };
  const handleDropdownContentLeave = (label: string) => {
    setDropdownHovering(null);
    setTimeout(() => {
      if (openNavDropdown === label && dropdownHovering !== label) setOpenNavDropdown(null);
    }, 120);
  };

  const NavDropdown = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div
      className="relative"
      onMouseEnter={() => handleDropdownMouseEnter(label)}
      onMouseLeave={() => handleDropdownMouseLeave(label)}
    >
      <button
        type="button"
        onClick={() => setOpenNavDropdown(openNavDropdown === label ? null : label)}
        className="header-link text-xs uppercase tracking-wide transition-colors flex items-center gap-1"
      >
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openNavDropdown === label && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg z-50"
          onMouseEnter={() => handleDropdownContentEnter(label)}
          onMouseLeave={() => handleDropdownContentLeave(label)}
        >
          {children}
        </div>
      )}
    </div>
  );

  const DropdownLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      onClick={() => setOpenNavDropdown(null)}
      className="dropdown-link block px-4 py-2 text-xs uppercase tracking-wide transition-colors"
    >
      {children}
    </Link>
  );

  return (
    <header className="bg-white/35 border-b border-white/20 relative z-20">
      <div className="max-w-[1325px] mx-auto px-8 py-4 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="header-link text-4xl font-normal tracking-widest transition-colors" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>HORIZON</Link>
        </div>
        <nav ref={navRef} className="flex items-center space-x-6" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <NavDropdown label="For Guests">
            <DropdownLink to="/wiki/game-overview">About Us</DropdownLink>
            <DropdownLink to="/wiki/faq">FAQ</DropdownLink>
            <DropdownLink to="/wiki/rules-general">Site Rules</DropdownLink>
            <DropdownLink to="/adopt">Adoptables</DropdownLink>
            <DropdownLink to="/my-characters">Join Horizon</DropdownLink>
          </NavDropdown>
          <NavDropdown label="Characters">
            <DropdownLink to="/characters">Character List</DropdownLink>
            <DropdownLink to="/regions">Regions</DropdownLink>
          </NavDropdown>
          <NavDropdown label="Wiki">
            <DropdownLink to="/wiki/handbook">Handbook</DropdownLink>
            <DropdownLink to="/wiki/title-list">Title List</DropdownLink>
            <hr className="border-t border-gray-300 my-1" />
            <DropdownLink to="/wiki/activity-absences">Activity & Absences</DropdownLink>
            <DropdownLink to="/wiki/map">Map</DropdownLink>
            <DropdownLink to="/wiki/setting-overview">Setting Overview</DropdownLink>
            <DropdownLink to="/wiki/rules-general">Site Rules</DropdownLink>
            <DropdownLink to="/wiki/skill-points">Skill Points</DropdownLink>
            <DropdownLink to="/wiki/wolf-guide">Wolf Guide</DropdownLink>
          </NavDropdown>
          <NavDropdown label="OOC">
            <DropdownLink to="/ooc">OOC Forums</DropdownLink>
          </NavDropdown>
          {user ? (
            <div className="flex items-center space-x-4">
              {activeCharacter ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-white/35 px-3 py-1 hover:bg-white/50 transition-colors border border-white/20"
                  >
                    <img 
                      src={activeCharacter.imageUrl} 
                      alt={activeCharacter.name} 
                      className="w-8 h-8 object-cover border border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-900">{activeCharacter.name}</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 shadow-lg z-50">
                      {userCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => {
                            onCharacterSelect?.(char.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100 transition-colors border-b border-gray-200 ${
                            activeCharacter.id === char.id ? 'bg-gray-100' : ''
                          }`}
                        >
                          <img 
                            src={char.imageUrl} 
                            alt={char.name} 
                            className="w-8 h-8 object-cover border border-gray-300"
                          />
                          <span className="text-sm text-gray-900">{char.name}</span>
                          {activeCharacter.id === char.id && (
                            <svg className="w-4 h-4 text-[#2f3a2f] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                      <div className="py-1">
                        <Link 
                          to="/my-characters" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Characters
                        </Link>
                        <Link 
                          to="/account" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Manage Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              
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
