import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import AbsenceIndicator from '../components/AbsenceIndicator';
import type { Character, ThreadlogEntry, User } from '../types';

interface LayoutContext {
  user?: User;
  activeCharacter?: Character;
}

interface SkillPointClaim {
  AssignmentID: number;
  ThreadID: number;
  CharacterID: number;
  Action: string;
  E: number;
  P: number;
  K: number;
  TOTAL: number;
  ThreadTitle?: string;
}

interface UserAchievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  AwardedAt: string;
}

interface PackOption {
  id: number;
  name: string;
  slug: string;
  color1: string;
  color2: string;
  ranks: { id: number; name: string; displayOrder: number }[];
}

const CharacterProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useOutletContext<LayoutContext>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [userCharacters, setUserCharacters] = useState<Character[]>([]);
  const [threadlog, setThreadlog] = useState<ThreadlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'character' | 'player' | 'threadlog'>('character');
  const [imageError, setImageError] = useState(false);
  const [activeProfileImage, setActiveProfileImage] = useState(0);
  const [expandedThreads, setExpandedThreads] = useState<Set<string | number>>(new Set());
  const [threadSummaries, setThreadSummaries] = useState<Record<number, string>>({});
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null);
  const [editingSummary, setEditingSummary] = useState<string>('');
  const [threadSkillPoints, setThreadSkillPoints] = useState<Record<number, SkillPointClaim[]>>({});
  const [showUndoConfirm, setShowUndoConfirm] = useState<SkillPointClaim | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  
  // Moderator edit state
  const [showModeratorEdit, setShowModeratorEdit] = useState(false);
  const [modEditForm, setModEditForm] = useState({ name: '', sex: 'Male' as 'Male' | 'Female' | 'Other', years: 0, months: 0, status: 'Active' as 'Active' | 'Inactive' | 'Dead', packId: null as number | null, packRankId: null as number | null });
  const [isModeratorSaving, setIsModeratorSaving] = useState(false);
  const [packOptions, setPackOptions] = useState<PackOption[]>([]);
  
  // User achievements state
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  // Check if logged-in user owns this character
  const isOwner = user && character && (
    Number(user.id) === Number((character as any).odUserId)
  );

  // Debug log
  console.log('isOwner check:', { userId: user?.id, charOdUserId: (character as any)?.odUserId, isOwner });

  const toggleThreadExpanded = (threadId: string | number) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const startEditingSummary = (threadId: number) => {
    setEditingThreadId(threadId);
    setEditingSummary(threadSummaries[threadId] || '');
  };

  const saveSummary = async (threadId: number) => {
    const summaryText = editingSummary.trim();
    if (!character) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/characters/${character.id}/thread-summaries/${threadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ summary: summaryText })
      });
      
      if (response.ok) {
        setThreadSummaries(prev => ({
          ...prev,
          [threadId]: summaryText
        }));
      }
    } catch (error) {
      console.error('Failed to save summary:', error);
    }
    
    setEditingThreadId(null);
    setEditingSummary('');
  };

  const cancelEditingSummary = () => {
    setEditingThreadId(null);
    setEditingSummary('');
  };

  const handleUndoApproval = async (claim: SkillPointClaim) => {
    if (!user) return;
    
    setIsUndoing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skill-points-undo/${claim.AssignmentID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        // Remove from local state
        setThreadSkillPoints(prev => {
          const updated = { ...prev };
          if (updated[claim.ThreadID]) {
            updated[claim.ThreadID] = updated[claim.ThreadID].filter(
              sp => sp.AssignmentID !== claim.AssignmentID
            );
            if (updated[claim.ThreadID].length === 0) {
              delete updated[claim.ThreadID];
            }
          }
          return updated;
        });
        setShowUndoConfirm(null);
      } else {
        const error = await response.text();
        alert(error || 'Failed to undo approval');
      }
    } catch (error) {
      console.error('Error undoing approval:', error);
      alert('Failed to undo approval');
    } finally {
      setIsUndoing(false);
    }
  };

  // Open moderator edit modal
  const openModeratorEdit = async () => {
    if (character) {
      const totalMonths = (character as any).monthsAge || 0;
      const charStatus = (character as any).status || 'Active';
      const charPackId = (character as any).packId || null;
      const charPackRankId = (character as any).packRankId || null;
      
      setModEditForm({
        name: character.name || '',
        sex: character.sex || '',
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
        status: charStatus,
        packId: charPackId,
        packRankId: charPackRankId
      });
      
      // Fetch packs if not already loaded
      if (packOptions.length === 0) {
        try {
          const res = await fetch('/api/packs');
          if (res.ok) {
            const packs = await res.json();
            setPackOptions(packs.filter((p: PackOption) => p.id)); // Filter out any invalid packs
          }
        } catch (error) {
          console.error('Error fetching packs:', error);
        }
      }
      
      setShowModeratorEdit(true);
    }
  };

  // Save moderator edits
  const saveModeratorEdit = async () => {
    console.log('saveModeratorEdit called', { character: !!character, user: !!user, userId: user?.id });
    if (!character || !user) {
      console.log('Exiting early - character or user is missing');
      return;
    }
    
    const totalMonths = modEditForm.years * 12 + modEditForm.months;
    
    const payload = {
      name: modEditForm.name,
      sex: modEditForm.sex,
      monthsAge: totalMonths,
      status: modEditForm.status,
      packId: modEditForm.packId,
      packRankId: modEditForm.packRankId,
      userId: user.id
    };
    
    console.log('Saving moderator edit with payload:', payload);
    
    setIsModeratorSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/characters/${character.id}/moderator-edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status, response.statusText);

      if (response.ok) {
        console.log('Update successful!');
        // Get pack info for display
        const selectedPack = packOptions.find(p => p.id === modEditForm.packId);
        const selectedRank = selectedPack?.ranks.find(r => r.id === modEditForm.packRankId);
        
        // Update local character state
        setCharacter(prev => prev ? {
          ...prev,
          name: modEditForm.name,
          sex: modEditForm.sex,
          monthsAge: totalMonths,
          status: modEditForm.status,
          packId: modEditForm.packId?.toString(),
          packName: selectedPack?.name,
          packSlug: selectedPack?.slug,
          packColor1: selectedPack?.color1,
          packColor2: selectedPack?.color2,
          packRankName: selectedRank?.name
        } : null);
        setShowModeratorEdit(false);
      } else {
        const error = await response.text();
        console.error('Update failed - Status:', response.status, 'Body:', error);
        alert(error || 'Failed to update character');
      }
    } catch (error) {
      console.error('Error updating character:', error);
      alert('Failed to update character');
    } finally {
      setIsModeratorSaving(false);
    }
  };

  // Reset imageError when character changes
  useEffect(() => {
    setImageError(false);
    setActiveProfileImage(0);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    
    // Determine if the param is a numeric ID or a slug
    const isNumeric = /^\d+$/.test(slug);
    const queryParam = isNumeric ? `characterId=${slug}` : `characterSlug=${slug}`;
    
    // Fetch the specific character by slug or ID (works for inactive/dead characters too)
    fetch(`/api/characters?${queryParam}`)
      .then(res => res.json())
      .then((data: Character[]) => {
        let found = data[0] || null;
        
        // If not found by slug, try by ID as fallback
        if (!found && !isNumeric) {
          return fetch(`/api/characters?characterId=${slug}`)
            .then(res => res.json())
            .then((fallbackData: Character[]) => {
              found = fallbackData[0] || null;
              return found;
            });
        }
        return found;
      })
      .then((found: Character | null) => {
        setCharacter(found);
        // Get all characters belonging to the same user
        if (found) {
          const foundUserId = (found as any).odUserId;
          // Fetch user's other characters separately (only active ones)
          fetch(`/api/characters?userId=${foundUserId}`)
            .then(res => res.json())
            .then((userChars: Character[]) => {
              // Filter out inactive and dead characters
              const activeChars = userChars.filter(c => c.status === 'Active');
              setUserCharacters(activeChars);
            })
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  // Fetch additional data once we have the character
  useEffect(() => {
    if (!character) return;
    const characterId = character.id;
    
    // Fetch threadlog
    fetch(`/api/characters/${characterId}/threadlog`)
      .then(res => res.json())
      .then((data: ThreadlogEntry[]) => {
        setThreadlog(data);
      })
      .catch(() => {});
    
    // Fetch thread summaries
    fetch(`/api/characters/${characterId}/thread-summaries`)
      .then(res => res.json())
      .then((data: Record<number, string>) => {
        setThreadSummaries(data);
      })
      .catch(() => {});
    
    // Fetch approved skill points for this character
    fetch(`/api/character-skill-points/${characterId}`)
      .then(res => res.json())
      .then((data: SkillPointClaim[]) => {
        console.log('Skill points API response:', data);
        if (!Array.isArray(data)) {
          console.error('Expected array, got:', typeof data, data);
          return;
        }
        // Group by thread ID
        const grouped: Record<number, SkillPointClaim[]> = {};
        data.forEach(claim => {
          if (!grouped[claim.ThreadID]) {
            grouped[claim.ThreadID] = [];
          }
          grouped[claim.ThreadID].push(claim);
        });
        console.log('Grouped skill points:', grouped);
        setThreadSkillPoints(grouped);
      })
      .catch((err) => console.error('Failed to fetch skill points:', err));
  }, [character]);

  // Fetch user achievements when character data is available
  useEffect(() => {
    if (!character) return;
    const userId = (character as any).odUserId;
    console.log('CharacterProfile: Fetching achievements for userId:', userId, 'character:', character.name);
    if (!userId) return;

    // Check for automated achievements first
    fetch('/api/achievements/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).catch(() => {});

    // Then fetch user achievements
    fetch(`/api/achievements/user/${userId}`)
      .then(res => res.json())
      .then((data: UserAchievement[]) => {
        console.log('CharacterProfile: Got achievements:', data);
        setUserAchievements(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('CharacterProfile: Failed to fetch achievements:', err));
  }, [character]);

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
              
              {/* Status label for inactive/dead characters */}
              {character.status && character.status !== 'Active' && (
                <div className="text-center text-gray-500 italic text-sm mt-3 -mb-4">
                  {character.status}
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
                      <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.name}{character.surname ? ` ${character.surname}` : ''}</td>
                      <td className="px-2 py-2">
                        {character.packName ? (
                          <Link to={`/pack/${character.packSlug}`} className="hover:opacity-80 block">
                            <span 
                              className="uppercase tracking-wide"
                              style={{ 
                                fontFamily: 'Baskerville, "Times New Roman", serif',
                                background: `linear-gradient(to right, ${character.packColor1 || '#666'}, ${character.packColor2 || character.packColor1 || '#666'})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                              }}
                            >
                              {character.packName}
                            </span>
                            {character.packRankName && (
                              <span className="block text-xs text-gray-600">{character.packRankName}</span>
                            )}
                          </Link>
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
                    <tr className={character.status === 'Dead' ? 'border-b border-gray-300' : ''}>
                      <td className="px-2 py-2 text-gray-700 border-r border-gray-300">{character.age}</td>
                      <td className="px-2 py-2 text-gray-700 font-bold">{character.totalSkill || 0}</td>
                    </tr>
                    
                    {/* Row 4: Death Date (only for dead characters) */}
                    {character.status === 'Dead' && (
                      <>
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">Death Date</td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-2 text-gray-700">{character.deathDate || 'Unknown'}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Moderator Edit Button */}
              {(user?.isModerator || user?.isAdmin) && (
                <div className="mt-1 flex justify-end">
                  <button
                    onClick={openModeratorEdit}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    ✎ Edit Character
                  </button>
                </div>
              )}
            </div>

            {/* Right column: Profile Images */}
            <div className="flex-grow">
              {character.profileImages && character.profileImages.length > 0 ? (
                <div className="relative">
                  <img
                    src={character.profileImages[activeProfileImage]}
                    alt={`${character.name} profile ${activeProfileImage + 1}`}
                    className="w-full object-cover border border-gray-300"
                    style={{ aspectRatio: '790/661' }}
                  />
                  {character.profileImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {character.profileImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveProfileImage(index)}
                          className={`w-6 h-6 text-xs font-bold rounded ${
                            activeProfileImage === index
                              ? 'bg-white text-gray-900 shadow'
                              : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="w-full bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500"
                  style={{ aspectRatio: '790/661' }}
                >
                  <span className="text-sm uppercase tracking-wide">Character Image Placeholder</span>
                </div>
              )}
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
                        <tr className="border-b border-gray-300">
                          <td colSpan={2} className="px-2 py-2 text-gray-700" dangerouslySetInnerHTML={{ __html: character.pups || '—' }} />
                        </tr>
                        
                        {/* Spirit Symbol & Emblems */}
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 border-r border-gray-300 w-1/2">Spirit Symbol</td>
                          <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600 w-1/2">Emblems</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300 text-center">
                            {character.spiritSymbol ? (
                              <img 
                                src={`https://taiyaefiles.blob.core.windows.net/web/${character.spiritSymbol}_d.png`}
                                alt={character.spiritSymbol}
                                className="w-8 h-8 object-contain inline-block"
                                title={character.spiritSymbol.charAt(0).toUpperCase() + character.spiritSymbol.slice(1)}
                              />
                            ) : '—'}
                          </td>
                          <td className="px-2 py-2 text-gray-700 text-center">—</td>
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
                          <td className="px-2 py-2 text-gray-700 border-r border-gray-300">
                            <span className="flex items-center gap-1.5">
                              {character.username || '—'}
                              {(character.isModerator || character.isAdmin) && (
                                <span className="bg-gray-200 text-gray-600 px-1 py-0.5 text-[10px] uppercase font-semibold">Staff</span>
                              )}
                              {(character.isAbsent === true || (character as any).isAbsent === 1) && (
                                <AbsenceIndicator absenceNote={(character as any).absenceNote} />
                              )}
                            </span>
                          </td>
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
                                    to={`/character/${c.slug || c.id}`}
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
                          <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-xs text-gray-600">
                            Achievements
                            <Link to="/achievements" className="ml-1 text-gray-500 hover:text-gray-700" title="Request achievements">(?)</Link>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={2} className="px-2 py-3">
                            {userAchievements.length > 0 ? (
                              <div className="flex flex-wrap gap-3">
                                {userAchievements.map(ach => (
                                  <div 
                                    key={ach.id} 
                                    className="relative group"
                                    title={`${ach.name}: ${ach.description}`}
                                  >
                                    <img 
                                      src={ach.imageUrl || '/achievements/default.png'} 
                                      alt={ach.name}
                                      className="w-8 h-8 rounded-full border border-gray-300"
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                      {ach.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">No achievements yet</span>
                            )}
                          </td>
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
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-black/40">Thread</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-black/40">Participants</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-black/40">Replies</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-black/40">Last Post</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wide font-normal pb-1 border-b border-black/40">Details</th>
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
                        const isExpanded = expandedThreads.has(entry.threadId);
                        
                        return (
                          <React.Fragment key={entry.threadId}>
                            <tr className={`${isExpanded ? '' : 'border-b border-black/40'}`}>
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
                              <td className="py-2 text-gray-600 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {threadSkillPoints[entry.threadId]?.length > 0 && (
                                    <span className="text-xs font-semibold text-gray-700">
                                      {threadSkillPoints[entry.threadId].reduce((sum, sp) => sum + sp.TOTAL, 0)} SP
                                    </span>
                                  )}
                                  <button
                                    onClick={() => toggleThreadExpanded(entry.threadId)}
                                    className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 hover:bg-gray-300 transition-colors"
                                  >
                                    <svg 
                                      className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-black/40">
                                <td colSpan={5} className="py-0 pb-2">
                                  <table className="w-full text-sm border border-gray-300">
                                    <thead>
                                      <tr className="bg-gray-200">
                                        <th className="text-left text-xs text-gray-600 uppercase tracking-wide font-semibold px-3 py-2 border-r border-gray-300 w-1/2">Summary</th>
                                        <th className="text-left text-xs text-gray-600 uppercase tracking-wide font-semibold px-3 py-2 border-r border-gray-300 w-1/3">
                                          Earned SP ({threadSkillPoints[entry.threadId]?.reduce((sum, sp) => sum + sp.TOTAL, 0) || 0})
                                        </th>
                                        <th className="text-center text-xs text-gray-600 uppercase tracking-wide font-semibold px-2 py-2 border-r border-gray-300 w-[5.5%]">E</th>
                                        <th className="text-center text-xs text-gray-600 uppercase tracking-wide font-semibold px-2 py-2 border-r border-gray-300 w-[5.5%]">P</th>
                                        <th className="text-center text-xs text-gray-600 uppercase tracking-wide font-semibold px-2 py-2 w-[5.5%]">K</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr className="border-t border-gray-300">
                                        <td className="px-3 py-3 border-r border-gray-300">
                                          {editingThreadId === entry.threadId ? (
                                            <div className="space-y-2">
                                              <textarea
                                                value={editingSummary}
                                                onChange={(e) => setEditingSummary(e.target.value)}
                                                className="w-full h-24 p-2 border border-gray-300 text-sm text-black resize-none focus:outline-none focus:border-gray-400"
                                                placeholder="Enter thread summary (HTML allowed)..."
                                              />
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => saveSummary(entry.threadId)}
                                                  className="px-3 py-1 bg-[#2f3a2f] text-white text-xs hover:bg-[#3a4a3a] transition-colors"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={cancelEditingSummary}
                                                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs hover:bg-gray-400 transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              {threadSummaries[entry.threadId] ? (
                                                <div 
                                                  className="text-gray-700"
                                                  dangerouslySetInnerHTML={{ __html: threadSummaries[entry.threadId] }}
                                                />
                                              ) : (
                                                <span className="text-gray-500 italic">Coming soon</span>
                                              )}
                                              {isOwner && (
                                                <button
                                                  onClick={() => startEditingSummary(entry.threadId)}
                                                  className="mt-2 text-xs text-gray-500 hover:text-gray-700 hover:underline block"
                                                >
                                                  Edit
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-gray-700 border-r border-gray-300">
                                          {threadSkillPoints[entry.threadId]?.length > 0 ? (
                                            <div className="space-y-5">
                                              {threadSkillPoints[entry.threadId].map((sp, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-2">
                                                  <span>{sp.Action}</span>
                                                  {(user?.isModerator || user?.isAdmin) && (
                                                    <button
                                                      onClick={() => setShowUndoConfirm(sp)}
                                                      className="text-xs text-gray-400 hover:text-red-600"
                                                      title="Undo approval"
                                                    >
                                                      ✕
                                                    </button>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-gray-500">—</span>
                                          )}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-gray-300">
                                          {threadSkillPoints[entry.threadId]?.length > 0 ? (
                                            <span className="text-gray-700">{threadSkillPoints[entry.threadId].reduce((sum, sp) => sum + sp.E, 0)}</span>
                                          ) : (
                                            <span className="text-gray-500">—</span>
                                          )}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-gray-300">
                                          {threadSkillPoints[entry.threadId]?.length > 0 ? (
                                            <span className="text-gray-700">{threadSkillPoints[entry.threadId].reduce((sum, sp) => sum + sp.P, 0)}</span>
                                          ) : (
                                            <span className="text-gray-500">—</span>
                                          )}
                                        </td>
                                        <td className="px-2 py-3 text-center">
                                          {threadSkillPoints[entry.threadId]?.length > 0 ? (
                                            <span className="text-gray-700">{threadSkillPoints[entry.threadId].reduce((sum, sp) => sum + sp.K, 0)}</span>
                                          ) : (
                                            <span className="text-gray-500">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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

      {/* Undo Approval Confirmation Modal */}
      {showUndoConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Undo Skill Point Approval</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to undo this approval? This will:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li>Remove {showUndoConfirm.E > 0 ? `${showUndoConfirm.E} Experience` : ''}{showUndoConfirm.P > 0 ? `${showUndoConfirm.E > 0 ? ', ' : ''}${showUndoConfirm.P} Physical` : ''}{showUndoConfirm.K > 0 ? `${(showUndoConfirm.E > 0 || showUndoConfirm.P > 0) ? ', ' : ''}${showUndoConfirm.K} Knowledge` : ''} point(s) from the character</li>
              <li>Set the claim back to pending status</li>
            </ul>
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Thread:</strong> {showUndoConfirm.ThreadTitle || `Thread #${showUndoConfirm.ThreadID}`}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUndoConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isUndoing}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUndoApproval(showUndoConfirm)}
                disabled={isUndoing}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
              >
                {isUndoing ? 'Undoing...' : 'Undo Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderator Edit Character Modal */}
      {showModeratorEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Character</h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={modEditForm.name}
                  onChange={(e) => setModEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>

              {/* Sex */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Sex</label>
                <select
                  value={modEditForm.sex}
                  onChange={(e) => setModEditForm(prev => ({ ...prev, sex: e.target.value as 'Male' | 'Female' | 'Other' }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Age</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <select
                      value={modEditForm.years}
                      onChange={(e) => setModEditForm(prev => ({ ...prev, years: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      {Array.from({ length: 21 }, (_, i) => (
                        <option key={i} value={i}>{i} year{i !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select
                      value={modEditForm.months}
                      onChange={(e) => setModEditForm(prev => ({ ...prev, months: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{i} month{i !== 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Status</label>
                <select
                  value={modEditForm.status}
                  onChange={(e) => setModEditForm(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' | 'Dead' }))}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Dead">Dead</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {modEditForm.status === 'Inactive' && 'Character will not appear in active character lists.'}
                  {modEditForm.status === 'Dead' && 'Character is permanently deceased and cannot post.'}
                  {modEditForm.status === 'Active' && 'Character is active and can participate in roleplay.'}
                </p>
              </div>

              {/* Pack */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Pack</label>
                <select
                  value={modEditForm.packId ?? ''}
                  onChange={(e) => {
                    const newPackId = e.target.value ? parseInt(e.target.value) : null;
                    setModEditForm(prev => ({ ...prev, packId: newPackId, packRankId: null }));
                  }}
                  className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="">No Pack (Rogue)</option>
                  {packOptions.filter(p => p.id).map(pack => (
                    <option key={pack.id} value={pack.id}>{pack.name}</option>
                  ))}
                </select>
              </div>

              {/* Pack Rank */}
              {modEditForm.packId && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">Pack Rank</label>
                  <select
                    value={modEditForm.packRankId ?? ''}
                    onChange={(e) => setModEditForm(prev => ({ ...prev, packRankId: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value="">Unranked</option>
                    {packOptions.find(p => p.id === modEditForm.packId)?.ranks.map(rank => (
                      <option key={rank.id} value={rank.id}>{rank.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModeratorEdit(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isModeratorSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveModeratorEdit}
                disabled={isModeratorSaving || !modEditForm.name.trim()}
                className="px-4 py-2 bg-[#2f3a2f] text-white rounded hover:bg-[#3a4a3a] disabled:opacity-50"
              >
                {isModeratorSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CharacterProfile;
