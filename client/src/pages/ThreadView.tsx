import React, { useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link, useOutletContext, useLocation } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import { useBackground } from '../contexts/BackgroundContext';
import { useNoUser } from '../contexts/UserContext';
import type { Character, ForumRegion, User } from '../types';

// Helper type for the API response which flattens character/pack info
interface PostAuthor {
  id: string;
  name: string;
  surname?: string;
  imageUrl: string;
  packName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  rank?: string;
  sex?: string;
  age?: string;
  healthStatus?: string;
  skillPoints?: number;
  isOnline?: boolean;
  playerName?: string;
  userId?: number;
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
        // Filter to only active characters
        const activeChars = data.filter((c: Character) => c.healthStatus !== 'Inactive');
        setCharacters(activeChars);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  return (
    <div className={`w-full md:w-72 bg-gray-50 p-3 flex flex-col ${isOriginalPost ? 'md:order-2 border-l' : 'border-r'} border-gray-300`}>
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
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Player section */}
      <table className="w-full text-xs border border-gray-300 mb-2">
        <tbody>
          <tr>
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 text-center">Player</td>
          </tr>
          <tr>
            <td className="px-2 py-2 text-gray-700 text-center">{playerName || 'Unknown'}</td>
          </tr>
        </tbody>
      </table>

      {/* Characters section */}
      <table className="w-full text-xs border border-gray-300">
        <tbody>
          <tr>
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 text-center">Characters</td>
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
                      to={`/character/${char.id}`}
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
    </div>
  );
};

