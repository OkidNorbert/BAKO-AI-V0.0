import React from 'react';

const TacticalBoard = ({ players, ball, isDarkMode }) => {
    // Basketball court proportions: 28m x 15m (width x height)
    // Use 280x150 for scaled rendering (10x scale factor)
    const width = 280;
    const height = 150;

    return (
        <div className={`relative rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'} border shadow-inner`} style={{ aspectRatio: '28/15', width: '100%' }}>
            {/* Court Lines (SVG) */}
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
                {/* Court background */}
                <rect x="0" y="0" width={width} height={height} fill={isDarkMode ? '#1a1a1a' : '#d4a574'} />
                
                {/* Outer boundary */}
                <rect x="0" y="0" width={width} height={height} fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1.5" />

                {/* Mid court line (center) */}
                <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1.5" />

                {/* Center circle */}
                <circle cx={width / 2} cy={height / 2} r="6" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />
                <circle cx={width / 2} cy={height / 2} r="1.5" fill={isDarkMode ? '#666' : '#8B4513'} />

                {/* LEFT BASKET AREA */}
                {/* Key/Paint (5.79m x 4.88m from baseline) */}
                <rect x="0" y={(height - 48.8) / 2} width="57.9" height="48.8" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1.5" />
                
                {/* Free throw circle (top) */}
                <circle cx="57.9" cy={(height - 48.8) / 2} r="18" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />
                
                {/* Free throw circle (bottom) */}
                <circle cx="57.9" cy={(height + 48.8) / 2} r="18" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />
                
                {/* Three-point line - left */}
                <path d={`M 0 14 Q 40 ${height / 2} 0 ${height - 14}`} fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />

                {/* RIGHT BASKET AREA (mirror) */}
                {/* Key/Paint */}
                <rect x={width - 57.9} y={(height - 48.8) / 2} width="57.9" height="48.8" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1.5" />
                
                {/* Free throw circle (top) */}
                <circle cx={width - 57.9} cy={(height - 48.8) / 2} r="18" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />
                
                {/* Free throw circle (bottom) */}
                <circle cx={width - 57.9} cy={(height + 48.8) / 2} r="18" fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />
                
                {/* Three-point line - right */}
                <path d={`M ${width} 14 Q ${width - 40} ${height / 2} ${width} ${height - 14}`} fill="none" stroke={isDarkMode ? '#666' : '#8B4513'} strokeWidth="1" />

                {/* Baskets (hoops) */}
                <circle cx="4" cy={height / 2} r="1.8" fill="none" stroke="#ff6b00" strokeWidth="1.5" />
                <circle cx={width - 4} cy={height / 2} r="1.8" fill="none" stroke="#ff6b00" strokeWidth="1.5" />

                {/* Players */}
                {players && Array.isArray(players) && players.map(player => (
                    (player.tactical_x !== undefined && player.tactical_y !== undefined) && (
                        <g key={player.id}>
                            <circle
                                cx={player.tactical_x}
                                cy={player.tactical_y}
                                r="3.5"
                                fill={player.team === 1 ? '#3b82f6' : '#ef4444'}
                                className="transition-all duration-200"
                            />
                            <text
                                x={player.tactical_x}
                                y={player.tactical_y}
                                fontSize="2.5"
                                textAnchor="middle"
                                dy=".2em"
                                fill="white"
                                fontWeight="bold"
                                className="pointer-events-none"
                            >
                                {player.number || '?'}
                            </text>
                        </g>
                    )
                ))}

                {/* Ball */}
                {ball && (ball.tactical_x !== undefined && ball.tactical_y !== undefined) && (
                    <circle
                        cx={ball.tactical_x}
                        cy={ball.tactical_y}
                        r="1.2"
                        fill="#f97316"
                        className="transition-all duration-200"
                    >
                        <animate attributeName="r" values="1;1.5;1" dur="1s" repeatCount="indefinite" />
                    </circle>
                )}
            </svg>

            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white backdrop-blur-sm">
                Tactical 2D View (Live)
            </div>
        </div>
    );
};

export default TacticalBoard;
