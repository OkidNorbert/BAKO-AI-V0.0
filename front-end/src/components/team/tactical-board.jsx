import React from 'react';
import { Zap, Activity } from 'lucide-react';

/**
 * TacticalBoard — NBA/FIBA-accurate basketball court SVG
 *
 * FIBA Official Court Dimensions (Article 2, Oct 2018 Rules):
 *   Court:           28m × 15m
 *   Centre circle:   1.80m radius
 *   Key (paint):     4.90m wide × 5.80m deep (baseline → FT line)
 *   FT line:         5.80m from inner edge of endline
 *   3-pt line arc:   6.75m radius from basket centre
 *   Corner 3:        0.90m from sideline (vertical segment to arc)
 *   Basket centre:   1.575m from inner edge of endline, y = midcourt
 *   Backboard:       1.20m from inner edge of endline
 *   No-charge arc:   1.25m radius from basket centre
 *
 * SVG viewBox: "0 0 94 50"   (28m→92px + 1px border each side, 15m→48px + 1px each side)
 *   sx = 92/28 = 3.2857 px/m
 *   sy = 48/15 = 3.2000 px/m
 *
 * Backend tactical space: 280 × 150 (10px/m both axes)
 *   mapX(bx) = 1 + (bx / 280) * 92
 *   mapY(by) = 1 + (by / 150) * 48
 */

// ── Scale helpers (SVG units per metre) ──────────────────────────────────────
const SX = 92 / 28;   // 3.2857
const SY = 48 / 15;   // 3.2000

// ── Key Coordinates (all in SVG units) ───────────────────────────────────────
// Left basket
const LBX = 1 + 1.575 * SX;           // ≈ 6.17
const BY = 25;                         // vertical centre

// Right basket
const RBX = 93 - 1.575 * SX;          // ≈ 86.83

// Key / paint
const KEY_W = 5.80 * SX;             // ≈ 19.06 (depth from endline)
const KEY_H = 4.90 * SY;             // ≈ 15.68 (width)
const KEY_TOP = BY - KEY_H / 2;        // ≈ 17.16
const KEY_BOT = BY + KEY_H / 2;        // ≈ 32.84
const LFT_X = 1 + KEY_W;            // Left FT line x ≈ 20.06
const RFT_X = 93 - KEY_W;           // Right FT line x ≈ 73.94

// Free-throw circle
const FT_RX = 1.80 * SX;              // ≈ 5.91
const FT_RY = 1.80 * SY;              // ≈ 5.76

// 3-point line
const C3_Y_OFF = 0.90 * SY;           // corner offset from sideline ≈ 2.88
const C3_TOP = 1 + C3_Y_OFF;        // corner line y (top)    ≈ 3.88
const C3_BOT = 49 - C3_Y_OFF;       // corner line y (bottom) ≈ 46.12
// horizontal extent of corner line from endline
const C3_DEPTH = (1.575 + Math.sqrt(6.75 ** 2 - (7.5 - 0.90) ** 2)) * SX; // ≈ 10.83
const LC3_X = 1 + C3_DEPTH;        // left corner line end x ≈ 11.83
const RC3_X = 93 - C3_DEPTH;       // right corner line end x ≈ 82.17
// arc dimensions
const ARC_RX = 6.75 * SX;             // ≈ 22.18
const ARC_RY = 6.75 * SY;             // ≈ 21.60

// No-charge (restricted area) semi-circle
const NC_RX = 1.25 * SX;              // ≈ 4.11
const NC_RY = 1.25 * SY;              // ≈ 4.00
const NC_TOP = BY - NC_RY;            // ≈ 21.00
const NC_BOT = BY + NC_RY;            // ≈ 29.00

// Backboard
const L_BB_X = 1 + 1.20 * SX;        // ≈ 4.94
const R_BB_X = 93 - 1.20 * SX;       // ≈ 89.06
const BB_HALF = (1.83 / 2) * SY;     // 1.83m wide → ≈ 2.93 each side
const BB_TOP = BY - BB_HALF;
const BB_BOT = BY + BB_HALF;

// ── Line style constants ──────────────────────────────────────────────────────
const LINE = { stroke: 'rgba(255,255,255,0.30)', strokeWidth: 0.28 };
const LINE_DIM = { stroke: 'rgba(255,255,255,0.18)', strokeWidth: 0.22 };
const ORANGE = '#ff7a18';


