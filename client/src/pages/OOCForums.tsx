import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { OOCForum } from '../types';

const OOCForums: React.FC = () => {
  const [oocForums, setOocForums] = useState<OOCForum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ooc-forums')
      .then(res => res.json())
      .then(data => {
        // Hide Advertising and Affiliation forum (ID 8) for now
        setOocForums(data.filter((f: OOCForum) => String(f.id) !== '8'));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch OOC forums:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center mt-10 text-gray-600">Loading forums...</div>;
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
        Out of Character Forums
      </div>
      <div className="px-4 py-4">
        {oocForums.length === 0 ? (
          <div className="text-gray-600 text-sm">No forums available.</div>
        ) : (
          <div className="space-y-0">
            {oocForums.map((forum) => (
              <div key={forum.id} className="mx-0.5">
                <table className="w-full border border-gray-300 text-sm bg-white mb-[-1px]">
                  <thead>
                    <tr>
                      <th colSpan={2} className="bg-gray-200 px-4 py-2 text-left border-b border-gray-300">
                        <Link
                          to={`/ooc-forum/${forum.id}`}
                          state={{ forum }}
                          className="text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-gray-900"
                        >
                          {forum.title}
                        </Link>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="align-top px-4 py-3 text-gray-800 border-r border-gray-300 w-2/3">
                        <p className="text-gray-600 html-description" dangerouslySetInnerHTML={{ __html: forum.description }} />
                      </td>
                      <td className="align-top px-4 py-3 text-gray-800 w-1/3">
                        {forum.latestThreadId ? (
                          <div className="space-y-1">
                            <Link
                              to={`/thread/${forum.latestThreadId}`}
                              state={{ forum }}
                              className="font-semibold text-gray-900 hover:underline"
                            >
                              {forum.latestThreadTitle}
                            </Link>
                            <div className="text-sm text-gray-700 flex items-center gap-1">
                              by {forum.latestThreadAuthorName || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Updated {new Date(forum.latestThreadUpdatedAt!).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            No threads yet
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OOCForums;
