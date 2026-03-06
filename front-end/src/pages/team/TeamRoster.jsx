import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  User, Calendar, Activity, Search, Filter, Eye, RefreshCw, UserCheck, UserX, TrendingUp, ArrowUpDown, Trash, Link2, Plus
} from 'lucide-react';
import { showToast } from '@/components/shared/Toast';

const TeamRoster = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getRoster();
      setPlayers(response.data || []);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch roster. Please try again later.');
      showToast('Failed to load roster', 'error');
      setPlayers([]);
      setLoading(false);
    }
  };

  const handleToggleStatus = async (player) => {
    try {
      const newStatus = player.status === 'active' ? 'inactive' : 'active';
      await adminAPI.updatePlayerStatus(player.id, newStatus);
      setPlayers(players.map(p => p.id === player.id ? { ...p, status: newStatus } : p));
      showToast(`Player ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch (error) {
      showToast('Failed to update player status', 'error');
    }
  };

  const handleLinkAccount = async (player) => {
    const email = window.prompt(`Enter account email for ${player.name} to link their profile:`);
    if (!email || !email.trim()) return;
    try {
      showToast('Linking account...', 'info');
      await adminAPI.linkPlayerAccount(player.id, email.trim());
      showToast(`Account successfully linked to ${player.name}`, 'success');
      fetchPlayers();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to link account', 'error');
    }
  };

  const handleLinkNewAccount = async () => {
    const email = window.prompt(`Enter the player's account email to link them to your roster:`);
    if (!email || !email.trim()) return;
    try {
      showToast('Searching for account...', 'info');
      await adminAPI.linkPlayerAccount('new', email.trim());
      showToast(`Account successfully linked and added to roster`, 'success');
      fetchPlayers();
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to link account', 'error');
    }
  };

  const handleDeletePlayer = async (playerId, playerName) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName} from the roster? This will also unlink their account.`)) return;
    try {
      await adminAPI.deletePlayer(playerId);
      setPlayers(players.filter(p => p.id !== playerId));
      showToast('Player removed from roster successfully', 'success');
    } catch (error) {
      showToast('Failed to remove player from roster', 'error');
    }
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name': comparison = (a.name || '').localeCompare(b.name || ''); break;
        case 'position': comparison = (a.position || '').localeCompare(b.position || ''); break;
        case 'status': comparison = (a.status || '').localeCompare(b.status || ''); break;
        case 'ppg': comparison = (a.ppg || 0) - (b.ppg || 0); break;
        default: comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredPlayers = sortData(players.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (p.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Active Roster</h1>
          <p className="text-xl text-gray-500">
            Manage and monitor your <span className="text-orange-500 font-black">elite athletes</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={fetchPlayers} className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-white/5 hover:bg-white/10 border border-white/10 text-white">
            <RefreshCw size={16} className="mr-2" /> Refresh
          </button>
          <button onClick={handleLinkNewAccount} className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            <Link2 size={16} className="mr-2" /> Link Account
          </button>
          <Link to="/team/reports" className="flex items-center px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <TrendingUp size={16} className="mr-2" /> Stats
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-6 glass rounded-3xl border-l-4 border-amber-500 text-amber-400 font-bold animate-in fade-in">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-3xl glass-dark border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Total Players</span>
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="text-4xl font-black text-white mt-1">{players.length}</div>
        </div>
        <div className="p-6 rounded-3xl glass-dark border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Active Roster</span>
            <UserCheck className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-4xl font-black text-green-500 mt-1">{players.filter(p => p.status === 'active').length}</div>
        </div>
        <div className="p-6 rounded-3xl glass-dark border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Injured/Reserve</span>
            <Activity className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-4xl font-black text-red-500 mt-1">{players.filter(p => p.status !== 'active').length}</div>
        </div>
        <div className="p-6 rounded-3xl glass-dark border border-white/5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">Avg PPG</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-4xl font-black text-blue-500 mt-1">
            {players.length > 0 ? (players.reduce((acc, p) => acc + Number(p.ppg || 0), 0) / players.length).toFixed(1) : '0.0'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-6 rounded-3xl glass-dark border border-white/5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search roster..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-bold"
          />
        </div>
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
          <Filter size={18} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-white font-bold focus:outline-none focus:ring-0 appearance-none pr-8 cursor-pointer"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="active" className="bg-gray-900">Active</option>
            <option value="inactive" className="bg-gray-900">Inactive</option>
            <option value="injured" className="bg-gray-900">Injured</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-[3rem] overflow-hidden glass-dark border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-gray-500">
                <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">Name {sortBy === 'name' && <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}</div>
                </th>
                <th className="px-8 py-6">Jersey</th>
                <th className="px-8 py-6">Position</th>
                <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-2">Status {sortBy === 'status' && <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}</div>
                </th>
                <th className="px-8 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('ppg')}>
                  <div className="flex items-center gap-2">PPG {sortBy === 'ppg' && <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />}</div>
                </th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map(player => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <User size={20} />
                        </div>
                        <div>
                          <div className="font-black text-white text-base">{player.name}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{player.id.substring(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-gray-400 text-lg">#{player.jersey_number || '00'}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] uppercase font-black tracking-widest">
                        {player.position || 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button
                        onClick={() => handleToggleStatus(player)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] uppercase font-black tracking-widest border transition-colors ${
                          player.status === 'active' ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' : 
                          'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        {player.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {player.status}
                      </button>
                    </td>
                    <td className="px-8 py-6 font-black text-white text-lg">{player.ppg || '0.0'}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/team/players/${player.id}`} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title="View Profile">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => handleLinkAccount(player)} className={`p-3 rounded-xl transition-colors border ${player.user_id ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-transparent hover:border-white/10 text-gray-400 hover:text-white'}`} title={player.user_id ? "Account Linked" : "Link User Account"}>
                          <Link2 size={18} />
                        </button>
                        <button onClick={() => handleDeletePlayer(player.id, player.name)} className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 text-gray-400 hover:text-red-500 transition-colors" title="Remove Player">
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">
                        <User size={40} />
                      </div>
                      <p className="text-xl font-black text-white">No Athletes Found</p>
                      <p className="text-gray-500 font-bold mb-4">Your roster is currently empty or no players match your filters.</p>
                      {(searchTerm === '' && statusFilter === 'all') && (
                        <button onClick={handleLinkNewAccount} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                          <Link2 size={18} /> Link First Player
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamRoster;