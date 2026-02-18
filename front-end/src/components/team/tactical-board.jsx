import React from 'react';

const TacticalBoard = ({ players, ball, isDarkMode }) => {
    // dimensions matching backend TacticalViewConverter: 300x161
    const width = 300;
    const height = 161;

    // Actual court proportions are 28m x 15m.
    // 300/161 is slightly off from 28/15 (which is ~1.86). 300/161 is ~1.863. Close enough.

    return (
        <div className={`relative rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'} border shadow-inner`} style={{ aspectRatio: '300/161', width: '100%' }}>
            {/* Court Lines (SVG) */}
            <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full">
                {/* Boundary */}
                <rect x="0" y="0" width={width} height={height} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Mid court line */}
                <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Center circle */}
                <circle cx={width / 2} cy={height / 2} r={height * 0.15} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Left Three Point Line (simplified) */}
                <path d={`M 0 ${height * 0.1} Q ${width * 0.25} ${height / 2} 0 ${height * 0.9}`} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Right Three Point Line (simplified) */}
                <path d={`M ${width} ${height * 0.1} Q ${width * 0.75} ${height / 2} ${width} ${height * 0.9}`} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Left Key/Paint */}
                <rect x="0" y={height * 0.3} width={width * 0.15} height={height * 0.4} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Right Key/Paint */}
                <rect x={width * 0.85} y={height * 0.3} width={width * 0.15} height={height * 0.4} fill="none" stroke={isDarkMode ? '#4b5563' : '#9ca3af'} strokeWidth="2" />

                {/* Players */}
                {players.map(player => (
                    (player.tactical_x !== undefined && player.tactical_y !== undefined) && (
                        <g key={player.id}>
                            <circle
                                cx={player.tactical_x}
                                cy={player.tactical_y}
                                r="6"
                                fill={player.team === 'home' ? '#3b82f6' : '#ef4444'}
                                className="transition-all duration-200"
                            />
                            <text
                                x={player.tactical_x}
                                y={player.tactical_y}
                                fontSize="6"
                                textAnchor="middle"
                                dy=".3em"
                                fill="white"
                                className="pointer-events-none"
                            >
                                {player.number}
                            </text>
                        </g>
                    )
                ))}

                {/* Ball */}
                {ball && ball.tactical_x !== undefined && (
                    <circle
                        cx={ball.tactical_x}
                        cy={ball.tactical_y}
                        r="4"
                        fill="#f97316"
                        className="transition-all duration-200"
                    >
                        <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                    </circle>
                )}
            </svg>

            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white backdrop-blur-sm">
                Tactical 2D View
            </div>
        </div>
    );
};

export default TacticalBoard;
