import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { showToast } from '../../components/shared/Toast';
import {
    BarChart2, Trophy, Users, ChevronDown, ChevronRight,
    Calendar, MapPin, Loader2, FileBarChart
} from 'lucide-react';

// ─────────────────────────────
// Helpers
// ─────────────────────────────
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
const BoxScoreTable = ({ stats }) => {
    if (!stats || stats.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-gray-400 font-medium">
                No player stats found for this match. Upload a box score to add stats.
            </div>
        );
    }

    const th = `px-4 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-500`;
    const td = `px-4 py-4 text-sm font-bold text-gray-200`;

    return (
        <div className="overflow-x-auto rounded-[2rem] border border-white/5 bg-gray-900/30">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                        <th className={`${th} min-w-[160px]`}>#  Player</th>
                        <th className={`${th} min-w-[80px]`}>POS</th>
                        {STAT_COLS.map(c => <th key={c.key} className={`${th} text-center min-w-[50px]`}>{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {stats.map((row, i) => (
                        <tr
                            key={row.id || i}
                            className={`border-b border-white/5 transition-colors hover:bg-white/5 last:border-0`}
                        >
                            <td className={`${td} flex items-center gap-3`}>
                                <span className={`flex items-center justify-center w-8 h-8 text-[10px] font-black rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20`}>
                                    {row.player_jersey ?? '—'}
                                </span>
                                {row.player_name || 'Unknown'}
                            </td>
                            <td className={`${td} text-xs text-gray-400 font-medium`}>{row.player_position || '—'}</td>
                            {STAT_COLS.map(c => (
                                <td key={c.key} className={`${td} text-center`}>
                                    {c.key === 'plus_minus' && row[c.key] != null
                                        ? <span className={row[c.key] >= 0 ? 'text-green-400' : 'text-red-400'}>
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
const MatchCard = ({ match }) => {
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
        <div className={`rounded-[2rem] glass-dark border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 group mb-6`}>
            <button
                onClick={toggle}
                className="w-full text-left p-6 sm:p-8 flex items-center gap-6 relative"
            >
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-premium transition-transform duration-300 group-hover:scale-110 ${
                    won ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                    lost ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                    'bg-white/5 text-gray-400 border border-white/10'
                }`}>
                    {won ? 'W' : lost ? 'L' : '–'}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                        <span className={`text-xl sm:text-2xl font-black tracking-tight text-white truncate`}>
                            vs {match.opponent || 'Unknown'}
                        </span>
                        {(match.score_us != null) && (
                            <span className={`inline-flex self-start sm:self-auto items-center px-4 py-1.5 rounded-full text-sm font-black tracking-widest ${
                                won ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                lost ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-white/5 text-gray-400 border border-white/10'
                            }`}>
                                {match.score_us} – {match.score_them}
                            </span>
                        )}
                    </div>
                    <div className={`flex items-center flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-gray-500 opacity-80`}>
                        <span className="flex items-center gap-2"><Calendar size={14} className="text-orange-500" />{fmtDate(match.date)}</span>
                        {match.location && <span className="flex items-center gap-2"><MapPin size={14} className="text-orange-500" />{match.location}</span>}
                        {match.competition && <span>· {match.competition}</span>}
                    </div>
                </div>

                <div className={`flex-shrink-0 w-12 h-12 rounded-full glass flex items-center justify-center border border-white/5 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180 bg-white/10 text-white' : 'group-hover:bg-white/5'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>

            {expanded && (
                <div className="border-t border-white/5 p-6 sm:p-8 pt-0 animate-in slide-in-from-top-4 fade-in duration-300">
                    {loading
                        ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
                        : <BoxScoreTable stats={stats} />
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

    if (loading) return (
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" size={48} strokeWidth={3} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f1115] text-white p-6 md:p-12 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-12 relative z-10 w-full flex-grow">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest mb-4">
                            <FileBarChart className="h-3 w-3" /> Box Scores
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                            Match Reports
                        </h1>
                        <p className="text-gray-400 font-medium max-w-xl text-lg">
                            Review team performance and official box scores from past matchups.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Matches', value: matches.length, icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                        { label: 'Wins', value: wins, icon: BarChart2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                        { label: 'Losses', value: losses, icon: FileBarChart, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                        { label: 'Win Rate', value: matches.length ? `${Math.round((wins / matches.length) * 100)}%` : '—', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    ].map((s, i) => (
                        <div key={i} className="glass-dark p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2.5 rounded-xl ${s.bg} ${s.border} border`}>
                                        <s.icon size={20} className={s.color} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</span>
                                </div>
                                <p className="text-4xl font-black tracking-tight">{s.value}</p>
                            </div>
                            <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full ${s.bg} blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        </div>
                    ))}
                </div>

                <div className="relative max-w-2xl">
                    <input
                        type="text"
                        placeholder="Search by opponent or location..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-8 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-white placeholder-gray-500 font-bold focus:bg-white/10 focus:border-orange-500/50 outline-none transition-all duration-300"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-24 glass-dark rounded-[3rem] border border-white/5">
                        <Trophy size={64} className="mx-auto mb-6 opacity-20 text-orange-500" />
                        <h3 className="text-2xl font-black tracking-tight mb-2">No Match Records Found</h3>
                        <p className="text-gray-400 font-medium">
                            {matches.length === 0
                                ? 'Upload box scores in Match Analysis to see them here.'
                                : 'Try adjusting your search filters.'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {filtered.map(m => (
                            <MatchCard key={m.id} match={m} />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 mt-24 opacity-20" />
        </div>
    );
};

export default TeamReports;
