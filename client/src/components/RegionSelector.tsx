import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ForumRegion } from '../types';

interface RegionSelectorProps {
  onSelect?: (regionId: string) => void;
  className?: string;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ onSelect, className = '' }) => {
  const [regions, setRegions] = useState<ForumRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/region')
      .then(res => res.json())
      .then(data => {
        setRegions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch regions:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = e.target.value;
    if (regionId) {
      if (onSelect) {
        onSelect(regionId);
      } else {
        navigate(`/region/${regionId}`);
      }
    }
  };

  if (loading) return <div className="text-gray-400 text-sm">Loading regions...</div>;

  return (
    <div className={`region-selector ${className}`}>
      <label htmlFor="region-select" className="block text-sm font-medium text-gray-300 mb-1">
        Jump to Region
      </label>
      <select
        id="region-select"
        onChange={handleChange}
        className="block w-full bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
        defaultValue=""
      >
        <option value="" disabled>Select a region...</option>
        {regions.map(region => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RegionSelector;
