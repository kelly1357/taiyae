import React, { useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useOutletContext, useLocation } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import AbsenceIndicator from '../components/AbsenceIndicator';
import { useBackground } from '../contexts/BackgroundContext';
import { useCustomPageTitle } from '../hooks/usePageTitle';
import type { Character, ForumRegion, User } from '../types';

// Helper type for the API response which flattens character/pack info
interface PostAuthor {
  id: string;
  slug?: string;
  name: string;
  surname?: string;
  imageUrl: string;
  packName?: string;
  packSlug?: string;
  packRankName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  rank?: string;
  sex?: string;
  age?: string;
  healthStatus?: string;
  characterStatus?: string;
  skillPoints?: number;
  isOnline?: boolean;
  playerName?: string;
  userId?: number;
  isModerator?: boolean;
  isAdmin?: boolean;
  isAbsent?: boolean;
  absenceNote?: string | null;
}

interface UserAchievement {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  AwardedAt: string;
}

// OOC Player info panel component
import { fetchUserById } from '../data/fetchUserById';

const OOCPlayerInfoPanel: React.FC<{ 
  playerName: string; 
  userId: number; 
  isOriginalPost?: boolean;
}> = ({ playerName, userId, isOriginalPost }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    if (!userId) return;
    setUserLoading(true);
    fetchUserById(userId)
      .then(u => {
        setUser(u);
        setUserLoading(false);
      })
      .catch(() => setUserLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/characters?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        // Filter to only active characters (not Inactive or Dead)
        const activeChars = data.filter((c: Character) => c.status === 'Active');
        setCharacters(activeChars);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/achievements/user/${userId}`)
      .then(res => res.json())
      .then((data: UserAchievement[]) => {
        setAchievements(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [userId]);

  return (
    <div className={`w-full md:w-72 shrink-0 bg-white p-3 flex flex-col ${isOriginalPost ? 'md:order-2' : ''}`}>
      {/* Avatar - same width as table, rectangular like character panel */}
      <div className="mb-2 w-full">
        {userLoading ? (
          <div 
            className="w-full bg-gray-200 animate-pulse border border-gray-300"
            style={{ aspectRatio: '526/364' }}
          />
        ) : user && user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.username || playerName || 'User Avatar'}
            className="w-full object-cover border-2 border-gray-300"
            style={{ aspectRatio: '526/364' }}
          />
        ) : (
          <div 
            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center"
            style={{ aspectRatio: '526/364' }}
          >
            <img 
              src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
              alt="Placeholder" 
              className="w-16 h-16 opacity-30"
            />
          </div>
        )}
      </div>

      {/* Status text if user is Joining */}
      {user?.userStatus === 'Joining' && (
        <div className="text-sm italic text-gray-500 mb-2 text-center">
          Joining
        </div>
      )}

      {/* Player section */}
      <table className="w-full text-xs border border-gray-300 mb-2">
        <tbody>
          <tr>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 text-center" style={{ backgroundColor: '#f2f2f2' }}>Player</td>
          </tr>
          <tr>
            <td className="px-2 py-2 text-gray-700">
              <div className="flex items-center justify-center gap-1">
                <span>{playerName || 'Unknown'}</span>
                {user && (user.isModerator || user.isAdmin) && (
                  <span className="bg-gray-200 text-gray-600 px-1 py-0.5 text-[10px] uppercase font-semibold">Staff</span>
                )}
                {user?.isAbsent && (
                  <AbsenceIndicator absenceNote={user.absenceNote} />
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Characters section */}
      <table className="w-full text-xs border border-gray-300">
        <tbody>
          <tr>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 text-center" style={{ backgroundColor: '#f2f2f2' }}>Characters</td>
          </tr>
          <tr>
            <td className="px-2 py-2 text-gray-700">
              {loading ? (
                <span className="text-gray-500 text-center block">Loading...</span>
              ) : characters.length === 0 ? (
                <span className="text-gray-500 text-center block">No characters</span>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {characters.map(char => (
                    <Link 
                      key={char.id} 
                      to={`/character/${char.slug || char.id}`}
                      className="block text-gray-900 hover:underline text-center border border-gray-300 px-1 py-1 bg-white"
                    >
                      {char.name}
                    </Link>
                  ))}
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Achievements section */}
      <table className="w-full text-xs border border-gray-300 mt-2">
        <tbody>
          <tr>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 text-center" style={{ backgroundColor: '#f2f2f2' }}>
              Achievements
              <Link to="/wiki/achievements" className="ml-1 text-gray-500 hover:text-gray-700" title="View all achievements">(?)</Link>
            </td>
          </tr>
          <tr>
            <td className="px-2 py-2 text-gray-700">
              {achievements.length === 0 ? (
                <span className="text-gray-400 text-center block italic">No achievements yet</span>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {achievements.map(ach => (
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
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Helper function to format age from months to years and months
const formatAge = (monthsAge: string | number | undefined): string => {
  if (!monthsAge) return 'Unknown';
  const months = typeof monthsAge === 'string' ? parseInt(monthsAge, 10) : monthsAge;
  if (isNaN(months)) return 'Unknown';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} yr${years !== 1 ? 's' : ''}, ${remainingMonths} mo`;
  }
};

