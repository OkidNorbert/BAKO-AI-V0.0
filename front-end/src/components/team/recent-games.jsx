import React from 'react';
import { format } from 'date-fns';

const GameItem = ({ game }) => {
  const getGameIcon = (type) => {
    switch (type) {
      case 'win': return '🏆';
      case 'loss': return '❌';
      case 'draw': return '🤝';
      case 'analysis': return '🧠';
      case 'training': return '🏀';
      case 'video': return '🎥';
      default: return '📝';
    }
  };

  const getGameColor = (type) => {
    switch (type) {
      case 'win': return 'text-green-500';
      case 'loss': return 'text-red-500';
      case 'draw': return 'text-yellow-500';
      case 'analysis': return 'text-purple-500';
      case 'training': return 'text-blue-500';
      case 'video': return 'text-indigo-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <div className="text-2xl">{getGameIcon(game.type)}</div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${getGameColor(game.type)}`}>{game.title}</p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate mt-1">{game.description}</p>
      </div>
      <div className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
        {format(new Date(game.date), 'MMM d, p')}
      </div>
    </div>
  );
};

const RecentGames = ({ games = [] }) => {
  return (
    <div className="space-y-3">
      {(!games || games.length === 0) ? (
        <p className="text-center text-gray-500 py-6 font-bold text-sm tracking-wide uppercase">No recent activity</p>
      ) : (
        games.map((game, idx) => <GameItem key={game.id || idx} game={game} />)
      )}
    </div>
  );
};

export default RecentGames;