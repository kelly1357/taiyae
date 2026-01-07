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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenNavDropdown(null);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
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
      onClick={() => { setOpenNavDropdown(null); setIsMobileMenuOpen(false); }}
      className="dropdown-link block px-4 py-2 text-xs uppercase tracking-wide transition-colors"
    >
      {children}
    </Link>
  );

  const MobileNavSection = ({ label, children }: { label: string; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-xs uppercase tracking-wide flex items-center justify-between text-gray-800"
        >
          {label}
          <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="bg-gray-50 pb-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  const MobileDropdownLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className="block px-6 py-2 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100"
    >
      {children}
    </Link>
  );

  return (
    <header className="bg-white/35 border-b border-white/20 relative z-20">
      <div className="max-w-[1325px] mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="logo">
          <Link to="/" className="header-link text-2xl md:text-4xl font-normal tracking-widest transition-colors" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>HORIZON</Link>
        </div>

        {/* Mobile hamburger button */}
        <button 
          className="md:hidden p-2 text-gray-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Desktop navigation */}
        <nav ref={navRef} className="hidden md:flex items-center space-x-6" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
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
            <DropdownLink to="/ooc">Out of Character</DropdownLink>
            <DropdownLink to="/ooc-forum/7">IC Archives</DropdownLink>
            <DropdownLink to="#">Social Media</DropdownLink>
          </NavDropdown>
          {user ? (
            <div className="flex items-center space-x-4">
              {activeCharacter ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-white/35 px-3 py-1 hover:bg-white/50 transition-colors border border-white/20"
                  >
                    {activeCharacter.imageUrl && activeCharacter.imageUrl.trim() !== '' && !activeCharacter.imageUrl.includes('via.placeholder') ? (
                      <img 
                        src={activeCharacter.imageUrl} 
                        alt={activeCharacter.name} 
                        className="w-8 h-8 object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center">
                        <img 
                          src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                          alt="Placeholder" 
                          className="w-5 h-5 opacity-40"
                        />
                      </div>
                    )}
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
                          {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') ? (
                            <img 
                              src={char.imageUrl} 
                              alt={char.name} 
                              className="w-8 h-8 object-cover border border-gray-300"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center">
                              <img 
                                src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                                alt="Placeholder" 
                                className="w-5 h-5 opacity-40"
                              />
                            </div>
                          )}
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-300 shadow-lg z-50" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <MobileNavSection label="For Guests">
            <MobileDropdownLink to="/wiki/game-overview">About Us</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/faq">FAQ</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/rules-general">Site Rules</MobileDropdownLink>
            <MobileDropdownLink to="/adopt">Adoptables</MobileDropdownLink>
            <MobileDropdownLink to="/my-characters">Join Horizon</MobileDropdownLink>
          </MobileNavSection>
          <MobileNavSection label="Characters">
            <MobileDropdownLink to="/characters">Character List</MobileDropdownLink>
            <MobileDropdownLink to="/regions">Regions</MobileDropdownLink>
          </MobileNavSection>
          <MobileNavSection label="Wiki">
            <MobileDropdownLink to="/wiki/handbook">Handbook</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/title-list">Title List</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/activity-absences">Activity & Absences</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/map">Map</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/setting-overview">Setting Overview</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/rules-general">Site Rules</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/skill-points">Skill Points</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/wolf-guide">Wolf Guide</MobileDropdownLink>
          </MobileNavSection>
          <MobileNavSection label="OOC">
            <MobileDropdownLink to="/ooc">Out of Character</MobileDropdownLink>
            <MobileDropdownLink to="/ooc-forum/7">IC Archives</MobileDropdownLink>
            <MobileDropdownLink to="#">Social Media</MobileDropdownLink>
          </MobileNavSection>
          
          {user ? (
            <div className="border-b border-gray-200">
              {activeCharacter && (
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    {activeCharacter.imageUrl && activeCharacter.imageUrl.trim() !== '' && !activeCharacter.imageUrl.includes('via.placeholder') ? (
                      <img 
                        src={activeCharacter.imageUrl} 
                        alt={activeCharacter.name} 
                        className="w-10 h-10 object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 border border-gray-300 flex items-center justify-center">
                        <img 
                          src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                          alt="Placeholder" 
                          className="w-6 h-6 opacity-40"
                        />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">{activeCharacter.name}</span>
                  </div>
                </div>
              )}
              {userCharacters.length > 1 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs uppercase tracking-wide text-gray-500">Switch Character</div>
                  {userCharacters.filter(c => c.id !== activeCharacter?.id).map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        onCharacterSelect?.(char.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-gray-100"
                    >
                      {char.imageUrl && char.imageUrl.trim() !== '' && !char.imageUrl.includes('via.placeholder') ? (
                        <img 
                          src={char.imageUrl} 
                          alt={char.name} 
                          className="w-8 h-8 object-cover border border-gray-300"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center">
                          <img 
                            src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                            alt="Placeholder" 
                            className="w-5 h-5 opacity-40"
                          />
                        </div>
                      )}
                      <span className="text-sm text-gray-900">{char.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <Link 
                to="/my-characters" 
                className="block px-4 py-3 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Manage Characters
              </Link>
              <Link 
                to="/account" 
                className="block px-4 py-3 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Manage Account
              </Link>
              <button 
                onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }} 
                className="w-full text-left px-4 py-3 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100 border-t border-gray-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="border-b border-gray-200">
              <Link 
                to="/login" 
                className="block px-4 py-3 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="block px-4 py-3 text-xs uppercase tracking-wide text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
