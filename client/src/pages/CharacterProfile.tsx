import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Character, ThreadlogEntry } from '../types';

const CharacterProfile: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [threadlog, setThreadlog] = useState<ThreadlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'character' | 'player' | 'threadlog'>('character');
  const [imageError, setImageError] = useState(false);

  // Reset imageError when character changes
  useEffect(() => {
    setImageError(false);
  }, [characterId]);

  useEffect(() => {
    if (!characterId) return;
    
    fetch('/api/characters')
      .then(res => res.json())
      .then((data: Character[]) => {
        const found = data.find(c => String(c.id) === characterId);
        setCharacter(found || null);
        // Get all characters belonging to the same user
        if (found) {
          const foundUserId = (found as any).odUserId;
          const sameUserChars = data.filter(c => (c as any).odUserId === foundUserId);
          setUserCharacters(sameUserChars);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // Fetch threadlog
    fetch(`/api/characters/${characterId}/threadlog`)
      .then(res => res.json())
      .then((data: ThreadlogEntry[]) => {
        setThreadlog(data);
      })
      .catch(() => {});
  }, [characterId]);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!character) return <div className="text-center p-8">Character not found</div>;

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
        Character Profile
      </div>
      
      <div className="px-4 py-4">
        {/* Outer gray wrapper for avatar/placeholder/first table */}
        <div className="bg-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left column: Avatar + Info Table - wrapped in white */}
            <div className="w-full md:w-72 flex-shrink-0 bg-white p-3">
              {/* Avatar */}
              {character.imageUrl && character.imageUrl.trim() !== '' && !imageError ? (
                <img 
                  src={character.imageUrl} 
                  alt={character.name} 
                  className="w-full object-cover border border-gray-300"
                  style={{ aspectRatio: '526/364' }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div 
                  className="w-full bg-gray-200 border border-gray-300 flex items-center justify-center"
                  style={{ aspectRatio: '526/364' }}
                >
                  <img 
                    src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
                    alt="Placeholder" 
                    className="w-24 h-24 opacity-40"
                  />
                </div>
              )}
              
              {/* Character Info Table */}
              <div className="border border-gray-300 mt-[30px]">
                <table className="w-full text-sm">
                  <tbody>
                    {/* Row 1: Name & Pack */}
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-1/2">Name</td>
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 w-1/2">Pack</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.name}</td>
                      <td className="px-2 py-2">
                        {character.packName ? (
                          <span className="text-gray-700">{character.packName}</span>
                        ) : (
                          <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Row 2: Sex & Status */}
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">Sex</td>
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Status</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className={`px-2 py-2 border-r border-gray-300 ${character.sex === 'Male' ? 'text-blue-600' : character.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>
                        {character.sex}
                      </td>
                      <td className="px-2 py-2 text-gray-700">{character.healthStatus || 'Healthy'}</td>
                    </tr>
                    
                    {/* Row 3: Age & Skill Points */}
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">Age</td>
                      <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Skill Points</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.age}</td>
                      <td className="px-2 py-2 text-gray-700 font-bold">{character.totalSkill || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column: Placeholder Image */}
            <div className="flex-grow">
              <div 
                className="w-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500"
                style={{ aspectRatio: '790/661' }}
              >
                <span className="text-sm uppercase tracking-wide">Character Image Placeholder</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toggleable Section Links */}
        <div className="mt-4 bg-gray-100 p-4 text-center">
          <span 
            className={`text-sm font-bold cursor-pointer ${activeTab === 'character' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('character')}
          >
            Character Information
          </span>
          <span className="mx-2 text-gray-400">|</span>
          <span 
            className={`text-sm font-bold cursor-pointer ${activeTab === 'player' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('player')}
          >
            Player Information
          </span>
          <span className="mx-2 text-gray-400">|</span>
          <span 
            className={`text-sm font-bold cursor-pointer ${activeTab === 'threadlog' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('threadlog')}
          >
            Threadlog &amp; Skill Points
          </span>
        </div>
        
        {/* Character Information Section */}
        {activeTab === 'character' && (
          <div className="mt-4 bg-gray-100 p-4">
            <div className="bg-white p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left side: Character Information text */}
                <div className="flex-grow">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Character Information</h3>
                  {character.bio ? (
                    <div 
                      className="text-sm text-gray-700 html-description"
                      dangerouslySetInnerHTML={{ __html: character.bio }}
                    />
                  ) : (
                    <div className="text-sm text-gray-400 italic">No character information provided.</div>
                  )}
                </div>
                
                {/* Right side: Family/Details Table */}
                <div className="w-full md:w-72 flex-shrink-0">
                  <div className="border border-gray-300">
                    <table className="w-full text-sm">
                      <tbody>
                        {/* Height & Build */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-1/2">Height</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 w-1/2">Build</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.height || '—'}</td>
                          <td className="px-2 py-2 text-gray-700">{character.build || '—'}</td>
                        </tr>
                        
                        {/* Birthplace */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Birthplace</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2 text-gray-700" dangerouslySetInnerHTML={{ __html: character.birthplace || '—' }} />
                        </tr>
                        
                        {/* Father & Mother */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">Father</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Mother</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300" dangerouslySetInnerHTML={{ __html: character.father || '—' }} />
                          <td className="px-2 py-2 text-gray-700" dangerouslySetInnerHTML={{ __html: character.mother || '—' }} />
                        </tr>
                        
                        {/* Siblings */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Siblings</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2 text-gray-700" dangerouslySetInnerHTML={{ __html: character.siblings || '—' }} />
                        </tr>
                        
                        {/* Pups */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Pups</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-2 text-gray-700" dangerouslySetInnerHTML={{ __html: character.pups || '—' }} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Player Information Section */}
        {activeTab === 'player' && (
          <div className="mt-4 bg-gray-100 p-4">
            <div className="bg-white p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left side: Player Info Table */}
                <div className="w-full md:w-72 flex-shrink-0">
                  <div className="border border-gray-300">
                    <table className="w-full text-sm">
                      <tbody>
                        {/* Player & Member Since */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-1/2">Player</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 w-1/2">Member Since</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.username || '—'}</td>
                          <td className="px-2 py-2 text-gray-700">
                            {character.userCreatedAt 
                              ? new Date(character.userCreatedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                              : '—'}
                          </td>
                        </tr>
                        
                        {/* IC Posts & OOC Posts */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">IC Posts</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">OOC Posts</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.icPostCount ?? 0}</td>
                          <td className="px-2 py-2 text-gray-700">{character.oocPostCount ?? 0}</td>
                        </tr>
                        
                        {/* Contact & Characters */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">Contact</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Characters</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-0 text-gray-700 border-r border-gray-300">
                            {(() => {
                              const hasFacebook = !!character.facebook;
                              const hasInstagram = !!character.instagram;
                              const hasDiscord = !!character.discord;
                              const socialCount = [hasFacebook, hasInstagram, hasDiscord].filter(Boolean).length;
                              
                              // No social media - show em dash
                              if (socialCount === 0) {
                                return <div className="px-2 py-2">—</div>;
                              }
                              
                              // Only Facebook
                              if (hasFacebook && !hasInstagram && !hasDiscord) {
                                return (
                                  <div className="py-2 text-center">
                                    <a href={character.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-blue-600 transition-colors" title="Facebook">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                      </svg>
                                    </a>
                                  </div>
                                );
                              }
                              
                              // Only Instagram
                              if (!hasFacebook && hasInstagram && !hasDiscord) {
                                return (
                                  <div className="py-2 text-center">
                                    <a href={character.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-pink-600 transition-colors" title="Instagram">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                      </svg>
                                    </a>
                                  </div>
                                );
                              }
                              
                              // Only Discord
                              if (!hasFacebook && !hasInstagram && hasDiscord) {
                                return (
                                  <div className="py-2 text-center">
                                    <div className="inline-flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors cursor-default">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                                      </svg>
                                      <span className="text-sm">: {character.discord}</span>
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Facebook + Discord (no Instagram)
                              if (hasFacebook && !hasInstagram && hasDiscord) {
                                return (
                                  <table className="w-full border-collapse">
                                    <tbody>
                                      <tr className="border-b border-gray-300">
                                        <td className="py-2 text-center">
                                          <a href={character.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-blue-600 transition-colors" title="Facebook">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                            </svg>
                                          </a>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-center">
                                          <div className="inline-flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors cursor-default">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                                            </svg>
                                            <span className="text-sm">: {character.discord}</span>
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                );
                              }
                              
                              // Instagram + Discord (no Facebook)
                              if (!hasFacebook && hasInstagram && hasDiscord) {
                                return (
                                  <table className="w-full border-collapse">
                                    <tbody>
                                      <tr className="border-b border-gray-300">
                                        <td className="py-2 text-center">
                                          <a href={character.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-pink-600 transition-colors" title="Instagram">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                          </a>
                                        </td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-center">
                                          <div className="inline-flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors cursor-default">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                                            </svg>
                                            <span className="text-sm">: {character.discord}</span>
                                          </div>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                );
                              }
                              
                              // Facebook + Instagram (no Discord)
                              if (hasFacebook && hasInstagram && !hasDiscord) {
                                return (
                                  <table className="w-full border-collapse">
                                    <tbody>
                                      <tr>
                                        <td className="py-2 text-center border-r border-gray-300 w-1/2">
                                          <a href={character.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-blue-600 transition-colors" title="Facebook">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                            </svg>
                                          </a>
                                        </td>
                                        <td className="py-2 text-center w-1/2">
                                          <a href={character.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-pink-600 transition-colors" title="Instagram">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                          </a>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                );
                              }
                              
                              // All three - Facebook + Instagram row, Discord row below
                              return (
                                <table className="w-full border-collapse">
                                  <tbody>
                                    <tr className="border-b border-gray-300">
                                      <td className="py-2 text-center border-r border-gray-300 w-1/2">
                                        <a href={character.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-blue-600 transition-colors" title="Facebook">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                          </svg>
                                        </a>
                                      </td>
                                      <td className="py-2 text-center w-1/2">
                                        <a href={character.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex text-gray-600 hover:text-pink-600 transition-colors" title="Instagram">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                          </svg>
                                        </a>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={2} className="py-2 text-center">
                                        <div className="inline-flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition-colors cursor-default">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                                          </svg>
                                          <span className="text-sm">: {character.discord}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })()}
                          </td>
                          <td className="px-2 py-2 text-gray-700">
                            {userCharacters.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {userCharacters.map(c => (
                                  <Link 
                                    key={c.id} 
                                    to={`/character/${c.id}`}
                                    className="text-gray-700 hover:text-gray-900 hover:underline font-bold"
                                  >
                                    {c.name}
                                  </Link>
                                ))}
                              </div>
                            ) : '—'}
                          </td>
                        </tr>
                        
                        {/* Achievements */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Achievements</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-2 text-gray-700">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Right side: Player Information */}
                <div className="flex-grow">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Player Information</h3>
                  {character.playerInfo ? (
                    <div 
                      className="text-sm text-gray-700 html-description"
                      dangerouslySetInnerHTML={{ __html: character.playerInfo }}
                    />
                  ) : (
                    <div className="text-sm text-gray-400 italic">No player information provided.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Threadlog & Skill Points Section */}
        {activeTab === 'threadlog' && (
          <div className="mt-4 bg-gray-100 p-4">
            <div className="bg-white p-4">
              <h3 className="text-base font-bold text-gray-800 mb-3">Current Skill Points</h3>
              <div style={{ width: 'calc(50% + 100px)' }}>
                <div className="border border-gray-300">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-20">Experience</td>
                        <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-20">Knowledge</td>
                        <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-20">Physical</td>
                        <td rowSpan={2} className="px-4 py-2 text-gray-700 text-center align-middle w-40">
                          <span className="text-2xl font-bold">{character.totalSkill ?? 0}</span>
                          <span className="text-sm ml-1">SP</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 py-2 text-gray-700 border-r border-gray-300 w-20">{character.experience ?? 0}</td>
                        <td className="px-2 py-2 text-gray-700 border-r border-gray-300 w-20">{character.knowledge ?? 0}</td>
                        <td className="px-2 py-2 text-gray-700 border-r border-gray-300 w-20">{character.physical ?? 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Threadlog Table */}
              <div className="mt-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-gray-300">Thread</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-gray-300">Participants</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-gray-300">Replies</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-gray-300">Last Post</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-gray-300">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {threadlog.length > 0 ? (
                      threadlog.map((entry) => {
                        const lastPostDate = entry.lastPostDate ? new Date(entry.lastPostDate) : null;
                        const formattedDate = lastPostDate 
                          ? `${lastPostDate.getMonth() + 1}/${lastPostDate.getDate()}/${String(lastPostDate.getFullYear()).slice(-2)} ${lastPostDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}`
                          : '—';
                        
                        // Parse participants and their IDs for linking
                        const participantNames = entry.participants ? entry.participants.split(', ') : [];
                        const participantIds = entry.participantIds ? entry.participantIds.split(', ') : [];
                        
                        return (
                          <tr key={entry.threadId} className="border-b border-gray-200">
                            <td className="py-2 pr-4 text-gray-700">
                              <Link to={`/thread/${entry.threadId}`} className="hover:underline text-gray-800 font-bold">
                                {entry.threadTitle || 'Untitled Thread'}
                              </Link>
                            </td>
                            <td className="py-2 pr-4 text-gray-600">
                              {participantNames.map((name, idx) => (
                                <span key={idx}>
                                  {idx > 0 && ', '}
                                  <Link 
                                    to={`/character/${participantIds[idx]}`} 
                                    className="hover:underline text-gray-800 font-bold"
                                  >
                                    {name}
                                  </Link>
                                </span>
                              ))}
                            </td>
                            <td className="py-2 pr-4 text-gray-600">{entry.replyCount}</td>
                            <td className="py-2 pr-4 text-gray-600">
                              <div>
                                <Link 
                                  to={`/character/${entry.lastPosterId}`} 
                                  className="hover:underline text-gray-800 font-bold"
                                >
                                  {entry.lastPosterName}
                                </Link>
                              </div>
                              <div className="text-xs text-gray-500">{formattedDate}</div>
                            </td>
                            <td className="py-2 text-gray-600">—</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-gray-500 text-center">No threads yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <Link to="/characters" className="text-sm text-gray-600 hover:text-gray-900 hover:underline">
            ← Back to Character List
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CharacterProfile;
