import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BackgroundProvider } from './contexts/BackgroundContext';
import Layout from './components/Layout';
import { useUser } from './contexts/UserContext';
import Home from './pages/Home';
import Region from './pages/Region';
import OOCForumPage from './pages/OOCForum';
import OOCForums from './pages/OOCForums';
import RegionDirectory from './pages/RegionDirectory';
import ThreadView from './pages/ThreadView';
import CharacterManagement from './pages/CharacterManagement';
import CharacterProfile from './pages/CharacterProfile';
import Characters from './pages/Characters';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import SpiritSymbolQuiz from './pages/SpiritSymbolQuiz';
import Weather from './pages/Weather';
import type { User, Character } from './types';

// Wiki pages
import {
  AbsencesAndScarcity,
  Achievements,
  ActivityChecks,
  FAQ,
  GameOverview,
  GettingStarted,
  Handbook,
  Map,
  OffscreenInteractions,
  PackCreation,
  ProfileHelp,
  RulesCompilation,
  RulesGeneral,
  RulesMindReading,
  SettingOverview,
  SkillPoints,
  SpiritSymbols,
  ThreeStrikeRule,
  UsingTags,
  WolfGuide,
  WolfGuideFighting,
  WolfGuidePupDevelopment,
} from './pages/wiki';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Refresh user data from API to get latest fields like imageUrl
        if (parsedUser.id) {
          fetch(`/api/users/${parsedUser.id}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                const isModerator = data.Is_Moderator === true || data.Is_Moderator === 1 || data.isModerator === true;
                const isAdmin = data.Is_Admin === true || data.Is_Admin === 1 || data.isAdmin === true;
                const refreshedUser = {
                  ...parsedUser,
                  imageUrl: data.ImageURL || data.imageUrl || parsedUser.imageUrl || '',
                  playerInfo: data.Description || data.playerInfo || parsedUser.playerInfo || '',
                  facebook: data.Facebook || data.facebook || parsedUser.facebook || '',
                  instagram: data.Instagram || data.instagram || parsedUser.instagram || '',
                  discord: data.Discord || data.discord || parsedUser.discord || '',
                  isModerator,
                  isAdmin,
                  role: isModerator ? 'moderator' : 'member',
                };
                setUser(refreshedUser);
                localStorage.setItem('user', JSON.stringify(refreshedUser));
              }
            })
            .catch(err => console.error("Failed to refresh user data", err));
        }
      } catch (e) {
        console.error("Failed to parse user from local storage");
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/characters?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setUserCharacters(data))
        .catch(err => console.error("Failed to fetch user characters", err));
    } else {
      setUserCharacters([]);
    }
  }, [user?.id]);

  // Fetch all characters and refresh periodically to update online status
  useEffect(() => {
    const fetchCharacters = () => {
      fetch('/api/characters')
        .then(res => res.json())
        .then(data => setAllCharacters(Array.isArray(data) ? data : []))
        .catch(err => console.error('Failed to fetch characters list', err));
    };

    fetchCharacters();
    
    // Refresh every 2 minutes to update online status
    const interval = setInterval(fetchCharacters, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const userContext = useUser();
  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    // Trigger UserContext to refetch from API
    if (userContext && typeof userContext.refetchUser === 'function') {
      userContext.refetchUser();
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Trigger UserContext to refetch from API
    if (userContext && typeof userContext.refetchUser === 'function') {
      userContext.refetchUser();
    }
  };

  const handleCharacterSelect = (characterId: string | number) => {
    if (!user) return;
    const updatedUser = { ...user, activeCharacterId: characterId };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  // Always render main layout; Layout handles login form for unauthenticated users


  // Determine active character
  // 1. Try to find character matching activeCharacterId
  // 2. If not found (or no activeCharacterId), default to the first character
  // 3. If no characters, undefined
  const activeCharacter = user && userCharacters.length > 0
    ? (userCharacters.find(c => String(c.id) === String(user.activeCharacterId)) || userCharacters[0])
    : undefined;

  // If we defaulted to the first character but activeCharacterId wasn't set, update it
  // (No-op: just for display, avoid render loop)

  // Get online characters, but only show one per player (the most recent)
  const onlineCharacters = (() => {
    const online = allCharacters.filter(c => c.isOnline);
    const byUser: Record<number, Character> = {};
    
    // Group by user and keep only the first (they're ordered by name, but we want most recent activity)
    // Since isOnline means active in last 15 min, just pick one per user
    for (const char of online) {
      if (char.odUserId && !byUser[char.odUserId]) {
        byUser[char.odUserId] = char;
      }
    }
    
    return Object.values(byUser);
  })();

  return (
    <BackgroundProvider>
    <Routes>
      <Route path="/" element={
        <Layout 
          user={user ?? undefined}
          activeCharacter={activeCharacter}
          userCharacters={userCharacters}
          onlineCharacters={onlineCharacters}
          onLogout={handleLogout}
          onCharacterSelect={handleCharacterSelect}
          onLogin={handleLogin}
        />
      }>
        <Route index element={<Home />} />
        <Route path="regions" element={<RegionDirectory />} />
        <Route path="region/:regionId" element={<Region />} />
        <Route path="ooc" element={<OOCForums />} />
        <Route path="ooc-forum/:forumId" element={<OOCForumPage />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="characters" element={<Characters />} />
        <Route path="character/:characterId" element={<CharacterProfile />} />
        <Route path="my-characters" element={user ? <CharacterManagement user={user} /> : <div className="text-center mt-20">Please log in to manage your characters.</div>} />
        <Route path="account" element={user ? <UserManagement user={user} onUpdateUser={handleUpdateUser} /> : <div className="text-center mt-20">Please log in to manage your account.</div>} />
        <Route path="weather" element={<Weather />} />
        {/* Wiki Routes */}
        <Route path="wiki/absences-and-scarcity" element={<AbsencesAndScarcity />} />
        <Route path="wiki/achievements" element={<Achievements />} />
        <Route path="wiki/activity-checks" element={<ActivityChecks />} />
        <Route path="wiki/faq" element={<FAQ />} />
        <Route path="wiki/game-overview" element={<GameOverview />} />
        <Route path="wiki/getting-started" element={<GettingStarted />} />
        <Route path="wiki/handbook" element={<Handbook />} />
        <Route path="wiki/map" element={<Map />} />
        <Route path="wiki/offscreen-interactions" element={<OffscreenInteractions />} />
        <Route path="wiki/pack-creation" element={<PackCreation />} />
        <Route path="wiki/profile-help" element={<ProfileHelp />} />
        <Route path="wiki/rules-compilation" element={<RulesCompilation />} />
        <Route path="wiki/rules-general" element={<RulesGeneral />} />
        <Route path="wiki/rules-mind-reading" element={<RulesMindReading />} />
        <Route path="wiki/setting-overview" element={<SettingOverview />} />
        <Route path="wiki/skill-points" element={<SkillPoints />} />
        <Route path="wiki/spirit-symbols" element={<SpiritSymbols />} />
        <Route path="wiki/spirit-symbol-quiz" element={<SpiritSymbolQuiz />} />
        <Route path="wiki/three-strike-rule" element={<ThreeStrikeRule />} />
        <Route path="wiki/using-tags" element={<UsingTags />} />
        <Route path="wiki/wolf-guide" element={<WolfGuide />} />
        <Route path="wiki/wolf-guide-fighting" element={<WolfGuideFighting />} />
        <Route path="wiki/wolf-guide-pup-development" element={<WolfGuidePupDevelopment />} />
        <Route path="*" element={<div className="text-center mt-20">Page not found</div>} />
      </Route>
    </Routes>
    </BackgroundProvider>
  );
};

export default App;
