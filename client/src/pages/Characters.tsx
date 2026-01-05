import React, { useState, useEffect, useMemo } from 'react';
import type { Character } from '../types';

type SortField = 'name' | 'userId' | 'packName' | 'age' | 'healthStatus' | 'totalSkill';
type SortDirection = 'asc' | 'desc';

const Characters: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch characters', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCharacters = useMemo(() => {
    return [...characters].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'userId':
          aVal = String(a.userId || '').toLowerCase();
          bVal = String(b.userId || '').toLowerCase();
          break;
        case 'packName':
          aVal = (a.packName || 'Rogue').toLowerCase();
          bVal = (b.packName || 'Rogue').toLowerCase();
          break;
        case 'age':
          aVal = a.monthsAge || 0;
          bVal = b.monthsAge || 0;
          break;
        case 'healthStatus':
          aVal = (a.healthStatus || '').toLowerCase();
          bVal = (b.healthStatus || '').toLowerCase();
          break;
        case 'totalSkill':
          aVal = a.totalSkill || 0;
          bVal = b.totalSkill || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [characters, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="ml-1 w-3 h-3 inline text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return <div className="text-center mt-10 text-white">Loading characters...</div>;
  }

  return (
    <section className="bg-white border border-gray-300 shadow">
      <div className="bg-[#2f3a2f] px-4 py-2 uppercase text-xs font-normal tracking-wider text-[#fff9] dark-header">
        Character Directory
      </div>
      <div className="px-4 py-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Active Characters</h3>
        <p className="text-sm text-gray-600 mb-3">There are currently {characters.length} wolves in Horizon:</p>
        <div className="border border-gray-300 mx-0.5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700 uppercase tracking-wide text-xs">
                <th className="px-3 py-2 text-left w-24 border-r border-gray-300"></th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('name')}
                >
                  Name<SortIcon field="name" />
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('userId')}
                >
                  Player<SortIcon field="userId" />
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('packName')}
                >
                  Pack<SortIcon field="packName" />
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('age')}
                >
                  Age<SortIcon field="age" />
                </th>
                <th 
                  className="px-3 py-2 text-left border-r border-gray-300 cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('healthStatus')}
                >
                  Health<SortIcon field="healthStatus" />
                </th>
                <th 
                  className="px-3 py-2 text-center cursor-pointer hover:bg-gray-300 select-none"
                  onClick={() => handleSort('totalSkill')}
                >
                  Skill Points<SortIcon field="totalSkill" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCharacters.map(char => (
                <tr key={char.id} className="hover:bg-gray-50 transition-colors align-top border-t border-gray-300">
                  <td className="p-0 w-24 border-r border-gray-300">
                    <img 
                      src={char.imageUrl} 
                      alt={char.name} 
                      className="w-full h-auto object-cover"
                    />
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-800 border-r border-gray-300">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 hover:underline cursor-pointer">{char.name}</span>
                      {!!char.isOnline && (
                        <span className="w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm" title="Online Now"></span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.userId || 'Unknown'}</td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.packName || 'Rogue'}</td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.age}</td>
                  <td className="px-3 py-3 text-gray-700 border-r border-gray-300">{char.healthStatus || 'Unknown'}</td>
                  <td className="px-3 py-3 text-center font-bold text-gray-900">{char.totalSkill || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Characters;
