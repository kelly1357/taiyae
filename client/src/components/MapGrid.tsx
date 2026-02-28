import React, { useState, useRef, useCallback } from 'react';

const COLS = 10;
const ROWS = 10;
const COL_LABELS = 'ABCDEFGHIJ'.split('');
const ROW_LABELS = Array.from({ length: ROWS }, (_, i) => String(i + 1));

interface MapGridProps {
  onOpenFullSize: () => void;
}

const MapGrid: React.FC<MapGridProps> = ({ onOpenFullSize }) => {
  const [showGrid, setShowGrid] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!showGrid || !containerRef.current) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const col = Math.min(Math.floor(x / (100 / COLS)), COLS - 1);
    const row = Math.min(Math.floor(y / (100 / ROWS)), ROWS - 1);
    
    if (col >= 0 && row >= 0) {
      setHoveredCell({ col, row });
    }

    // Position tooltip relative to container
    const containerRect = containerRef.current.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });
  }, [showGrid]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowGrid(prev => !prev)}
          className={`text-xs px-3 py-1.5 border transition-colors ${
            showGrid
              ? 'bg-[#2f3a2f] text-white border-[#2f3a2f]'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-800'
          }`}
        >
          {showGrid ? '✕ Hide Grid' : '⊞ Show Grid'}
        </button>
        <button
          onClick={onOpenFullSize}
          className="text-xs px-3 py-1.5 border border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          ⤢ Full Size
        </button>
        {showGrid && (
          <span className="text-[10px] text-gray-400 italic hidden md:inline">
            Hover to see coordinates
          </span>
        )}
      </div>

      {/* Map + Grid */}
      <div ref={containerRef} className="relative inline-block w-full select-none">
        {/* Edge labels — visible when grid is on */}
        {showGrid && (
          <>
            {/* Column labels (top) */}
            <div className="flex" style={{ paddingLeft: '20px' }}>
              {COL_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-center text-[10px] font-mono transition-colors ${
                    hoveredCell?.col === i ? 'text-[#2f3a2f] font-bold' : 'text-gray-400'
                  }`}
                  style={{ width: `${100 / COLS}%` }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Row labels (left side) — absolutely positioned over the image area */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col" style={{ width: '20px', paddingTop: '18px' }}>
              {ROW_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`flex items-center justify-center text-[10px] font-mono transition-colors ${
                    hoveredCell?.row === i ? 'text-[#2f3a2f] font-bold' : 'text-gray-400'
                  }`}
                  style={{ height: `${100 / ROWS}%` }}
                >
                  {label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Image + SVG overlay */}
        <div style={{ marginLeft: showGrid ? '20px' : '0', transition: 'margin-left 0.2s' }}>
          <div className="relative">
            <img
              src="https://taiyaefiles.blob.core.windows.net/web/map.jpg"
              alt="Horizon Valley Map"
              className="w-full h-auto block"
              draggable={false}
            />

            {/* SVG Grid Overlay */}
            {showGrid && (
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'crosshair' }}
              >
                {/* Grid lines — vertical */}
                {Array.from({ length: COLS + 1 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * cellW}
                    y1={0}
                    x2={i * cellW}
                    y2={100}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="0.15"
                    strokeDasharray={i === 0 || i === COLS ? undefined : '0.5,0.5'}
                  />
                ))}
                {/* Grid lines — horizontal */}
                {Array.from({ length: ROWS + 1 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * cellH}
                    x2={100}
                    y2={i * cellH}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth="0.15"
                    strokeDasharray={i === 0 || i === ROWS ? undefined : '0.5,0.5'}
                  />
                ))}

                {/* Hovered cell highlight */}
                {hoveredCell && (
                  <rect
                    x={hoveredCell.col * cellW}
                    y={hoveredCell.row * cellH}
                    width={cellW}
                    height={cellH}
                    fill="rgba(255, 255, 255, 0.12)"
                    stroke="rgba(255, 255, 255, 0.6)"
                    strokeWidth="0.2"
                  />
                )}

                {/* Invisible interaction layer for each cell */}
                {Array.from({ length: ROWS }, (_, row) =>
                  Array.from({ length: COLS }, (_, col) => (
                    <rect
                      key={`${col}-${row}`}
                      x={col * cellW}
                      y={row * cellH}
                      width={cellW}
                      height={cellH}
                      fill="transparent"
                      onMouseEnter={() => setHoveredCell({ col, row })}
                    />
                  ))
                )}
              </svg>
            )}
          </div>
        </div>

        {/* Hover tooltip (desktop) */}
        {showGrid && hoveredCell && (
          <div
            className="absolute z-20 pointer-events-none hidden md:block"
            style={{
              left: Math.min(tooltipPos.x + 14, (containerRef.current?.offsetWidth || 300) - 70),
              top: tooltipPos.y - 32,
            }}
          >
            <div className="bg-[#2f3a2f]/90 text-white px-2.5 py-1 text-xs font-mono shadow-lg border border-white/20">
              {COL_LABELS[hoveredCell.col]}-{ROW_LABELS[hoveredCell.row]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapGrid;
