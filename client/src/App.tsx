import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Region from './pages/Region';
import RegionDirectory from './pages/RegionDirectory';
import ThreadView from './pages/ThreadView';
import CharacterManagement from './pages/CharacterManagement';
import Characters from './pages/Characters';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import type { User, Character } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  // Determine active character
  // 1. Try to find character matching activeCharacterId
  // 2. If not found (or no activeCharacterId), default to the first character
  // 3. If no characters, undefined
  const activeCharacter = userCharacters.find(c => String(c.id) === String(user.activeCharacterId)) 
    || (userCharacters.length > 0 ? userCharacters[0] : undefined);

  // If we defaulted to the first character but activeCharacterId wasn't set, update it
  if (activeCharacter && String(activeCharacter.id) !== String(user.activeCharacterId)) {
     // We avoid calling setUser here to prevent render loop, but we could sync it if needed.
     // For now, just passing the derived activeCharacter is enough for display.
  }

  return (
    <Routes>
      <Route path="/" element={
        <Layout 
          user={user} 
          activeCharacter={activeCharacter} 
          userCharacters={userCharacters}
          onLogout={handleLogout} 
          onCharacterSelect={handleCharacterSelect}
        />
      }>
        <Route index element={<Home />} />
        <Route path="regions" element={<RegionDirectory />} />
        <Route path="region/:regionId" element={<Region />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="characters" element={<Characters />} />
        <Route path="my-characters" element={<CharacterManagement user={user} />} />
        <Route path="account" element={<UserManagement user={user} onUpdateUser={handleUpdateUser} />} />
        <Route path="*" element={<div className="text-center mt-20">Page not found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
