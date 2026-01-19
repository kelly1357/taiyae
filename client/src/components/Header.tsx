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
  const isModerator = user?.isModerator ?? false;
  const isAdmin = user?.isAdmin ?? false;
  const isAdmin = user?.isAdmin ?? false;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openNavDropdown, setOpenNavDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingSkillPointsCount, setPendingSkillPointsCount] = useState(0);
  const [pendingPlotNewsCount, setPendingPlotNewsCount] = useState(0);
  const [pendingAchievementsCount, setPendingAchievementsCount] = useState(0);
  const [pendingInactiveCharactersCount, setPendingInactiveCharactersCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fetch pending skill points count for moderators
  useEffect(() => {
    if (!isModerator) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/skill-points-approval/count');
        if (response.ok) {
          const data = await response.json();
          setPendingSkillPointsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending skill points count:', error);
      }
    };
    
    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isModerator]);

  // Fetch pending plot news count for moderators
  useEffect(() => {
    if (!isModerator) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/plot-news/pending/count');
        if (response.ok) {
          const data = await response.json();
          setPendingPlotNewsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending plot news count:', error);
      }
    };
    
    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isModerator]);

  // Fetch pending achievement requests count for moderators
  useEffect(() => {
    if (!isModerator) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/achievements/requests/pending/count');
        if (response.ok) {
          const data = await response.json();
          setPendingAchievementsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending achievements count:', error);
      }
    };
    
    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isModerator]);

  // Fetch pending inactive characters count for moderators
  useEffect(() => {
    if (!isModerator) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/moderation/characters-to-inactivate/count');
        if (response.ok) {
          const data = await response.json();
          setPendingInactiveCharactersCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending inactive characters count:', error);
      }
    };
    
    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [isModerator]);

  // Fetch pending staff pings count for moderators
  const [pendingStaffPingsCount, setPendingStaffPingsCount] = useState(0);
  useEffect(() => {
    if (!isModerator) return;
    
    const fetchCount = async () => {
      try {
        const response = await fetch('/api/staff-pings/count');
        if (response.ok) {
          const data = await response.json();
          setPendingStaffPingsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending staff pings count:', error);
      }
    };
    
    fetchCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isModerator]);

  const handleDropdownMouseEnter = (label: string) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    // Close user dropdown when hovering nav dropdowns
    setIsDropdownOpen(false);
    setOpenNavDropdown(label);
  };

  const handleDropdownMouseLeave = () => {
    // Set a timeout to close the dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenNavDropdown(null);
    }, 150);
  };

  const handleDropdownContentEnter = () => {
    // Clear close timeout when entering dropdown content
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleDropdownContentLeave = () => {
    // Set a timeout to close the dropdown
    closeTimeoutRef.current = setTimeout(() => {
      setOpenNavDropdown(null);
    }, 150);
  };

  const handleUserDropdownClick = () => {
    // Close nav dropdowns when opening user dropdown
    setOpenNavDropdown(null);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const NavDropdown = ({ id, label, children }: { id: string; label: React.ReactNode; children: React.ReactNode }) => (
    <div
      className="relative"
      onMouseEnter={() => handleDropdownMouseEnter(id)}
      onMouseLeave={() => handleDropdownMouseLeave()}
    >
      <button
        type="button"
        onClick={() => setOpenNavDropdown(openNavDropdown === id ? null : id)}
        className="header-link text-xs uppercase tracking-wide transition-colors flex items-center gap-1"
      >
        {label}
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {openNavDropdown === id && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-300 shadow-lg z-50"
          onMouseEnter={() => handleDropdownContentEnter()}
          onMouseLeave={() => handleDropdownContentLeave()}
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

  const MobileNavSection = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => {
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
          <NavDropdown id="guests" label="For Guests">
            <DropdownLink to="/wiki/game-overview">About Us</DropdownLink>
            <DropdownLink to="/wiki/faq">FAQ</DropdownLink>
            <DropdownLink to="/wiki/rules-general">Site Rules</DropdownLink>
            <DropdownLink to="/adopt">Adoptables</DropdownLink>
            <DropdownLink to="/my-characters?new=true?new=true">Join Horizon</DropdownLink>
          </NavDropdown>
          <NavDropdown id="characters" label="Characters">
            <DropdownLink to="/characters">Character List</DropdownLink>
            <DropdownLink to="/activity-tracker">Activity Tracker</DropdownLink>
            <DropdownLink to="/regions">Regions</DropdownLink>
          </NavDropdown>
          <NavDropdown id="wiki" label="Wiki">
            <DropdownLink to="/wiki/handbook">Handbook</DropdownLink>
            <DropdownLink to="/wiki/title-list">Title List</DropdownLink>
            <hr className="border-t border-gray-300 my-1" />
            <DropdownLink to="/wiki/absences-and-scarcity">Activity & Absences</DropdownLink>
            <DropdownLink to="/wiki/absences-and-scarcity">Activity & Absences</DropdownLink>
            <DropdownLink to="/wiki/map">Map</DropdownLink>
            <DropdownLink to="/wiki/setting-overview">Setting Overview</DropdownLink>
            <DropdownLink to="/wiki/rules-general">Site Rules</DropdownLink>
            <DropdownLink to="/wiki/skill-points">Skill Points</DropdownLink>
            <DropdownLink to="/wiki/wolf-guide">Wolf Guide</DropdownLink>
          </NavDropdown>
          <NavDropdown id="ooc" label="OOC">
            <DropdownLink to="/ooc">Out of Character</DropdownLink>
            <DropdownLink to="/ooc-forum/7">IC Archives</DropdownLink>
            <DropdownLink to="#">Social Media</DropdownLink>
          </NavDropdown>
<<<<<<< HEAD
          {user && activeCharacter && (
            <Link to="/conversations" className="header-link text-xs uppercase tracking-wide transition-colors">
              Messages
            </Link>
          )}
          {(isModerator || isAdmin) && (
            <NavDropdown id="admin" label={<span className="flex items-center gap-1">Admin{(pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingStaffPingsCount) > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingStaffPingsCount}</span>}</span>}>
              <DropdownLink to="/admin/skill-points">
                <span className="flex items-center justify-between w-full">
                  Skill Points
                  {pendingSkillPointsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/achievements">
                <span className="flex items-center justify-between w-full">
                  Achievements
                  {pendingAchievementsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingAchievementsCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/plot-news">
                <span className="flex items-center justify-between w-full">
                  Plot News
                  {pendingPlotNewsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingPlotNewsCount}</span>}
                </span>
              </DropdownLink>
=======
          {(isModerator || isAdmin) && (
            <NavDropdown id="admin" label={<span className="flex items-center gap-1">Admin{(pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingStaffPingsCount) > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingStaffPingsCount}</span>}</span>}>
>>>>>>> de7b9533cf15d0d03a1fea03808387b3b252b260
              <DropdownLink to="/admin/inactive-characters">
                <span className="flex items-center justify-between w-full">
                  Inactive Characters
                  {pendingInactiveCharactersCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-600 text-white rounded-full leading-none">{pendingInactiveCharactersCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/homepage">Homepage</DropdownLink>
              <DropdownLink to="/admin/staff-pings">
                <span className="flex items-center justify-between w-full">
                  Staff Pings
                  {pendingStaffPingsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">{pendingStaffPingsCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/achievements">
                <span className="flex items-center justify-between w-full">
                  Achievements
                  {pendingAchievementsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingAchievementsCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/plot-news">
                <span className="flex items-center justify-between w-full">
                  Plot News
                  {pendingPlotNewsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingPlotNewsCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/inactive-characters">
                <span className="flex items-center justify-between w-full">
                  Inactive Characters
                  {pendingInactiveCharactersCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-600 text-white rounded-full leading-none">{pendingInactiveCharactersCount}</span>}
                </span>
              </DropdownLink>
              <DropdownLink to="/admin/homepage">Homepage</DropdownLink>
              <DropdownLink to="/admin/staff-pings">
                <span className="flex items-center justify-between w-full">
                  Staff Pings
                  {pendingStaffPingsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">{pendingStaffPingsCount}</span>}
                </span>
              </DropdownLink>
            </NavDropdown>
          )}
          {user ? (
            <div className="flex items-center space-x-4">
              {activeCharacter ? (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={handleUserDropdownClick}
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
                      {userCharacters
                        .filter(char => char.status === 'Active' || char.showInDropdown)
                        .map(char => (
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
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={handleUserDropdownClick}
                    className="flex items-center space-x-2 bg-white/35 px-3 py-1 hover:bg-white/50 transition-colors border border-white/20"
                  >
                    <div className="w-8 h-8 bg-gray-200 border border-gray-300 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 shadow-lg z-50">
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
              )}
              
              <button onClick={onLogout} className="text-xs uppercase tracking-wide font-bold hover:text-white" style={{ color: 'black' }}>Logout</button>
            </div>
          ) : (
            <div className="space-x-4">
              <span className="text-xs uppercase tracking-wide font-bold" style={{ color: 'black' }}>Sign In / Join</span>
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
            <MobileDropdownLink to="/my-characters?new=true">Join Horizon</MobileDropdownLink>
          </MobileNavSection>
          <MobileNavSection label="Characters">
            <MobileDropdownLink to="/characters">Character List</MobileDropdownLink>
            <MobileDropdownLink to="/activity-tracker">Activity Tracker</MobileDropdownLink>
            <MobileDropdownLink to="/regions">Regions</MobileDropdownLink>
          </MobileNavSection>
          <MobileNavSection label="Wiki">
            <MobileDropdownLink to="/wiki/handbook">Handbook</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/title-list">Title List</MobileDropdownLink>
            <MobileDropdownLink to="/wiki/absences-and-scarcity">Activity & Absences</MobileDropdownLink>
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
<<<<<<< HEAD
          {user && activeCharacter && (
            <div className="border-b border-gray-200">
              <Link
                to="/conversations"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-xs uppercase tracking-wide text-gray-800 hover:bg-gray-100"
              >
                Messages
              </Link>
            </div>
          )}
          {(isModerator || isAdmin) && (
            <MobileNavSection label={<span className="flex items-center gap-1">Admin{(pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingInactiveCharactersCount + pendingStaffPingsCount) > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingInactiveCharactersCount + pendingStaffPingsCount}</span>}</span>}>
              <MobileDropdownLink to="/admin/skill-points">
                <span className="flex items-center justify-between w-full">
                  Skill Points
                  {pendingSkillPointsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/achievements">
                <span className="flex items-center justify-between w-full">
                  Achievements
                  {pendingAchievementsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingAchievementsCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/plot-news">
                <span className="flex items-center justify-between w-full">
                  Plot News
                  {pendingPlotNewsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingPlotNewsCount}</span>}
                </span>
              </MobileDropdownLink>
=======
          {(isModerator || isAdmin) && (
            <MobileNavSection label={<span className="flex items-center gap-1">Admin{(pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingInactiveCharactersCount + pendingStaffPingsCount) > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingSkillPointsCount + pendingPlotNewsCount + pendingAchievementsCount + pendingInactiveCharactersCount + pendingStaffPingsCount}</span>}</span>}>
>>>>>>> de7b9533cf15d0d03a1fea03808387b3b252b260
              <MobileDropdownLink to="/admin/inactive-characters">
                <span className="flex items-center justify-between w-full">
                  Inactive Characters
                  {pendingInactiveCharactersCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-600 text-white rounded-full leading-none">{pendingInactiveCharactersCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/homepage">Homepage</MobileDropdownLink>
              <MobileDropdownLink to="/admin/staff-pings">
                <span className="flex items-center justify-between w-full">
                  Staff Pings
                  {pendingStaffPingsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">{pendingStaffPingsCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/achievements">
                <span className="flex items-center justify-between w-full">
                  Achievements
                  {pendingAchievementsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingAchievementsCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/plot-news">
                <span className="flex items-center justify-between w-full">
                  Plot News
                  {pendingPlotNewsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-full leading-none">{pendingPlotNewsCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/inactive-characters">
                <span className="flex items-center justify-between w-full">
                  Inactive Characters
                  {pendingInactiveCharactersCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-yellow-600 text-white rounded-full leading-none">{pendingInactiveCharactersCount}</span>}
                </span>
              </MobileDropdownLink>
              <MobileDropdownLink to="/admin/homepage">Homepage</MobileDropdownLink>
              <MobileDropdownLink to="/admin/staff-pings">
                <span className="flex items-center justify-between w-full">
                  Staff Pings
                  {pendingStaffPingsCount > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full leading-none">{pendingStaffPingsCount}</span>}
                </span>
              </MobileDropdownLink>
            </MobileNavSection>
          )}
          
          {user ? (
            <div className="border-b border-gray-200">
              {activeCharacter ? (
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
              ) : (
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 border border-gray-300 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{user.username}</span>
                  </div>
                </div>
              )}
              {userCharacters.filter(c => c.id !== activeCharacter?.id && (c.status === 'Active' || c.showInDropdown)).length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs uppercase tracking-wide text-gray-500">Switch Character</div>
                  {userCharacters.filter(c => c.id !== activeCharacter?.id && (c.status === 'Active' || c.showInDropdown)).map(char => (
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
