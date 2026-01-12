import { useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import WikiEditModal from '../../components/WikiEditModal';
import { useWikiContent } from '../../hooks/useWikiContent';
import type { User } from '../../types';

interface WikiArticle {
  title: string;
  path: string;
}

const articles: WikiArticle[] = [
  { title: 'Absences and Scarcity', path: '/wiki/absences-and-scarcity' },
  { title: 'Achievements', path: '/wiki/achievements' },
  { title: 'Activity Checks', path: '/wiki/activity-checks' },
  { title: 'FAQ', path: '/wiki/faq' },
  { title: 'Game Overview', path: '/wiki/game-overview' },
  { title: 'Getting Started', path: '/wiki/getting-started' },
  { title: 'Map', path: '/wiki/map' },
  { title: 'Offscreen Interactions', path: '/wiki/offscreen-interactions' },
  { title: 'Pack Creation', path: '/wiki/pack-creation' },
  { title: 'Profile Help', path: '/wiki/profile-help' },
  { title: 'Rules: Compilation', path: '/wiki/rules-compilation' },
  { title: 'Rules: General', path: '/wiki/rules-general' },
  { title: 'Rules: Mind Reading', path: '/wiki/rules-mind-reading' },
  { title: 'Setting Overview', path: '/wiki/setting-overview' },
  { title: 'Skill Points', path: '/wiki/skill-points' },
  { title: 'Spirit Symbols', path: '/wiki/spirit-symbols' },
  { title: 'Three Strike Rule', path: '/wiki/three-strike-rule' },
  { title: 'Using Tags', path: '/wiki/using-tags' },
  { title: 'Wolf Guide', path: '/wiki/wolf-guide' },
  { title: 'Wolf Guide: Fighting', path: '/wiki/wolf-guide-fighting' },
  { title: 'Wolf Guide: Pup Development', path: '/wiki/wolf-guide-pup-development' },
];

export default function Handbook() {
  const { user } = useOutletContext<{ user?: User }>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isModerator = user?.isModerator || user?.isAdmin;
  const [searchTerm, setSearchTerm] = useState('');
  const { dbContent, loading } = useWikiContent('handbook');

  // Group articles by first letter
  const groupedArticles = useMemo(() => {
    const filtered = articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, WikiArticle[]> = {};
    filtered.forEach(article => {
      const letter = article.title[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(article);
    });

    // Sort articles within each group
    Object.keys(groups).forEach(letter => {
      groups[letter].sort((a, b) => a.title.localeCompare(b.title));
    });

    return groups;
  }, [searchTerm]);

  const sortedLetters = Object.keys(groupedArticles).sort();
  const totalArticles = articles.length;

  // Get all unique letters from all articles (for alphabet navigation)
  const allLetters = useMemo(() => {
    const letters = new Set<string>();
    articles.forEach(article => {
      letters.add(article.title[0].toUpperCase());
    });
    return Array.from(letters).sort();
  }, []);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="bg-white border border-gray-300 shadow">
      {/* Header */}
      <div className="bg-[#2f3a2f] px-4 py-2 dark-header flex items-center justify-between">
        <h2 className="text-xs font-normal uppercase tracking-wider text-[#fff9]">Wiki</h2>
        {isModerator && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs text-white/70 hover:text-white"
          >
            Edit Page
          </button>
        )}
      </div>

      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-xs mb-2 text-gray-600">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">›</span>
          <span>Wiki</span>
          <span className="mx-2">›</span>
          <span>Category: Handbook</span>
        </nav>

        <h1 className="text-xl font-bold text-gray-900 mb-4">Category: Handbook</h1>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-6">
          The Handbook is the "official" source of game rules and information.
        </p>

        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : dbContent ? (
          <div 
            className="wiki-content text-xs text-gray-800"
            dangerouslySetInnerHTML={{ __html: dbContent }}
          />
        ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">

            {/* Alphabet Navigation */}
            <div className="bg-white border border-stone-300 p-2 mb-6">
              <div className="flex flex-wrap gap-1 justify-center">
                {allLetters.map(letter => (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`w-6 h-6 text-sm flex items-center justify-center font-bold transition-colors ${
                      groupedArticles[letter]
                        ? 'text-[#2f3a2f] hover:bg-[#2f3a2f] hover:text-white'
                        : 'text-stone-300 cursor-not-allowed'
                    }`}
                    disabled={!groupedArticles[letter]}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Count */}
            <div className="mb-4">
              <h2 className="text-base font-semibold text-stone-800">
                Articles in category "Handbook":
              </h2>
              <p className="text-xs text-stone-600">
                There are {searchTerm ? Object.values(groupedArticles).flat().length : totalArticles} articles in this category
                {searchTerm && ` matching "${searchTerm}"`}:
              </p>
            </div>

            {/* Articles by Letter */}
            {sortedLetters.length > 0 ? (
              <div className="space-y-6">
                {sortedLetters.map(letter => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-4">
                    <h3 className="text-xs font-normal uppercase tracking-wider text-gray-500 border-b border-gray-300 pb-1 mb-2">
                      {letter}
                    </h3>
                    <div className="flex flex-col">
                      {groupedArticles[letter].map(article => (
                        <Link
                          key={article.path}
                          to={article.path}
                          className="text-sm text-[#2f3a2f] hover:underline py-0.5 block"
                        >
                          {article.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-stone-300 p-8 text-center">
                <p className="text-stone-600">No articles found matching "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-72">
            {/* Search Box */}
            <div className="bg-white border border-stone-300 mb-4">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Search the Wiki
              </div>
              <div className="p-4">
                <div className="flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search articles..."
                    className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-[#2f3a2f]"
                  />
                  <button
                    onClick={() => {}}
                    className="bg-[#2f3a2f] text-white px-4 py-2 text-sm hover:bg-[#3d4a3d] transition-colors"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-stone-300">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Links
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li>
                    <Link to="/wiki/handbook" className="text-[#2f3a2f] hover:underline">
                      Index
                    </Link>
                  </li>
                  <li>
                    <Link to="/wiki/game-overview" className="text-[#2f3a2f] hover:underline">
                      Game Overview
                    </Link>
                  </li>
                  <li>
                    <Link to="/wiki/getting-started" className="text-[#2f3a2f] hover:underline">
                      Getting Started
                    </Link>
                  </li>
                  <li>
                    <Link to="/wiki/rules-compilation" className="text-[#2f3a2f] hover:underline">
                      Rules: Compilation
                    </Link>
                  </li>
                  <li>
                    <Link to="/wiki/faq" className="text-[#2f3a2f] hover:underline">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Jump to Letter */}
            <div className="bg-white border border-stone-300 mt-4">
              <div className="bg-[#2f3a2f] text-white px-4 py-2 font-semibold">
                Jump to Letter
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-1">
                  {allLetters.map(letter => (
                    <button
                      key={letter}
                      onClick={() => scrollToLetter(letter)}
                      className={`w-7 h-7 text-sm flex items-center justify-center font-semibold border transition-colors ${
                        groupedArticles[letter]
                          ? 'border-[#2f3a2f] text-[#2f3a2f] hover:bg-[#2f3a2f] hover:text-white'
                          : 'border-stone-200 text-stone-300 cursor-not-allowed'
                      }`}
                      disabled={!groupedArticles[letter]}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      <WikiEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        slug="handbook"
        title="Handbook"
        userId={user?.id}
      />
    </section>
  );
}