// ── Component ────────────────────────────────────────────────────────────────
const TacticalBoard = ({ players, ball, isDarkMode, team1Stats, team2Stats }) => {
    // Backend 280×150 → SVG court area (1..93 × 1..49)
    const mapX = (bx) => 1 + (bx / 280) * 92;
    const mapY = (by) => 1 + (by / 150) * 48;

    const PossessionIndicator = ({ team, color }) => (
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'
            } backdrop-blur-md border border-white/10 shadow-lg`}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{team} Possession</span>
        </div>
    );

    return (
        <div className="flex flex-col space-y-4">
            {/* ── Court container ── */}
            <div
                className="relative w-full rounded-xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl hover:shadow-indigo-500/10 transition-all"
                style={{ aspectRatio: '94/50', minHeight: '260px' }}
            >
                {/* Possession HUD */}
                <div className="absolute top-2 inset-x-2 flex items-start z-10 pointer-events-none">
                    <div className="flex flex-col space-y-1">
                        {ball?.has_possession === 1 && <PossessionIndicator team="Home" color="#3b82f6" />}
                        {ball?.has_possession === 2 && <PossessionIndicator team="Away" color="#ef4444" />}
                    </div>
                </div>

                {/* ── NBA / FIBA Basketball Court SVG ── */}
                <svg
                    viewBox="0 0 94 50"
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full z-0"
                >
                    <defs>
                        <linearGradient id="crtBg" x1="0" x2="1" y1="0" y2="1">
                            <stop offset="0%" stopColor="#0b0f14" />
                            <stop offset="100%" stopColor="#05070a" />
                        </linearGradient>
                    </defs>

                    {/* Background */}
                    <rect x="0" y="0" width="94" height="50" fill="url(#crtBg)" />

                    {/* ── Boundary ── */}
                    <rect x="1" y="1" width="92" height="48" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.35" />

                    {/* ════════════ LEFT HALF ════════════ */}

                    {/* Left painted area (key / lane) */}
                    <rect
                        x="1" y={KEY_TOP} width={KEY_W} height={KEY_H}
                        fill="rgba(59,130,246,0.07)"
                        {...LINE}
                    />

                    {/* Left free-throw circle — lower half dashed inside lane */}
                    <path
                        d={`M ${LFT_X} ${KEY_TOP} A ${FT_RX} ${FT_RY} 0 0 1 ${LFT_X} ${KEY_BOT}`}
                        fill="none" {...LINE_DIM} strokeDasharray="1,0.6"
                    />
                    <path
                        d={`M ${LFT_X} ${KEY_TOP} A ${FT_RX} ${FT_RY} 0 0 0 ${LFT_X} ${KEY_BOT}`}
                        fill="none" {...LINE}
                    />

                    {/* Left no-charge semi-circle */}
                    <path
                        d={`M ${LBX} ${NC_TOP} A ${NC_RX} ${NC_RY} 0 0 1 ${LBX} ${NC_BOT}`}
                        fill="none" stroke={ORANGE} strokeWidth="0.22" opacity="0.6"
                    />

                    {/* Left backboard */}
                    <line x1={L_BB_X} y1={BB_TOP} x2={L_BB_X} y2={BB_BOT}
                        stroke="rgba(255,255,255,0.50)" strokeWidth="0.5"
                    />

                    {/* Left basket (rim) */}
                    <circle cx={LBX} cy={BY} r="0.72" fill="none" stroke={ORANGE} strokeWidth="0.35" />

                    {/* Left corner 3-pt lines */}
                    <line x1="1" y1={C3_TOP} x2={LC3_X} y2={C3_TOP} {...LINE_DIM} />
                    <line x1="1" y1={C3_BOT} x2={LC3_X} y2={C3_BOT} {...LINE_DIM} />

                    {/* Left 3-pt arc */}
                    <path
                        d={`M ${LC3_X} ${C3_TOP} A ${ARC_RX} ${ARC_RY} 0 1 1 ${LC3_X} ${C3_BOT}`}
                        fill="none" {...LINE_DIM}
                    />

                    {/* ════════════ RIGHT HALF ════════════ */}

                    {/* Right painted area */}
                    <rect
                        x={RFT_X} y={KEY_TOP} width={KEY_W} height={KEY_H}
                        fill="rgba(239,68,68,0.05)"
                        {...LINE}
                    />

                    {/* Right free-throw circle */}
                    <path
                        d={`M ${RFT_X} ${KEY_TOP} A ${FT_RX} ${FT_RY} 0 0 0 ${RFT_X} ${KEY_BOT}`}
                        fill="none" {...LINE_DIM} strokeDasharray="1,0.6"
                    />
                    <path
                        d={`M ${RFT_X} ${KEY_TOP} A ${FT_RX} ${FT_RY} 0 0 1 ${RFT_X} ${KEY_BOT}`}
                        fill="none" {...LINE}
                    />

                    {/* Right no-charge semi-circle */}
                    <path
                        d={`M ${RBX} ${NC_TOP} A ${NC_RX} ${NC_RY} 0 0 0 ${RBX} ${NC_BOT}`}
                        fill="none" stroke={ORANGE} strokeWidth="0.22" opacity="0.6"
                    />

                    {/* Right backboard */}
                    <line x1={R_BB_X} y1={BB_TOP} x2={R_BB_X} y2={BB_BOT}
                        stroke="rgba(255,255,255,0.50)" strokeWidth="0.5"
                    />

                    {/* Right basket (rim) */}
                    <circle cx={RBX} cy={BY} r="0.72" fill="none" stroke={ORANGE} strokeWidth="0.35" />

                    {/* Right corner 3-pt lines */}
                    <line x1="93" y1={C3_TOP} x2={RC3_X} y2={C3_TOP} {...LINE_DIM} />
                    <line x1="93" y1={C3_BOT} x2={RC3_X} y2={C3_BOT} {...LINE_DIM} />

                    {/* Right 3-pt arc */}
                    <path
                        d={`M ${RC3_X} ${C3_TOP} A ${ARC_RX} ${ARC_RY} 0 1 0 ${RC3_X} ${C3_BOT}`}
                        fill="none" {...LINE_DIM}
                    />

                    {/* ════════════ CENTRE ════════════ */}

                    {/* Centre line */}
                    <line x1="47" y1="1" x2="47" y2="49" stroke="rgba(255,255,255,0.28)" strokeWidth="0.28" />

                    {/* Centre circle */}
                    <ellipse cx="47" cy={BY} rx={FT_RX} ry={FT_RY}
                        fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.28"
                    />

                    {/* Centre dot */}
                    <circle cx="47" cy={BY} r="0.4" fill="rgba(255,255,255,0.40)" />

                    {/* ════════════ LIVE PLAYER MARKERS ════════════ */}
                    {Array.isArray(players) && players.map(player =>
                        player?.tactical_x !== undefined && player?.tactical_y !== undefined && (
                            <g key={player.id ?? `${player.tactical_x}-${player.tactical_y}`}>
                                {/* glow */}
                                <circle
                                    cx={mapX(player.tactical_x)} cy={mapY(player.tactical_y)} r="1.8"
                                    fill={player.team === 'home' ? 'rgba(59,130,246,0.18)' : 'rgba(239,68,68,0.18)'}
                                />
                                {/* dot */}
                                <circle
                                    cx={mapX(player.tactical_x)} cy={mapY(player.tactical_y)} r="1.2"
                                    fill={player.team === 'home' ? '#3b82f6' : '#ef4444'}
                                    stroke="white" strokeWidth="0.3"
                                />
                                {/* ball-possession ring */}
                                {player.has_ball && (
                                    <>
                                        <circle
                                            cx={mapX(player.tactical_x)} cy={mapY(player.tactical_y)} r="2.2"
                                            fill="none" stroke="#fbbf24" strokeWidth="0.35" strokeDasharray="0.8,0.4"
                                        />
                                        <circle
                                            cx={mapX(player.tactical_x)} cy={mapY(player.tactical_y)} r="3"
                                            fill="none"
                                            stroke={player.team === 'home' ? '#60a5fa' : '#f87171'}
                                            strokeWidth="0.2" opacity="0.5"
                                        />
                                    </>
                                )}
                            </g>
                        )
                    )}

                    {/* ════════════ LIVE BALL MARKER ════════════ */}
                    {ball?.tactical_x !== undefined && ball?.tactical_y !== undefined && (
                        <g>
                            <circle
                                cx={mapX(ball.tactical_x)} cy={mapY(ball.tactical_y)} r="1.4"
                                fill="rgba(249,115,22,0.25)"
                            />
                            <circle
                                cx={mapX(ball.tactical_x)} cy={mapY(ball.tactical_y)} r="0.65"
                                fill="#f97316" stroke="white" strokeWidth="0.25"
                            />
                        </g>
                    )}
                </svg>

                {/* Footer HUD */}
                <div className="absolute bottom-2 inset-x-2 flex justify-between items-center text-[9px] tracking-widest uppercase font-black z-10 pointer-events-none">
                    <div className="text-gray-500">
                        BAKO-AI <span className="text-indigo-400">Tactical v2.0</span>
                    </div>
                    <div className="bg-gray-900/50 backdrop-blur-md rounded-full px-3 py-0.5 border border-white/10">
                        <span className="text-emerald-400">Live Telemetry</span>
                    </div>
                </div>
            </div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Possession" value={`${team1Stats?.possession ?? 50}%`} sub="Home"
                    icon={<Activity size={14} className="text-blue-500" />} isDarkMode={isDarkMode} />
                <StatCard label="Possession" value={`${team2Stats?.possession ?? 50}%`} sub="Away"
                    icon={<Activity size={14} className="text-red-500" />} isDarkMode={isDarkMode} />
                <StatCard label="Passes" value={team1Stats?.passes ?? '0'} sub="Home"
                    icon={<Zap size={14} className="text-yellow-500" />} isDarkMode={isDarkMode} />
                <StatCard label="Passes" value={team2Stats?.passes ?? '0'} sub="Away"
                    icon={<Zap size={14} className="text-yellow-500" />} isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, sub, icon, isDarkMode }) => (
    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{label}</span>
            {icon}
        </div>
        <div className="flex items-baseline space-x-1">
            <span className="text-lg font-black">{value}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">{sub}</span>
        </div>
    </div>
);

export default TacticalBoard;
