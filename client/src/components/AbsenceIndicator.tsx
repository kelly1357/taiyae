import React from 'react';

interface AbsenceIndicatorProps {
  absenceNote?: string | null;
  className?: string;
}

/**
 * A 💤 emoji indicator that shows when a player has marked themselves as absent.
 * Includes a tooltip with "Absent" and optionally the player's note.
 */
const AbsenceIndicator: React.FC<AbsenceIndicatorProps> = ({ absenceNote, className = '' }) => {
  const tooltipText = absenceNote ? `Absent — ${absenceNote}` : 'Absent';
  
  return (
    <span 
      className={`relative group cursor-default ${className}`}
    >
      <span className="text-sm">💤</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tooltipText}
      </span>
    </span>
  );
};

export default AbsenceIndicator;
