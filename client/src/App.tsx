import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { BackgroundProvider } from './contexts/BackgroundContext';
import { SignalRProvider } from './contexts/SignalRContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import { useUser } from './contexts/UserContext';
import Home from './pages/Home';
import Region from './pages/Region';
import Subarea from './pages/Subarea';
import PackPage from './pages/PackPage';
import Rogues from './pages/Rogues';
import OOCForumPage from './pages/OOCForum';
import OOCForums from './pages/OOCForums';
import RegionDirectory from './pages/RegionDirectory';
import ThreadView from './pages/ThreadView';
import CharacterManagement from './pages/CharacterManagement';
import CharacterProfile from './pages/CharacterProfile';
import Characters from './pages/Characters';
import UserManagement from './pages/UserManagement';
import SpiritSymbolQuiz from './pages/SpiritSymbolQuiz';
import Weather from './pages/Weather';
import SkillPointsApproval from './pages/SkillPointsApproval';
import PlotNews from './pages/PlotNews';
import UserAchievements from './pages/Achievements';
import AchievementAdmin from './pages/AchievementAdmin';
import Adopt from './pages/Adopt';
import HomepageAdmin from './pages/HomepageAdmin';
import SitewideUpdates from './pages/SitewideUpdates';
import ActivityTracker from './pages/ActivityTracker';
import InactiveCharacters from './pages/InactiveCharacters';
import DeadCharacters from './pages/DeadCharacters';
import Birthdays from './pages/Birthdays';
import StaffPingsAdmin from './pages/StaffPingsAdmin';
import UserApprovalsAdmin from './pages/UserApprovalsAdmin';
import PackAdmin from './pages/PackAdmin';
import Conversations from './pages/Conversations';
import StartingSkillPoints from './pages/StartingSkillPoints';
import ConfirmEmail from './pages/ConfirmEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
  TitleList,
  UserWikiPage,
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
  const [charactersLoaded, setCharactersLoaded] = useState(false);

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
                const isAbsent = data.Is_Absent === true || data.Is_Absent === 1 || data.isAbsent === true;
                // Map UserStatusID to status name (1=Joining, 2=Joined, 3=Banned)
                const statusMap: Record<number, string> = { 1: 'Joining', 2: 'Joined', 3: 'Banned' };
                const userStatus = data.UserStatusID != null ? (statusMap[data.UserStatusID] || 'Joined') : (parsedUser.userStatus || 'Joined');
                const refreshedUser = {
                  ...parsedUser,
                  imageUrl: data.ImageURL || data.imageUrl || parsedUser.imageUrl || '',
                  playerInfo: data.Description || data.playerInfo || parsedUser.playerInfo || '',
                  facebook: data.Facebook || data.facebook || parsedUser.facebook || '',
                  instagram: data.Instagram || data.instagram || parsedUser.instagram || '',
                  discord: data.Discord || data.discord || parsedUser.discord || '',
                  isModerator,
                  isAdmin,
                  isAbsent,
                  absenceNote: data.Absence_Note || data.absenceNote || parsedUser.absenceNote || '',
                  role: isModerator ? 'moderator' : 'member',
                  userStatus,
                  userStatusId: data.UserStatusID ?? parsedUser.userStatusId ?? 2,
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
      setCharactersLoaded(false);
      fetch(`/api/characters?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          setUserCharacters(data);
          setCharactersLoaded(true);
        })
        .catch(err => {
          console.error("Failed to fetch user characters", err);
          setCharactersLoaded(true);
        });
    } else {
      setUserCharacters([]);
      setCharactersLoaded(true);
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
    <SignalRProvider user={user} userCharacters={userCharacters}>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={
        <Layout 
          user={user ?? undefined}
          activeCharacter={activeCharacter}
          userCharacters={userCharacters}
          charactersLoaded={charactersLoaded}
          onlineCharacters={onlineCharacters}
          onLogout={handleLogout}
          onCharacterSelect={handleCharacterSelect}
          onLogin={handleLogin}
        />
      }>
        <Route index element={<Home />} />
        <Route path="regions" element={<RegionDirectory />} />
        <Route path="region/:regionId" element={<Region />} />
        <Route path="subarea/:subareaId" element={<Subarea />} />
        <Route path="pack/:packSlug" element={<PackPage />} />
        <Route path="rogues" element={<Rogues />} />
        <Route path="ooc" element={<OOCForums />} />
        <Route path="ooc-forum/:forumId" element={<OOCForumPage />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="characters" element={<Characters />} />
        <Route path="memorial" element={<DeadCharacters />} />
        <Route path="adopt" element={<Adopt />} />
        <Route path="activity-tracker" element={<ActivityTracker />} />
        <Route path="birthdays" element={<Birthdays />} />
        <Route path="character/:slug" element={<CharacterProfile />} />
        <Route path="my-characters" element={user ? <CharacterManagement user={user} /> : (
          <section className="bg-white border border-gray-300 shadow">
            <div className="bg-[#2f3a2f] px-4 py-2 dark-header">
              <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Character Management</h2>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm text-gray-700">To create a character, you must use the sidebar on the left to create an account and login first.</p>
            </div>
          </section>
        )} />
        <Route path="account" element={user ? <UserManagement user={user} onUpdateUser={handleUpdateUser} /> : <div className="text-center mt-20">Please log in to manage your account.</div>} />
        <Route path="weather" element={<Weather />} />
        <Route path="plot-news" element={<PlotNews />} />
        <Route path="sitewide-updates" element={<SitewideUpdates />} />
        <Route path="achievements" element={<UserAchievements />} />
        <Route path="starting-skill-points" element={<StartingSkillPoints />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="admin/skill-points" element={<SkillPointsApproval />} />
        <Route path="admin/staff-pings" element={<StaffPingsAdmin />} />
        <Route path="admin/user-approvals" element={<UserApprovalsAdmin />} />
        <Route path="admin/achievements" element={<AchievementAdmin />} />
        <Route path="admin/packs" element={<PackAdmin />} />
        <Route path="admin/homepage" element={<HomepageAdmin />} />
        <Route path="admin/inactive-characters" element={user ? <InactiveCharacters user={user} /> : <div className="text-center mt-20">Please log in to access this page.</div>} />
        <Route path="confirm-email" element={<ConfirmEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
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
        <Route path="wiki/title-list" element={<TitleList />} />
        <Route path="wiki/user/:slug" element={<UserWikiPage />} />
        <Route path="wiki/using-tags" element={<UsingTags />} />
        <Route path="wiki/wolf-guide" element={<WolfGuide />} />
        <Route path="wiki/wolf-guide-fighting" element={<WolfGuideFighting />} />
        <Route path="wiki/wolf-guide-pup-development" element={<WolfGuidePupDevelopment />} />
        <Route path="*" element={<div className="text-center mt-20">Page not found</div>} />
      </Route>
    </Routes>
    </SignalRProvider>
    </BackgroundProvider>
  );
};

export default App;