// Character info panel component with table styling
const CharacterInfoPanel: React.FC<{ author: PostAuthor; isOriginalPost?: boolean }> = ({ author, isOriginalPost }) => {
  return (
    <div className={`w-full md:w-72 shrink-0 bg-white p-3 flex flex-col items-center ${isOriginalPost ? 'md:order-2' : ''}`}>
      {/* Avatar - same width as table */}
      <Link to={`/character/${author.slug || author.id}`} className="mb-2 w-full">
        {author.imageUrl ? (
          <img 
            src={author.imageUrl} 
            alt={author.name} 
            className="w-full object-cover border-2 border-gray-300"
            style={{ aspectRatio: '526/364' }}
          />
        ) : (
          <div 
            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 flex items-center justify-center"
            style={{ aspectRatio: '526/364' }}
          >
            <img 
              src="https://taiyaefiles.blob.core.windows.net/web/choochus_Wolf_Head_Howl_1.svg" 
              alt="Placeholder" 
              className="w-16 h-16 opacity-30"
            />
          </div>
        )}
      </Link>
      
      {/* Status text if inactive or dead */}
      {(author.characterStatus === 'Inactive' || author.characterStatus === 'Dead') && (
        <div className="text-sm italic text-gray-500 mb-2">
          {author.characterStatus}
        </div>
      )}
      
      {/* Character info table */}
      <table className="w-full text-xs border border-gray-300 mb-2">
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300 w-1/2" style={{ backgroundColor: '#f2f2f2' }}>Name</td>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 w-1/2" style={{ backgroundColor: '#f2f2f2' }}>Player</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300">
              <Link to={`/character/${author.slug || author.id}`} className="text-gray-900 hover:underline font-medium">
                {author.name}{author.surname ? ` ${author.surname}` : ''}
              </Link>
              {author.isOnline && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" title="Online Now"></span>
              )}
            </td>
            <td className="px-2 py-2 text-gray-700">
              {author.playerName || 'Unknown'}
              {(author.isModerator || author.isAdmin) && (
                <span className="ml-1 bg-gray-200 text-gray-600 px-1 py-0.5 text-[10px] uppercase font-semibold">Staff</span>
              )}
              {author.isAbsent && (
                <AbsenceIndicator absenceNote={author.absenceNote} className="ml-1" />
              )}
            </td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300" style={{ backgroundColor: '#f2f2f2' }}>Age</td>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600" style={{ backgroundColor: '#f2f2f2' }}>Sex</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300 text-gray-700">{formatAge(author.age)}</td>
            <td className={`px-2 py-2 ${author.sex === 'Male' ? 'text-blue-600' : author.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{author.sex}</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300" style={{ backgroundColor: '#f2f2f2' }}>Status</td>
            <td className="px-2 py-2 font-semibold uppercase text-gray-600" style={{ backgroundColor: '#f2f2f2' }}>Skill Points</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300 text-gray-700">{author.healthStatus}</td>
            <td className="px-2 py-2 text-gray-700">{author.skillPoints} SP</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td colSpan={2} className="px-2 py-2 font-semibold uppercase text-gray-600 text-center" style={{ backgroundColor: '#f2f2f2' }}>Pack</td>
          </tr>
          <tr>
            <td colSpan={2} className="px-2 py-2 text-center">
              {author.packName ? (
                <Link to={`/pack/${author.packSlug}`} className="hover:opacity-80">
                  <span 
                    className="uppercase tracking-wide block"
                    style={{ 
                      fontFamily: 'Baskerville, "Times New Roman", serif',
                      background: `linear-gradient(to right, ${author.primaryColor || '#666'}, ${author.secondaryColor || author.primaryColor || '#666'})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {author.packName}
                  </span>
                  {author.packRankName && (
                    <span className="block text-xs text-gray-600">{author.packRankName}</span>
                  )}
                </Link>
              ) : (
                <span className="uppercase tracking-wide text-gray-600" style={{ fontFamily: 'Baskerville, "Times New Roman", serif' }}>Rogue</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const ThreadView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { activeCharacter, user } = useOutletContext<{ activeCharacter?: Character; user?: User }>();
  const location = useLocation();
  const passedRegion = (location.state as { region?: ForumRegion })?.region;
  const { setBackgroundUrl, resetBackground, setGrayscale } = useBackground();

  // Guest detection at top-level

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useCustomPageTitle(thread?.title);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteThreadConfirm, setShowDeleteThreadConfirm] = useState(false);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const [showUnarchiveConfirm, setShowUnarchiveConfirm] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  
  // Skill Points Claim Modal state
  const [showSkillPointsModal, setShowSkillPointsModal] = useState(false);
  const [skillPointsData, setSkillPointsData] = useState<any[]>([]);
  const [skillPointsLoading, setSkillPointsLoading] = useState(false);
  const [selectedSkillPoints, setSelectedSkillPoints] = useState<number[]>([]);
  // New: track quantity and notes per skill point
  const [skillPointQuantities, setSkillPointQuantities] = useState<Record<number, number>>({});
  const [skillPointNotes, setSkillPointNotes] = useState<Record<number, string[]>>({});
  const [skillPointsSearch, setSkillPointsSearch] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [skillPointsConfirmation, setSkillPointsConfirmation] = useState<{ show: boolean; message: string; isError: boolean }>({ show: false, message: '', isError: false });
  
  // Existing claims state
  const [existingClaims, setExistingClaims] = useState<any[]>([]);
  
  // Edit thread title/subheader state
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubheader, setEditSubheader] = useState('');
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [showExistingClaims, setShowExistingClaims] = useState(false);

  // Set background immediately if we have region data from navigation state
  useLayoutEffect(() => {
    if (passedRegion?.imageUrl) {
      setBackgroundUrl(passedRegion.imageUrl);
    }
    return () => {
      resetBackground();
      setGrayscale(false);
    };
  }, [passedRegion, setBackgroundUrl, resetBackground, setGrayscale]);

  const fetchThread = () => {
    if (!threadId) return;
    
    fetch(`/api/threads/${threadId}`)
      .then(res => res.json())
      .then(data => {
        setThread(data);
        // Set background from thread data if we didn't get it from navigation
        if (!passedRegion && data.regionImage) {
          setBackgroundUrl(data.regionImage);
        }
        // Set grayscale for archived threads (IC Archives)
        if (data.isArchived) {
          setGrayscale(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchThread();
  }, [threadId]);

  // Fetch existing skill point claims for this thread
  const fetchExistingClaims = async () => {
    if (!threadId || !activeCharacter) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/skill-points-claim?characterId=${activeCharacter.id}&threadId=${threadId}`, {
        headers: { 'X-Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingClaims(data);
      }
    } catch (error) {
      console.error('Error fetching existing claims:', error);
    }
  };

  useEffect(() => {
    // Fetch claims for archived threads (either isArchived flag or in IC Archives forum 7)
    if (activeCharacter && thread && (thread.isArchived || thread.oocForumId === 7)) {
      fetchExistingClaims();
    }
  }, [thread?.isArchived, thread?.oocForumId, activeCharacter?.id, threadId]);

  // Refetch claims when page gains focus (e.g., user approved on admin page and came back)
  useEffect(() => {
    const handleFocus = () => {
      if (activeCharacter && thread && (thread.isArchived || thread.oocForumId === 7)) {
        fetchExistingClaims();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeCharacter?.id, thread?.isArchived, thread?.oocForumId, threadId]);

  // Start editing thread title/subheader
  const handleStartEditThread = () => {
    setEditTitle(thread.title);
    setEditSubheader(thread.subheader || '');
    setIsEditingThread(true);
  };

  // Save thread title/subheader
  const handleSaveThread = async () => {
    if (!editTitle.trim()) return;

    setIsSavingThread(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/details`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          subheader: editSubheader.trim() || null
        })
      });

      if (response.ok) {
        setThread((prev: any) => ({
          ...prev,
          title: editTitle.trim(),
          subheader: editSubheader.trim() || null
        }));
        setIsEditingThread(false);
      }
    } catch (error) {
      console.error('Error updating thread:', error);
    } finally {
      setIsSavingThread(false);
    }
  };

  const handlePostReply = async () => {
    if (!replyContent.trim() || !threadId) return;
    
    // For OOC threads, we need the user ID; for IC threads, we need the character ID
    const isOOC = !!thread?.oocForumId && !thread?.originalRegionId;
    
    if (isOOC) {
      // OOC posts use user ID
      if (!user) {
        alert("Please log in to post.");
        return;
      }
    } else {
      // IC posts use character ID
      if (!activeCharacter) {
        alert("Please select a character to post.");
        return;
      }
      // Block dead characters from posting in IC/roleplay threads
      if (activeCharacter.status === 'Dead') {
        alert("Dead characters cannot post in roleplay regions. You can still post in OOC forums.");
        return;
      }
    }

    setIsPosting(true);
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/threads/${threadId}/replies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                content: replyContent,
                authorId: isOOC ? user!.id : activeCharacter!.id
            })
        });
        
        if (response.ok) {
            setReplyContent('');
            fetchThread();
        } else {
            console.error("Failed to post reply");
        }
    } catch (error) {
        console.error("Error posting reply:", error);
    } finally {
        setIsPosting(false);
    }
  };

  const handleEditClick = (postId: string | number, content: string) => {
    setEditingPostId(postId);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (postId: string | number) => {
    if (!activeCharacter && !user) return;

    // Check if this is an OOC thread (has oocForumId and no originalRegionId)
    const isOOCEdit = thread && thread.oocForumId && !thread.originalRegionId;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: editContent,
          // Use user ID for OOC forums, character ID for roleplay
          ...(isOOCEdit || !activeCharacter
            ? { modifiedByUserId: user?.id }
            : { modifiedByCharacterId: activeCharacter.id })
        })
      });

      if (response.ok) {
        setEditingPostId(null);
        setEditContent('');
        fetchThread();
      } else {
        console.error("Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!showDeleteConfirm || (!activeCharacter && !user)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${showDeleteConfirm}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: activeCharacter?.id,
          userId: user?.id,
          isModerator: user?.isModerator || user?.isAdmin
        })
      });

      if (response.ok) {
        setShowDeleteConfirm(null);
        fetchThread();
      } else {
        const error = await response.text();
        alert(error || 'Failed to delete post');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!threadId || !user) return;

    setIsArchiving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          isModerator: user.isModerator || user.isAdmin
        })
      });
      
      if (response.ok) {
        setShowArchiveConfirm(false);
        fetchThread();
      } else {
        const error = await response.text();
        alert(error || 'Failed to archive thread');
      }
    } catch (error) {
      console.error('Error archiving thread:', error);
      alert('Failed to archive thread');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!threadId || !user) return;

    setIsDeletingThread(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        setShowDeleteThreadConfirm(false);
        // Navigate back to region or home
        if (thread?.regionId) {
          window.location.href = `/region/${thread.regionSlug || thread.regionId}`;
        } else if (thread?.oocForumId) {
          window.location.href = `/ooc-forums/${thread.oocForumId}`;
        } else {
          window.location.href = '/';
        }
      } else {
        const error = await response.text();
        alert(error || 'Failed to delete thread');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      alert('Failed to delete thread');
    } finally {
      setIsDeletingThread(false);
    }
  };

  const handleUnarchive = async () => {
    if (!threadId || !user) return;

    setIsUnarchiving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (response.ok) {
        setShowUnarchiveConfirm(false);
        // Refresh the page to show updated thread state
        fetchThread();
      } else {
        const error = await response.text();
        alert(error || 'Failed to unarchive thread');
      }
    } catch (error) {
      console.error('Error unarchiving thread:', error);
      alert('Failed to unarchive thread');
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleCloseThread = async () => {
    if (!threadId || !user) return;

    setIsClosing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShowCloseConfirm(false);
        fetchThread();
      } else {
        const error = await response.text();
        alert(error || 'Failed to close thread');
      }
    } catch (error) {
      console.error('Error closing thread:', error);
      alert('Failed to close thread');
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenThread = async () => {
    if (!threadId || !user) return;

    setIsReopening(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/threads/${threadId}/reopen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setShowReopenConfirm(false);
        fetchThread();
      } else {
        const error = await response.text();
        alert(error || 'Failed to reopen thread');
      }
    } catch (error) {
      console.error('Error reopening thread:', error);
      alert('Failed to reopen thread');
    } finally {
      setIsReopening(false);
    }
  };

  // Skill Points Modal handlers
  const openSkillPointsModal = async () => {
    setShowSkillPointsModal(true);
    setSkillPointsLoading(true);
    setSelectedSkillPoints([]);
    setSkillPointQuantities({});
    setSkillPointNotes({});
    setSkillPointsSearch('');
    
    try {
      const response = await fetch('/api/skillpoints');
      if (response.ok) {
        const data = await response.json();
        setSkillPointsData(data);
      }
    } catch (error) {
      console.error('Error fetching skill points:', error);
    } finally {
      setSkillPointsLoading(false);
    }
  };

  const toggleSkillPointSelection = (skillId: number, item?: any) => {
    setSelectedSkillPoints(prev => {
      if (prev.includes(skillId)) {
        // Deselecting — clean up quantity and notes
        setSkillPointQuantities(q => { const n = { ...q }; delete n[skillId]; return n; });
        setSkillPointNotes(n => { const nn = { ...n }; delete nn[skillId]; return nn; });
        return prev.filter(id => id !== skillId);
      } else {
        // Selecting — initialize quantity to 1 and notes array
        if (item?.AllowMultiple) {
          setSkillPointQuantities(q => ({ ...q, [skillId]: 1 }));
        }
        if (item?.RequiresNote) {
          const qty = item?.AllowMultiple ? 1 : 1;
          setSkillPointNotes(n => ({ ...n, [skillId]: Array(qty).fill('') }));
        }
        return [...prev, skillId];
      }
    });
  };

  const updateSkillPointQuantity = (skillId: number, newQty: number, requiresNote: boolean) => {
    const qty = Math.max(1, Math.min(20, newQty));
    setSkillPointQuantities(prev => ({ ...prev, [skillId]: qty }));
    if (requiresNote) {
      setSkillPointNotes(prev => {
        const existing = prev[skillId] || [];
        const updated = Array(qty).fill('').map((_, i) => existing[i] || '');
        return { ...prev, [skillId]: updated };
      });
    }
  };

  const updateSkillPointNote = (skillId: number, index: number, value: string) => {
    setSkillPointNotes(prev => {
      const notes = [...(prev[skillId] || [''])];
      notes[index] = value;
      return { ...prev, [skillId]: notes };
    });
  };

  const handleSubmitSkillPointsClaim = async () => {
    if (!activeCharacter || !threadId || selectedSkillPoints.length === 0) return;

    // Validate: check that required notes are filled in
    const allItems = skillPointsData.flatMap((c: any) => c.items || []);
    for (const skillId of selectedSkillPoints) {
      const item = allItems.find((i: any) => i.SkillID === skillId);
      if (item?.RequiresNote) {
        const qty = item.AllowMultiple ? (skillPointQuantities[skillId] || 1) : 1;
        const notes = skillPointNotes[skillId] || [];
        for (let i = 0; i < qty; i++) {
          if (!notes[i] || notes[i].trim() === '') {
            setSkillPointsConfirmation({ show: true, message: `Please fill in the required details for "${item.Action}"${qty > 1 ? ` (instance ${i + 1})` : ''}.`, isError: true });
            return;
          }
        }
      }
    }
    
    setIsSubmittingClaim(true);
    try {
      const token = localStorage.getItem('token');

      // Build the new details format
      const skillPointDetails = selectedSkillPoints.map(skillId => {
        const item = allItems.find((i: any) => i.SkillID === skillId);
        const qty = item?.AllowMultiple ? (skillPointQuantities[skillId] || 1) : 1;
        const notes = skillPointNotes[skillId] || [];
        return {
          skillPointId: skillId,
          quantity: qty,
          notes: notes.slice(0, qty)
        };
      });

      const response = await fetch('/api/skill-points-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          characterId: activeCharacter.id,
          threadId: parseInt(threadId),
          skillPointDetails
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setShowSkillPointsModal(false);
        setSelectedSkillPoints([]);
        setSkillPointQuantities({});
        setSkillPointNotes({});
        setSkillPointsConfirmation({ show: true, message: result.message || 'Skill points claim submitted successfully!', isError: false });
        // Refresh existing claims
        fetchExistingClaims();
      } else {
        const error = await response.text();
        setSkillPointsConfirmation({ show: true, message: error || 'Failed to submit skill points claim', isError: true });
      }
    } catch (error) {
      console.error('Error submitting skill points claim:', error);
      setSkillPointsConfirmation({ show: true, message: 'Failed to submit skill points claim', isError: true });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Get contextual placeholder text for note inputs based on action type
  const getNotePlaceholder = (action: string, instanceIndex?: number): string => {
    const num = instanceIndex !== undefined ? ` ${instanceIndex + 1}` : '';
    const lower = action.toLowerCase();
    if (lower.includes('meet a new wolf')) return `Name of wolf met${num}`;
    if (lower.includes('train someone')) return `Name of wolf trained${num}`;
    if (lower.includes('receive') && lower.includes('training')) return `Name of trainer`;
    if (lower.includes('spar')) return `Name of opponent${num}`;
    if (lower.includes('fight')) return `Name of opponent${num}`;
    if (lower.includes('kill a')) return `Name of wolf killed${num}`;
    if (lower.includes('death of a friend')) return `Name of deceased${num}`;
    if (lower.includes('save a life')) return `Name of wolf saved`;
    if (lower.includes('joining or starting')) return `Name of pack`;
    if (lower.includes('gain important knowledge')) return `What was learned?${num}`;
    if (lower.includes('perform a pack duty')) return `Describe the duty performed${num}`;
    if (lower.includes('personal trauma')) return `Describe what happened`;
    return `Details${num}`;
  };

  // Filter skill points based on search
  const filteredSkillPointsData = skillPointsData.map(category => ({
    ...category,
    items: category.items?.filter((item: any) => 
      !skillPointsSearch || 
      item.Action?.toLowerCase().includes(skillPointsSearch.toLowerCase()) ||
      item.ActionDescription?.toLowerCase().includes(skillPointsSearch.toLowerCase()) ||
      category.Category?.toLowerCase().includes(skillPointsSearch.toLowerCase())
    )
  })).filter(category => category.items?.length > 0);

  if (loading) return <div>Loading...</div>;
  if (!thread) return <div>Thread not found</div>;

  // Check if this is an OOC thread (not an archived IC thread)
  // Archived IC threads have originalRegionId set, so they should still show character info
  const isOOCThread = !!thread.oocForumId && !thread.originalRegionId;

  // Construct author object for the main post from thread data
  const mainAuthor: PostAuthor = {
    id: thread.authorId,
    slug: thread.authorSlug,
    name: thread.authorName,
    surname: thread.authorSurname,
    imageUrl: thread.authorImage,
    packName: thread.packName,
    packSlug: thread.packSlug,
    packRankName: thread.packRankName,
    primaryColor: thread.primaryColor,
    secondaryColor: thread.secondaryColor,
    rank: thread.rank,
    sex: thread.sex || 'Unknown',
    age: thread.age ? `${thread.age} mos.` : 'Unknown',
    healthStatus: thread.healthStatus || 'Unknown',
    characterStatus: thread.characterStatus,
    skillPoints: thread.skillPoints || 0,
    isOnline: thread.isOnline,
    playerName: thread.playerName || 'Unknown',
    userId: thread.userId,
    isModerator: thread.isModerator,
    isAdmin: thread.isAdmin,
    isAbsent: thread.isAbsent,
    absenceNote: thread.absenceNote
  };

  return (
    <>
      {/* Photo mode styles */}
      {showPhotoMode && (
        <style>{`
          .min-h-screen > header,
          .min-h-screen > main,
          .min-h-screen > footer {
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
      )}

      {/* Show Photo Button - rendered via portal to body (only for IC/roleplay threads) */}
      {!isOOCThread && createPortal(
        <button
          onClick={() => setShowPhotoMode(!showPhotoMode)}
          className="show-photo-btn"
        >
          {showPhotoMode ? 'Hide Photo' : 'Show Photo'}
        </button>,
        document.body
      )}

      <section className={`bg-white border border-gray-300 shadow ${showPhotoMode ? 'invisible' : ''}`}>
        <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex justify-between items-center">
          <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">
            {thread.oocForumId && !thread.originalRegionId ? (
              <Link to={`/ooc-forum/${thread.oocForumId}`} className="hover:text-white">
                {thread.oocForumName || 'OOC Forum'}
              </Link>
            ) : (
              <Link to={`/region/${thread.regionSlug || thread.regionId}`} className="hover:text-white">
                {thread.regionName || 'Thread'}
              </Link>
            )}
            {' › '}{thread.title}
          </h2>
          <div className="flex gap-2">
            {/* Archive button - show if user is thread creator OR is moderator, and thread is not archived (roleplay threads only) */}
            {user && !isOOCThread && (thread.userId === user.id || user.isModerator || user.isAdmin) && !thread.isArchived && (
              <button
                onClick={() => setShowArchiveConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Archive
              </button>
            )}
            {/* Unarchive button - moderator/admin only, only for archived roleplay threads */}
            {user && !isOOCThread && (user.isModerator || user.isAdmin) && thread.isArchived && (
              <button
                onClick={() => setShowUnarchiveConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Unarchive
              </button>
            )}
            {/* Close button - moderator/admin only, thread not already closed or archived */}
            {user && (user.isModerator || user.isAdmin) && !thread.isClosed && !thread.isArchived && (
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Close Thread
              </button>
            )}
            {/* Reopen button - moderator/admin only, only for closed threads */}
            {user && (user.isModerator || user.isAdmin) && thread.isClosed && (
              <button
                onClick={() => setShowReopenConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Reopen Thread
              </button>
            )}
            {/* Delete Thread button - moderator only */}
            {user && (user.isModerator || user.isAdmin) && (
              <button
                onClick={() => setShowDeleteThreadConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 px-2 py-0.5 border border-red-500/30"
              >
                Delete Thread
              </button>
            )}
            {/* Claim Skill Points button - only show for archived threads where activeCharacter participated */}
            {thread.isArchived && activeCharacter && (
              String(activeCharacter.id) === String(thread.authorId) ||
              thread.replies?.some((reply: any) => String(reply.authorId) === String(activeCharacter.id))
            ) && (
              <button
                onClick={openSkillPointsModal}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Claim Skill Points
              </button>
            )}
          </div>
        </div>

        <div className="px-2 py-2 md:px-4 md:py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditingThread ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Thread Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#294023] focus:border-transparent"
                      placeholder="Thread title..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Subheader (optional)</label>
                    <input
                      type="text"
                      value={editSubheader}
                      onChange={(e) => setEditSubheader(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#294023] focus:border-transparent"
                      placeholder="Brief description or subtitle..."
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveThread}
                      disabled={isSavingThread || !editTitle.trim()}
                      className="px-3 py-1 text-xs bg-[#294023] text-white rounded hover:bg-[#3d5a35] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingThread ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingThread(false)}
                      disabled={isSavingThread}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {thread.title}
                      {thread.isArchived && <span className="text-gray-500 font-normal ml-2">(closed)</span>}
                    </h3>
                    {user && thread.userId === user.id && !thread.isArchived && (
                      <button
                        onClick={handleStartEditThread}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit thread title"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {thread.subheader && (
                    <p className="text-sm text-gray-500 mt-0.5">{thread.subheader}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Existing Skill Points Claims - show for archived threads where user has claims */}
          {(thread.isArchived || thread.oocForumId === 7) && activeCharacter && existingClaims.length > 0 && (
            <div className="mb-4 border border-gray-300 rounded bg-gray-50">
              <button
                onClick={() => setShowExistingClaims(!showExistingClaims)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Skill Points Claims ({existingClaims.length})
                  </span>
                  {existingClaims.some(c => c.IsModeratorApproved === true || c.IsModeratorApproved === 1) && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-green-100 text-green-700 rounded">
                      {existingClaims.filter(c => c.IsModeratorApproved === true || c.IsModeratorApproved === 1).length} Earned
                    </span>
                  )}
                  {existingClaims.some(c => c.IsModeratorApproved === null || c.IsModeratorApproved === undefined) && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-yellow-100 text-yellow-700 rounded">
                      {existingClaims.filter(c => c.IsModeratorApproved === null || c.IsModeratorApproved === undefined).length} Pending
                    </span>
                  )}
                  {existingClaims.some(c => c.IsModeratorApproved === false || c.IsModeratorApproved === 0) && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-red-100 text-red-700 rounded">
                      {existingClaims.filter(c => c.IsModeratorApproved === false || c.IsModeratorApproved === 0).length} Rejected
                    </span>
                  )}
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${showExistingClaims ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExistingClaims && (
                <div className="border-t border-gray-300 px-3 py-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 font-semibold text-gray-600 uppercase">Action</th>
                        <th className="text-center py-1 font-semibold text-gray-600 uppercase w-10">E</th>
                        <th className="text-center py-1 font-semibold text-gray-600 uppercase w-10">P</th>
                        <th className="text-center py-1 font-semibold text-gray-600 uppercase w-10">K</th>
                        <th className="text-right py-1 font-semibold text-gray-600 uppercase w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {existingClaims.map((claim, idx) => (
                        <tr key={claim.AssignmentID || idx} className="border-b border-gray-100 last:border-0">
                          <td className="py-1.5 text-gray-700">
                            <div>{claim.Action}</div>
                            {claim.Note && (
                              <div className="text-xs text-gray-500 italic">↳ {claim.Note}</div>
                            )}
                          </td>
                          <td className="py-1.5 text-center text-gray-600">{claim.E || '-'}</td>
                          <td className="py-1.5 text-center text-gray-600">{claim.P || '-'}</td>
                          <td className="py-1.5 text-center text-gray-600">{claim.K || '-'}</td>
                          <td className="py-1.5 text-right">
                            {claim.IsModeratorApproved === true || claim.IsModeratorApproved === 1 ? (
                              <span className="text-green-600 font-medium">Earned</span>
                            ) : claim.IsModeratorApproved === false || claim.IsModeratorApproved === 0 ? (
                              <span className="text-red-600 font-medium">Rejected</span>
                            ) : (
                              <span className="text-yellow-600 font-medium">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Archive Confirmation Modal */}
          {showArchiveConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Archive Thread</h4>
                <p className="text-gray-700 mb-4">Are you sure you want to archive this thread? It will be moved to the archive forum and no one will be able to post in it anymore.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowArchiveConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isArchiving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700"
                    disabled={isArchiving}
                  >
                    {isArchiving ? 'Archiving...' : 'Yes, Archive'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Delete Post</h4>
                <p className="text-gray-700 mb-4">Are you sure you want to delete this post? This action cannot be undone.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Thread Confirmation Modal - Moderator only */}
          {showDeleteThreadConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-red-600">Delete Entire Thread</h4>
                <p className="text-gray-700 mb-4">
                  <strong>Warning:</strong> This will permanently delete the entire thread including all posts and any skill point claims. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteThreadConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isDeletingThread}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteThread}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700"
                    disabled={isDeletingThread}
                  >
                    {isDeletingThread ? 'Deleting...' : 'Yes, Delete Thread'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unarchive Confirmation Modal - Moderator only */}
          {showUnarchiveConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Unarchive Thread</h4>
                <p className="text-gray-700 mb-4">
                  This will restore the thread to its original location and reopen it for replies.
                </p>
                <p className="text-amber-600 mb-4 text-sm">
                  <strong>Note:</strong> All skill point claims (approved, pending, and rejected) will be deleted. Any approved points will be reversed from character totals.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowUnarchiveConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isUnarchiving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnarchive}
                    className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700"
                    disabled={isUnarchiving}
                  >
                    {isUnarchiving ? 'Unarchiving...' : 'Yes, Unarchive'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Close Thread Confirmation Modal - Moderator only */}
          {showCloseConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Close Thread</h4>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to close this thread? No one will be able to post new replies, but existing posts can still be edited.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isClosing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseThread}
                    className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700"
                    disabled={isClosing}
                  >
                    {isClosing ? 'Closing...' : 'Yes, Close Thread'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reopen Thread Confirmation Modal - Moderator only */}
          {showReopenConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg max-w-md">
                <h4 className="text-lg font-semibold mb-4 text-gray-900">Reopen Thread</h4>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to reopen this thread? Users will be able to post replies again.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReopenConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                    disabled={isReopening}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReopenThread}
                    className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700"
                    disabled={isReopening}
                  >
                    {isReopening ? 'Reopening...' : 'Yes, Reopen Thread'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skill Points Claim Modal */}
          {showSkillPointsModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded shadow-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="bg-[#2f3a2f] px-4 py-3 flex justify-between items-center">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Claim Skill Points</h4>
                  <button
                    onClick={() => setShowSkillPointsModal(false)}
                    className="text-white/70 hover:text-white text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                <div className="p-4 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search skill points..."
                    value={skillPointsSearch}
                    onChange={(e) => setSkillPointsSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm text-black focus:outline-none focus:border-gray-400"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {skillPointsLoading ? (
                    <div className="text-center text-gray-500 py-8">Loading skill points...</div>
                  ) : filteredSkillPointsData.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No skill points found</div>
                  ) : (
                    filteredSkillPointsData.map((category: any) => (
                      <div key={category.Category} className="mb-6">
                        <h5 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-2">{category.Category}</h5>
                        <div className="flex justify-between items-center mb-2">
                          {category.CategoryDescription ? (
                            <p className="text-xs text-gray-600">{category.CategoryDescription}</p>
                          ) : (
                            <div />
                          )}
                          <div className="text-xs text-gray-500 font-semibold whitespace-nowrap mr-2">
                            <span className="inline-block w-8 text-center">E</span>
                            <span className="inline-block w-8 text-center">P</span>
                            <span className="inline-block w-8 text-center">K</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {category.items?.map((item: any) => {
                            const isSelected = selectedSkillPoints.includes(item.SkillID);
                            const qty = item.AllowMultiple ? (skillPointQuantities[item.SkillID] || 1) : 1;
                            const notes = skillPointNotes[item.SkillID] || [];
                            return (
                              <div
                                key={item.SkillID}
                                className={`border transition-colors ${
                                  isSelected
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <label className="flex items-start gap-3 p-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSkillPointSelection(item.SkillID, item)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 text-sm">
                                    <div className="font-medium text-gray-900">{item.Action}</div>
                                    {item.ActionDescription && (
                                      <div className="text-xs text-gray-600">{item.ActionDescription}</div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 text-right whitespace-nowrap">
                                    <span className="inline-block w-8 text-center">{item.E || 0}</span>
                                    <span className="inline-block w-8 text-center">{item.P || 0}</span>
                                    <span className="inline-block w-8 text-center">{item.K || 0}</span>
                                  </div>
                                </label>

                                {/* Quantity selector + Note inputs (shown when selected) */}
                                {isSelected && (item.AllowMultiple || item.RequiresNote) && (
                                  <div className="px-9 pb-3 space-y-2">
                                    {/* Quantity selector for AllowMultiple actions */}
                                    {item.AllowMultiple && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 font-medium">Quantity:</span>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); updateSkillPointQuantity(item.SkillID, qty - 1, !!item.RequiresNote); }}
                                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded"
                                          disabled={qty <= 1}
                                        >
                                          −
                                        </button>
                                        <span className="text-sm font-semibold text-gray-900 w-6 text-center">{qty}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => { e.preventDefault(); updateSkillPointQuantity(item.SkillID, qty + 1, !!item.RequiresNote); }}
                                          className="w-6 h-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded"
                                          disabled={qty >= 20}
                                        >
                                          +
                                        </button>
                                        {qty > 1 && (
                                          <span className="text-xs text-gray-500 ml-1">
                                            ({(item.TOTAL || 0) * qty} SP total)
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Note input(s) — one per instance for multi, or one for single */}
                                    {item.RequiresNote && (
                                      <div className="space-y-1">
                                        {Array.from({ length: qty }).map((_, i) => (
                                          <div key={i} className="flex items-center gap-2">
                                            {qty > 1 && (
                                              <span className="text-xs text-gray-400 w-4 text-right">{i + 1}.</span>
                                            )}
                                            <input
                                              type="text"
                                              placeholder={getNotePlaceholder(item.Action, qty > 1 ? i : undefined) + ' (required)'}
                                              value={notes[i] || ''}
                                              onChange={(e) => updateSkillPointNote(item.SkillID, i, e.target.value)}
                                              onClick={(e) => e.stopPropagation()}
                                              className="flex-1 px-2 py-1 border border-gray-300 text-xs text-black focus:outline-none focus:border-gray-400"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {selectedSkillPoints.length} item(s) selected
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSkillPointsModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                      disabled={isSubmittingClaim}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitSkillPointsClaim}
                      className="px-4 py-2 bg-[#2f3a2f] text-white hover:bg-[#3a4a3a] text-sm disabled:opacity-50"
                      disabled={isSubmittingClaim || selectedSkillPoints.length === 0}
                    >
                      {isSubmittingClaim ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skill Points Confirmation Modal */}
          {skillPointsConfirmation.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded shadow-lg w-full max-w-md flex flex-col">
                <div className={`${skillPointsConfirmation.isError ? 'bg-red-600' : 'bg-[#2f3a2f]'} px-4 py-3 flex justify-between items-center`}>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                    {skillPointsConfirmation.isError ? 'Error' : 'Success'}
                  </h4>
                  <button
                    onClick={() => setSkillPointsConfirmation({ show: false, message: '', isError: false })}
                    className="text-white/70 hover:text-white text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 text-sm">{skillPointsConfirmation.message}</p>
                </div>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <button
                    onClick={() => setSkillPointsConfirmation({ show: false, message: '', isError: false })}
                    className={`px-4 py-2 text-white text-sm ${skillPointsConfirmation.isError ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2f3a2f] hover:bg-[#3a4a3a]'}`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Original Post - avatar on RIGHT */}
          <div className="p-2 md:p-4 mx-0 md:mx-2 mb-12 md:mb-4" style={{ backgroundColor: '#f2f2f2' }}>
            <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-4">
              {/* Content on LEFT */}
              <div className="flex-grow min-w-0 p-3 md:p-4 relative bg-white md:order-1">
                {/* Edit button - only for post owner (character match OR user match for OOC) */}
                {((activeCharacter && String(activeCharacter.id) === String(mainAuthor.id)) || (user && String(user.id) === String(mainAuthor.userId))) && (
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => handleEditClick(thread.postId, thread.content)}
                      className="text-gray-500 hover:text-gray-800 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 border border-gray-300"
                    >
                      Edit
                    </button>
                  </div>
                )}

                {editingPostId === thread.postId ? (
                  <div className="bg-gray-50 p-4 border border-gray-200">
                    <RichTextEditor value={editContent} onChange={setEditContent} />
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                      <button onClick={() => handleSaveEdit(thread.postId)} className="px-3 py-1 bg-gray-800 text-white hover:bg-gray-700">Save</button>
                    </div>
                  </div>
                ) : (
                  <div 
                      className="prose prose-slate max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: thread.content }}
                  />
                )}
              </div>
              {/* Character info on RIGHT */}
              {isOOCThread ? (
                <OOCPlayerInfoPanel 
                  playerName={mainAuthor.playerName || 'Unknown'} 
                  userId={mainAuthor.userId!} 
                  isOriginalPost={true} 
                />
              ) : (
                <CharacterInfoPanel author={mainAuthor} isOriginalPost={true} />
              )}
            </div>
            {/* Post footer with date */}
            <div className="px-1 py-2 text-xs text-gray-600 mt-2">
              {new Date(thread.createdAt).toLocaleString()}
              {thread.modifiedAt && thread.createdAt !== thread.modifiedAt && (
                <span className="block md:inline md:ml-4 italic mt-1 md:mt-0">
                  Edited by {thread.modifiedByName || 'Unknown'} on {new Date(thread.modifiedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Replies - avatar on LEFT */}
          {thread.replies?.map((reply: any, index: number) => {
            const replyAuthor: PostAuthor = {
                id: reply.authorId,
                slug: reply.authorSlug,
                name: reply.authorName,
                surname: reply.authorSurname,
                imageUrl: reply.authorImage,
                packName: reply.packName,
                packSlug: reply.packSlug,
                packRankName: reply.packRankName,
                primaryColor: reply.primaryColor,
                secondaryColor: reply.secondaryColor,
                rank: reply.rank,
                sex: reply.sex || 'Unknown',
                age: reply.age ? `${reply.age} mos.` : 'Unknown',
                healthStatus: reply.healthStatus || 'Unknown',
                characterStatus: reply.characterStatus,
                skillPoints: reply.skillPoints || 0,
                isOnline: reply.isOnline,
                playerName: reply.playerName || 'Unknown',
                userId: reply.userId,
                isModerator: reply.isModerator,
                isAdmin: reply.isAdmin,
                isAbsent: reply.isAbsent,
                absenceNote: reply.absenceNote
            };
    
            return (
              <div key={reply.id} className="p-2 md:p-4 mx-0 md:mx-2 mb-12 md:mb-4" style={{ backgroundColor: '#f2f2f2' }}>
                <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                  {/* Character/Player info on LEFT */}
                  {isOOCThread ? (
                    <OOCPlayerInfoPanel 
                      playerName={replyAuthor.playerName || 'Unknown'} 
                      userId={replyAuthor.userId!} 
                      isOriginalPost={false} 
                    />
                  ) : (
                    <CharacterInfoPanel author={replyAuthor} isOriginalPost={false} />
                  )}
                  {/* Content on RIGHT */}
                  <div className="flex-grow min-w-0 p-3 md:p-4 relative bg-white">
                    <div className="absolute top-2 right-2 flex gap-1">
                      {/* Edit button - only for post owner (character match OR user match for OOC) */}
                      {((activeCharacter && String(activeCharacter.id) === String(replyAuthor.id)) || (user && String(user.id) === String(replyAuthor.userId))) && (
                        <button 
                            onClick={() => handleEditClick(reply.id, reply.content)}
                            className="text-gray-500 hover:text-gray-800 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 border border-gray-300"
                        >
                            Edit
                        </button>
                      )}
                      {/* Delete button - show for post owner OR moderator */}
                      {((activeCharacter && String(activeCharacter.id) === String(replyAuthor.id)) || (user && (user.isModerator || user.isAdmin || String(user.id) === String(replyAuthor.userId)))) && (
                        <button 
                            onClick={() => setShowDeleteConfirm(reply.id)}
                            className="text-gray-500 hover:text-red-600 text-xs bg-gray-100 hover:bg-red-50 px-2 py-1 border border-gray-300"
                        >
                            Delete
                        </button>
                      )}
                    </div>

                    {editingPostId === reply.id ? (
                      <div className="bg-gray-50 p-4 border border-gray-200">
                        <RichTextEditor value={editContent} onChange={setEditContent} />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                          <button onClick={() => handleSaveEdit(reply.id)} className="px-3 py-1 bg-gray-800 text-white hover:bg-gray-700">Save</button>
                        </div>
                      </div>
                    ) : (
                      <div 
                          className="prose prose-slate max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{ __html: reply.content }}
                      />
                    )}
                  </div>
                </div>
                {/* Post footer with date and post number */}
                <div className="px-1 py-2 text-xs text-gray-600 mt-2">
                  {new Date(reply.createdAt).toLocaleString()} — Post #{index + 1}
                  {reply.modifiedAt && reply.createdAt !== reply.modifiedAt && (
                    <span className="block md:inline md:ml-4 italic mt-1 md:mt-0">
                      Edited by {reply.modifiedByName || 'Unknown'} on {new Date(reply.modifiedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Reply Form - only show if thread is not archived/closed and user can post (OOC: logged in, IC: has character) */}
          {!thread.isArchived && !thread.isClosed && user && (isOOCThread || activeCharacter) ? (
            <div className="border border-gray-300 mx-0.5">
              <div className="bg-gray-200 px-4 py-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-700">Post a Reply</h4>
              </div>
              <div className="p-4 bg-white">
                <div className="border border-gray-300">
                  <RichTextEditor 
                      value={replyContent} 
                      onChange={setReplyContent} 
                      placeholder="Write your reply here..."
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handlePostReply}
                    disabled={isPosting}
                    className={`bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 font-bold text-sm uppercase tracking-wide ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isPosting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          ) : thread.isArchived ? (
            <div className="border border-gray-300 mx-0.5 bg-gray-100 px-4 py-3 text-center text-gray-600 text-sm">
              This thread has been archived and is closed for new replies.
            </div>
          ) : thread.isClosed ? (
            <div className="border border-gray-300 mx-0.5 bg-gray-100 px-4 py-3 text-center text-gray-600 text-sm">
              This thread has been closed by a moderator and is not accepting new replies.
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default ThreadView;
