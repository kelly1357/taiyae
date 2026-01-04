import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Region from './pages/Region';
import ThreadView from './pages/ThreadView';
import CharacterManagement from './pages/CharacterManagement';
import Login from './pages/Login';
import { mockCharacters } from './data/mockData';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
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

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  // Mock active character for now if not in user object
  const activeCharacter = mockCharacters.find(c => c.id === user.activeCharacterId) || mockCharacters[0];

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} activeCharacter={activeCharacter} onLogout={handleLogout} />}>
        <Route index element={<Home />} />
        <Route path="region/:regionId" element={<Region />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="manage-characters" element={<CharacterManagement user={user} />} />
        <Route path="*" element={<div className="text-center mt-20">Page not found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