// Character info panel component with table styling
const CharacterInfoPanel: React.FC<{ author: PostAuthor; isOriginalPost?: boolean }> = ({ author, isOriginalPost }) => {
  return (
    <div className={`w-full md:w-72 bg-gray-50 p-3 flex flex-col items-center ${isOriginalPost ? 'md:order-2 border-l' : 'border-r'} border-gray-300`}>
      {/* Avatar - same width as table */}
      <Link to={`/character/${author.id}`} className="mb-2 w-full">
        <img 
          src={author.imageUrl} 
          alt={author.name} 
          className="w-full object-cover border-2 border-gray-300"
          style={{ aspectRatio: '526/364' }}
        />
      </Link>
      
      {/* Status badge if inactive */}
      {author.healthStatus === 'Inactive' && (
        <div className="text-xs font-bold uppercase tracking-wider py-0.5 px-2 mb-2 bg-gray-400 text-white">
          Inactive
        </div>
      )}
      
      {/* Character info table */}
      <table className="w-full text-xs border border-gray-300 mb-2">
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300 w-1/2">Name</td>
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 w-1/2">Player</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300">
              <Link to={`/character/${author.id}`} className="text-gray-900 hover:underline font-medium">
                {author.name}{author.surname ? ` ${author.surname}` : ''}
              </Link>
              {author.isOnline && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block" title="Online Now"></span>
              )}
            </td>
            <td className="px-2 py-2 text-gray-700">{author.playerName || 'Unknown'}</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300">Age</td>
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600">Sex</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300 text-gray-700">{author.age}</td>
            <td className={`px-2 py-2 ${author.sex === 'Male' ? 'text-blue-600' : author.sex === 'Female' ? 'text-pink-500' : 'text-gray-700'}`}>{author.sex}</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 border-r border-gray-300">Status</td>
            <td className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600">Skill Points</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td className="px-2 py-2 border-r border-gray-300 text-gray-700">{author.healthStatus}</td>
            <td className="px-2 py-2 text-gray-700">{author.skillPoints} SP</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td colSpan={2} className="bg-gray-200 px-2 py-2 font-semibold uppercase text-gray-600 text-center">Pack</td>
          </tr>
          <tr>
            <td colSpan={2} className="px-2 py-2 text-center">
              {author.packName ? (
                <span 
                  className="inline-block text-xs font-bold uppercase tracking-wider py-0.5 px-2"
                  style={{ 
                    backgroundColor: author.primaryColor || '#444', 
                    color: '#fff' 
                  }}
                >
                  {author.packName}
                </span>
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
  let isGuest = true;
  try {
    const noUserContext = useNoUser();
    isGuest = noUserContext?.isGuest ?? true;
  } catch {
    isGuest = true;
  }

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Skill Points Claim Modal state
  const [showSkillPointsModal, setShowSkillPointsModal] = useState(false);
  const [skillPointsData, setSkillPointsData] = useState<any[]>([]);
  const [skillPointsLoading, setSkillPointsLoading] = useState(false);
  const [selectedSkillPoints, setSelectedSkillPoints] = useState<number[]>([]);
  const [skillPointsSearch, setSkillPointsSearch] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [skillPointsConfirmation, setSkillPointsConfirmation] = useState<{ show: boolean; message: string; isError: boolean }>({ show: false, message: '', isError: false });

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
    }

    setIsPosting(true);
    try {
        const response = await fetch(`/api/threads/${threadId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
    if (!activeCharacter) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          modifiedByCharacterId: activeCharacter.id
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
      const response = await fetch(`/api/posts/${showDeleteConfirm}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: activeCharacter?.id,
          userId: user?.id
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
      const response = await fetch(`/api/threads/${threadId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
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

  // Skill Points Modal handlers
  const openSkillPointsModal = async () => {
    setShowSkillPointsModal(true);
    setSkillPointsLoading(true);
    setSelectedSkillPoints([]);
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

  const toggleSkillPointSelection = (skillId: number) => {
    setSelectedSkillPoints(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmitSkillPointsClaim = async () => {
    if (!activeCharacter || !threadId || selectedSkillPoints.length === 0) return;
    
    setIsSubmittingClaim(true);
    try {
      const response = await fetch('/api/skill-points-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: activeCharacter.id,
          threadId: parseInt(threadId),
          skillPointIds: selectedSkillPoints
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setShowSkillPointsModal(false);
        setSelectedSkillPoints([]);
        setSkillPointsConfirmation({ show: true, message: result.message || 'Skill points claim submitted successfully!', isError: false });
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
    name: thread.authorName,
    surname: thread.authorSurname,
    imageUrl: thread.authorImage,
    packName: thread.packName,
    primaryColor: thread.primaryColor,
    secondaryColor: thread.secondaryColor,
    rank: thread.rank,
    sex: thread.sex || 'Unknown',
    age: thread.age ? `${thread.age} mos.` : 'Unknown',
    healthStatus: thread.healthStatus || 'Unknown',
    skillPoints: thread.skillPoints || 0,
    isOnline: thread.isOnline,
    playerName: thread.playerName || 'Unknown',
    userId: thread.userId
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

      {/* Show Photo Button - rendered via portal to body */}
      {createPortal(
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
            <Link to={`/region/${thread.regionId}`} className="hover:text-white">
              {thread.regionName || 'Thread'}
            </Link>
            {' › '}{thread.title}
          </h2>
          <div className="flex gap-2">
            {/* Archive button - only show if user is the thread creator and thread is not archived */}
            {user && thread.userId === user.id && !thread.isArchived && (
              <button
                onClick={() => setShowArchiveConfirm(true)}
                className="text-[10px] uppercase tracking-wide text-[#fff9] hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 border border-white/20"
              >
                Archive
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

        <div className="px-4 py-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {thread.title}
                {thread.isArchived && <span className="text-gray-500 font-normal ml-2">(closed)</span>}
              </h3>
            </div>
            <Link 
              to={thread.originalRegionId ? `/region/${thread.originalRegionId}` : `/region/${thread.regionId}`}
              style={{ color: '#111827' }}
              className="hover:underline text-sm"
            >
              ← Back to {thread.regionName}
            </Link>
          </div>

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
                          {category.items?.map((item: any) => (
                            <label
                              key={item.SkillID}
                              className={`flex items-start gap-3 p-2 border cursor-pointer transition-colors ${
                                selectedSkillPoints.includes(item.SkillID)
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSkillPoints.includes(item.SkillID)}
                                onChange={() => toggleSkillPointSelection(item.SkillID)}
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
                          ))}
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
          <div className="border border-gray-300 mx-0.5 mb-4">
            {/* Post header with date */}
            <div className="bg-gray-100 px-3 py-1 border-b border-gray-300 text-xs text-gray-600">
              {new Date(thread.createdAt).toLocaleString()}
            </div>
            <div className="flex flex-col md:flex-row">
              {/* Content on LEFT */}
              <div className="flex-grow p-4 relative bg-white md:order-1">
                {activeCharacter && String(activeCharacter.id) === String(mainAuthor.id) && (
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => handleEditClick(thread.postId, thread.content)}
                      className="text-gray-500 hover:text-gray-800 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 border border-gray-300"
                    >
                      Edit
                    </button>
                  </div>
                )}
                
                {thread.modifiedAt && thread.createdAt !== thread.modifiedAt && (
                   <div className="text-xs text-gray-500 mb-2 italic border-b border-gray-200 pb-2">
                      Edited by {thread.modifiedByName || 'Unknown'} on {new Date(thread.modifiedAt).toLocaleString()}
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
          </div>

          {/* Replies - avatar on LEFT */}
          {thread.replies?.map((reply: any, index: number) => {
            const replyAuthor: PostAuthor = {
                id: reply.authorId,
                name: reply.authorName,
                surname: reply.authorSurname,
                imageUrl: reply.authorImage,
                packName: reply.packName,
                primaryColor: reply.primaryColor,
                secondaryColor: reply.secondaryColor,
                rank: reply.rank,
                sex: reply.sex || 'Unknown',
                age: reply.age ? `${reply.age} mos.` : 'Unknown',
                healthStatus: reply.healthStatus || 'Unknown',
                skillPoints: reply.skillPoints || 0,
                isOnline: reply.isOnline,
                playerName: reply.playerName || 'Unknown',
                userId: reply.userId
            };
    
            return (
              <div key={reply.id} className="border border-gray-300 mx-0.5 mb-4">
                {/* Post header with date and post number */}
                <div className="bg-gray-100 px-3 py-1 border-b border-gray-300 text-xs text-gray-600 flex justify-between">
                  <span>{new Date(reply.createdAt).toLocaleString()} — Post #{index + 1}</span>
                </div>
                <div className="flex flex-col md:flex-row">
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
                  <div className="flex-grow p-4 relative bg-white">
                    <div className="absolute top-2 right-2 flex gap-1">
                      {activeCharacter && String(activeCharacter.id) === String(replyAuthor.id) && (
                        <>
                          <button 
                              onClick={() => handleEditClick(reply.id, reply.content)}
                              className="text-gray-500 hover:text-gray-800 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 border border-gray-300"
                          >
                              Edit
                          </button>
                          <button 
                              onClick={() => setShowDeleteConfirm(reply.id)}
                              className="text-gray-500 hover:text-red-600 text-xs bg-gray-100 hover:bg-red-50 px-2 py-1 border border-gray-300"
                          >
                              Delete
                          </button>
                        </>
                      )}
                    </div>

                    {reply.modifiedAt && reply.createdAt !== reply.modifiedAt && (
                       <div className="text-xs text-gray-500 mb-2 italic">
                          Edited by {reply.modifiedByName || 'Unknown'} on {new Date(reply.modifiedAt).toLocaleString()}
                       </div>
                    )}

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
              </div>
            );
          })}

          {/* Reply Form - only show if thread is not archived and user is logged in */}
          {!thread.isArchived && user ? (
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
          ) : null}
        </div>
      </section>
    </>
  );
}

export default ThreadView;
