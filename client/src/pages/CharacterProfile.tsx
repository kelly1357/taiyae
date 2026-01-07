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
              <img 
                src={character.imageUrl} 
                alt={character.name} 
                className="w-full object-cover border border-gray-300"
                style={{ aspectRatio: '526/364' }}
              />
              
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
        {activeTab === 'character' && character.bio && (
          <div className="mt-4 bg-gray-100 p-4">
            <div className="bg-white p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left side: Character Information text */}
                <div className="flex-grow">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Character Information</h3>
                  <div 
                    className="text-sm text-gray-700 html-description"
                    dangerouslySetInnerHTML={{ __html: character.bio }}
                  />
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
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">—</td>
                          <td className="px-2 py-2 text-gray-700">—</td>
                        </tr>
                        
                        {/* Birthplace */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Birthplace</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2 text-gray-700">—</td>
                        </tr>
                        
                        {/* Father & Mother */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300">Father</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Mother</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">—</td>
                          <td className="px-2 py-2 text-gray-700">—</td>
                        </tr>
                        
                        {/* Siblings */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Siblings</td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2 text-gray-700">—</td>
                        </tr>
                        
                        {/* Pups */}
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Pups</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-2 text-gray-700">—</td>
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
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">—</td>
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
                
                {/* Right side: Coming soon */}
                <div className="flex-grow">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Player Information</h3>
                  <p className="text-sm text-gray-700">Coming soon.</p>
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
