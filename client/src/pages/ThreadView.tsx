import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

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
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [threadId]);

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
    // These might be missing from the thread query if not joined, but let's assume they are or handle gracefully
    sex: 'Unknown', 
    age: 'Unknown',
    healthStatus: 'Unknown',
    skillPoints: 0
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
        <div className="flex-grow p-6">
          <div className="prose prose-invert max-w-none">
            <p>
              {/* Placeholder content for the main post */}
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
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
            sex: reply.sex,
            age: reply.age,
            healthStatus: reply.healthStatus,
            skillPoints: reply.skillPoints
        };

        return (
          <div key={reply.id} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row">
            <CharacterPostInfo author={replyAuthor} />
            <div className="flex-grow p-6">
              <div className="text-xs text-gray-400 mb-4 border-b border-gray-600 pb-2">
                Posted {new Date(reply.createdAt).toLocaleString()}
              </div>
              <div className="prose prose-invert max-w-none">
                <p>{reply.content}</p>
              </div>
            </div>
          </div>
        );
      })}


      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-8">
        <h3 className="text-lg font-bold mb-4">Post a Reply</h3>
        <textarea 
          className="w-full bg-gray-700 text-white border border-gray-600 rounded p-4 h-32 focus:outline-none focus:border-blue-500"
          placeholder="Write your reply here..."
        ></textarea>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">
            Post Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;
