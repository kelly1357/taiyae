import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface SearchResult {
  WikiPageID: number;
  Slug: string;
  Title: string;
  IsHandbook: boolean;
  Snippet?: string;
}

const WikiSearchBox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setSearching(true);
    try {
      const response = await fetch(`/api/wiki-search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="bg-white border border-stone-300 mb-4">
      <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
        Search the Wiki
      </div>
      <div className="p-4">
        <div className="flex">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 border border-stone-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#2f3a2f]"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-[#2f3a2f] text-white px-4 py-2 text-sm hover:bg-[#3d4a3d] transition-colors disabled:opacity-50"
          >
            {searching ? '...' : 'Go'}
          </button>
        </div>
        {showSearchResults && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
              <button onClick={clearSearch} className="text-xs text-[#2f3a2f] hover:underline">Clear</button>
            </div>
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <Link
                    key={result.WikiPageID}
                    to={result.IsHandbook ? `/wiki/${result.Slug}` : `/wiki/user/${result.Slug}`}
                    className="block p-2 border border-stone-200 hover:bg-stone-50 transition-colors"
                    onClick={clearSearch}
                  >
                    <div className="text-sm font-medium text-[#2f3a2f]">{result.Title}</div>
                    {result.Snippet && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{result.Snippet}</div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No results found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WikiSearchBox;
