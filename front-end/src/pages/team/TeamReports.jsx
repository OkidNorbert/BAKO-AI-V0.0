import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import { showToast } from '../../components/shared/Toast';
import {
    BarChart2, Trophy, Users, ChevronDown, ChevronRight,
    Calendar, MapPin, Loader2, FileBarChart, Upload
} from 'lucide-react';

// ─────────────────────────────
// Helpers
// ─────────────────────────────
const pct = (made, att) => (att > 0 ? `${Math.round((made / att) * 100)}%` : '—');
const fmtScore = (m) => m?.score_us != null ? `${m.score_us} – ${m.score_against ?? m.score_them}` : 'N/A';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STAT_COLS = [
    { key: 'mins', label: 'MIN' },
    { key: 'pts', label: 'PTS' },
    { key: 'reb', label: 'REB' },
    { key: 'ast', label: 'AST' },
    { key: 'stl', label: 'STL' },
    { key: 'blk', label: 'BLK' },
    { key: 'to_cnt', label: 'TO' },
    { key: 'pf', label: 'PF' },
    { key: 'fgm', label: 'FGM' },
    { key: 'fga', label: 'FGA' },
    { key: 'ft_m', label: 'FTM' },
    { key: 'ft_a', label: 'FTA' },
    { key: 'plus_minus', label: '+/-' },
];

// ─────────────────────────────
// Sub-component: Box Score table
// ─────────────────────────────
const BoxScoreTable = ({ stats, isDarkMode }) => {
    if (!stats || stats.length === 0) {
        return (
            <div className={`text-center py-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No player stats found for this match. Upload a box score to add stats.
            </div>
        );
    }

    const th = `px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const td = `px-3 py-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`;

    return (
        <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className={isDarkMode ? 'bg-gray-900/60' : 'bg-gray-100'}>
                        <th className={`${th} min-w-[140px]`}>#  Player</th>
                        <th className={`${th} min-w-[60px]`}>POS</th>
                        {STAT_COLS.map(c => <th key={c.key} className={`${th} text-center min-w-[42px]`}>{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {stats.map((row, i) => (
                        <tr
                            key={row.id || i}
                            className={`border-t transition-colors ${isDarkMode
                                    ? 'border-gray-700/40 hover:bg-gray-700/30'
                                    : 'border-gray-100 hover:bg-orange-50'
                                }`}
                        >
                            <td className={`${td} font-medium`}>
                                <span className={`inline-block w-6 text-center text-xs font-bold rounded mr-2 px-1 ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                    {row.player_jersey ?? '—'}
                                </span>
                                {row.player_name || 'Unknown'}
                            </td>
                            <td className={`${td} text-xs`}>{row.player_position || '—'}</td>
                            {STAT_COLS.map(c => (
                                <td key={c.key} className={`${td} text-center font-mono`}>
                                    {c.key === 'plus_minus' && row[c.key] != null
                                        ? <span className={row[c.key] >= 0 ? 'text-green-500' : 'text-red-400'}>
                                            {row[c.key] >= 0 ? '+' : ''}{row[c.key]}
                                        </span>
                                        : (row[c.key] ?? 0)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─────────────────────────────
// Sub-component: Match Card
// ─────────────────────────────
const MatchCard = ({ match, isDarkMode }) => {
    const [expanded, setExpanded] = useState(false);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggle = async () => {
        if (!expanded && stats === null) {
            setLoading(true);
            try {
                const res = await adminAPI.getMatchPlayerStats(match.id);
                setStats(res.data?.stats || []);
            } catch (e) {
                showToast('Could not load player stats', 'error');
                setStats([]);
            } finally {
                setLoading(false);
            }
        }
        setExpanded(v => !v);
    };

    const won = match.score_us != null && match.score_them != null && match.score_us > match.score_them;
    const lost = match.score_us != null && match.score_them != null && match.score_us < match.score_them;

    return (
        <div className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
            }`}>
            {/* Header */}
            <button
                onClick={toggle}
                className="w-full text-left p-5 flex items-center gap-4"
            >
                {/* Result badge */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${won ? 'bg-green-500/20 text-green-500' :
                        lost ? 'bg-red-500/20 text-red-400' :
                            isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {won ? 'W' : lost ? 'L' : '–'}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-base truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            vs {match.opponent || 'Unknown'}
                        </span>
                        {(match.score_us != null) && (
                            <span className={`text-sm font-mono font-semibold px-2 py-0.5 rounded ${won ? 'bg-green-500/20 text-green-400' :
                                    lost ? 'bg-red-500/20 text-red-400' :
                                        isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                                }`}>
                                {match.score_us} – {match.score_them}
                            </span>
                        )}
                    </div>
                    <div className={`flex items-center gap-3 mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(match.date)}</span>
                        {match.location && <span className="flex items-center gap-1"><MapPin size={11} />{match.location}</span>}
                        {match.competition && <span>· {match.competition}</span>}
                    </div>
                </div>

                <div className={`flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
            </button>

            {/* Box Score Panel */}
            {expanded && (
                <div className={`border-t px-5 pb-5 pt-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    {loading
                        ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
                        : <BoxScoreTable stats={stats} isDarkMode={isDarkMode} />
                    }
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────
// TeamReports: Main Page
// ─────────────────────────────
const TeamReports = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const load = async () => {
            try {
                const res = await adminAPI.getMatches();
                const sorted = (res.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
                setMatches(sorted);
            } catch (e) {
                showToast('Failed to load matches', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = matches.filter(m =>
        !search || (m.opponent || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.location || '').toLowerCase().includes(search.toLowerCase())
    );

    const wins = matches.filter(m => m.score_us != null && m.score_us > m.score_them).length;
    const losses = matches.filter(m => m.score_us != null && m.score_us < m.score_them).length;

    const base = `min-h-screen p-4 md:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`;
    const card = `rounded-2xl border p-5 ${isDarkMode ? 'bg-gray-800/60 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;

    if (loading) return (
        <div className={`${base} flex items-center justify-center`}>
            <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
    );

    return (
        <div className={base}>
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                        Match Reports
                    </h1>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Official box scores from imported match stats
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Matches', value: matches.length, icon: Trophy, color: 'text-orange-500' },
                        { label: 'Wins', value: wins, icon: BarChart2, color: 'text-green-500' },
                        { label: 'Losses', value: losses, icon: FileBarChart, color: 'text-red-400' },
                        { label: 'Win Rate', value: matches.length ? `${Math.round((wins / matches.length) * 100)}%` : '—', icon: Users, color: 'text-purple-500' },
                    ].map(s => (
                        <div key={s.label} className={card}>
                            <div className="flex items-center gap-3 mb-2">
                                <s.icon size={18} className={s.color} />
                                <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</span>
                            </div>
                            <p className="text-3xl font-bold">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search by opponent or location..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500/30 transition-all text-sm ${isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-orange-500'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-orange-400'
                        }`}
                />

                {/* Match list */}
                {filtered.length === 0 ? (
                    <div className={`text-center py-20 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-semibold text-lg">No matches found</p>
                        <p className="text-sm mt-1">
                            {matches.length === 0
                                ? 'Create a match and upload a box score to get started.'
                                : 'Try adjusting your search.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(m => (
                            <MatchCard key={m.id} match={m} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamReports;
