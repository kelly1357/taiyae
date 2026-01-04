import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import type { Character } from '../types';

// Helper type for the API response which flattens character/pack info
interface PostAuthor {
  id: string;
  name: string;
  imageUrl: string;
  packName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  rank?: string;
  sex?: string;
  age?: string;
  healthStatus?: string;
  skillPoints?: number;
}

const CharacterPostInfo: React.FC<{ author: PostAuthor }> = ({ author }) => {
  return (
    <div className="w-full md:w-64 bg-gray-800 p-4 flex flex-col items-center text-center border-r border-gray-600">
      <Link to={`/character/${author.id}`} className="text-lg font-bold text-blue-300 hover:text-blue-200 mb-2">
        {author.name}
      </Link>
      <div className="mb-3 relative">
        <img 
          src={author.imageUrl} 
          alt={author.name} 
          className="w-32 h-32 object-cover rounded border-4 border-gray-700"
        />
      </div>
      
      {author.packName && (
        <div className="mb-2 w-full">
          <div 
            className="text-xs font-bold uppercase tracking-wider py-1 px-2 rounded"
            style={{ 
              backgroundColor: author.primaryColor || '#444', 
              color: '#fff' 
            }}
          >
            {author.packName}
          </div>
          {author.rank && (
            <div 
              className="text-xs font-bold uppercase tracking-wider py-1 px-2 mt-1 rounded"
              style={{ 
                backgroundColor: author.secondaryColor || '#666', 
                color: '#000' 
              }}
            >
              {author.rank}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-400 w-full text-left mt-4 space-y-1">
        <div className="flex justify-between">
          <span>Sex:</span>
          <span className="text-gray-300">{author.sex}</span>
        </div>
        <div className="flex justify-between">
          <span>Age:</span>
          <span className="text-gray-300">{author.age}</span>
        </div>
        <div className="flex justify-between">
          <span>Health:</span>
          <span className="text-gray-300">{author.healthStatus}</span>
        </div>
        <div className="flex justify-between">
          <span>Skill Points:</span>
          <span className="text-gray-300">{author.skillPoints}</span>
        </div>
      </div>
    </div>
  );
};

const ThreadView: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { activeCharacter } = useOutletContext<{ activeCharacter?: Character }>();
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchThread = () => {
    if (!threadId) return;
    
    fetch(`/api/threads/${threadId}`)
      .then(res => res.json())
      .then(data => {
        setThread(data);
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
    
    if (!activeCharacter) {
        alert("Please select a character to post.");
        return;
    }

    setIsPosting(true);
    try {
        const response = await fetch(`/api/threads/${threadId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: replyContent,
                authorId: activeCharacter.id
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

  if (loading) return <div>Loading...</div>;
  if (!thread) return <div>Thread not found</div>;

  // Construct author object for the main post from thread data
  const mainAuthor: PostAuthor = {
    id: thread.authorId,
    name: thread.authorName,
    imageUrl: thread.authorImage,
    packName: thread.packName,
    primaryColor: thread.primaryColor,
    secondaryColor: thread.secondaryColor,
    rank: thread.rank,
    sex: thread.sex || 'Unknown',
    age: thread.age ? `${thread.age} months` : 'Unknown',
    healthStatus: thread.healthStatus || 'Unknown',
    skillPoints: thread.skillPoints || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white">{thread.title}</h1>
        <div className="text-sm text-gray-400">
          Started {new Date(thread.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Original Post */}
      <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
        <CharacterPostInfo author={mainAuthor} />
        <div className="flex-grow p-6 relative">
          {activeCharacter && String(activeCharacter.id) === String(mainAuthor.id) && (
            <div className="absolute top-2 right-2">
              <button 
                onClick={() => handleEditClick(thread.postId, thread.content)}
                className="text-gray-400 hover:text-white text-sm bg-gray-800 px-2 py-1 rounded"
              >
                Edit
              </button>
            </div>
          )}
          
          {thread.modifiedAt && thread.createdAt !== thread.modifiedAt && (
             <div className="text-xs text-gray-400 mb-2 italic">
                Edited by {thread.modifiedByName || 'Unknown'} on {new Date(thread.modifiedAt).toLocaleString()}
             </div>
          )}

          {editingPostId === thread.postId ? (
            <div className="bg-gray-800 p-4 rounded">
              <RichTextEditor value={editContent} onChange={setEditContent} />
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                <button onClick={() => handleSaveEdit(thread.postId)} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500">Save</button>
              </div>
            </div>
          ) : (
            <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: thread.content }}
            />
          )}
        </div>
      </div>

      {/* Replies */}
      {thread.replies?.map((reply: any) => {
        const replyAuthor: PostAuthor = {
            id: reply.authorId,
            name: reply.authorName,
            imageUrl: reply.authorImage,
            packName: reply.packName,
            primaryColor: reply.primaryColor,
            secondaryColor: reply.secondaryColor,
            rank: reply.rank,
            sex: reply.sex || 'Unknown',
            age: reply.age ? `${reply.age} months` : 'Unknown',
            healthStatus: reply.healthStatus || 'Unknown',
            skillPoints: reply.skillPoints || 0
        };

        return (
          <div key={reply.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
            <CharacterPostInfo author={replyAuthor} />
            <div className="flex-grow p-6 relative">
              <div className="text-xs text-gray-400 mb-4 border-b border-gray-600 pb-2 flex justify-between items-center">
                <span>Posted {new Date(reply.createdAt).toLocaleString()}</span>
                {activeCharacter && String(activeCharacter.id) === String(replyAuthor.id) && (
                    <button 
                        onClick={() => handleEditClick(reply.id, reply.content)}
                        className="text-gray-400 hover:text-white text-sm bg-gray-800 px-2 py-1 rounded"
                    >
                        Edit
                    </button>
                )}
              </div>

              {reply.modifiedAt && reply.createdAt !== reply.modifiedAt && (
                 <div className="text-xs text-gray-400 mb-2 italic">
                    Edited by {reply.modifiedByName || 'Unknown'} on {new Date(reply.modifiedAt).toLocaleString()}
                 </div>
              )}

              {editingPostId === reply.id ? (
                <div className="bg-gray-800 p-4 rounded">
                  <RichTextEditor value={editContent} onChange={setEditContent} />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleCancelEdit} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">Cancel</button>
                    <button onClick={() => handleSaveEdit(reply.id)} className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-500">Save</button>
                  </div>
                </div>
              ) : (
                <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: reply.content }}
                />
              )}
            </div>
          </div>
        );
      })}


      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
        <h3 className="text-lg font-bold mb-4">Post a Reply</h3>
        <div className="bg-gray-700 text-white border border-gray-600 rounded">
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
            className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold ${isPosting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isPosting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
