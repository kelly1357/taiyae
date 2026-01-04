import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Region from './pages/Region';
import ThreadView from './pages/ThreadView';
import CharacterManagement from './pages/CharacterManagement';
import { mockUsers, mockCharacters } from './data/mockData';

const App: React.FC = () => {
  // Mock logged in user state
  const user = mockUsers[0];
  const activeCharacter = mockCharacters.find(c => c.id === user.activeCharacterId);

  return (
    <Routes>
      <Route path="/" element={<Layout user={user} activeCharacter={activeCharacter} />}>
        <Route index element={<Home />} />
        <Route path="region/:regionId" element={<Region />} />
        <Route path="thread/:threadId" element={<ThreadView />} />
        <Route path="manage-characters" element={<CharacterManagement user={user} />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<div className="text-center mt-20">Page not found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
